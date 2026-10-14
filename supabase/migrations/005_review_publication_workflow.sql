-- Phase 4: audit-safe submission, review and publication workflow.
-- Apply exactly once AFTER 004_verified_sandbox_testing.sql.
-- IMPORTANT: Only tested, unchanged drafts may be submitted; only another
-- reviewer/owner may publish. Contributors cannot mutate published revisions.

ALTER TABLE public.revisions
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- This helper reads the trusted reservation + finalized evidence, rather than
-- accepting a browser-provided "passed" flag. Only privileged RPCs can call it.
CREATE OR REPLACE FUNCTION public.revision_has_verified_tests(
  p_revision uuid, p_edit_seq integer
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.revisions r
    JOIN public.draft_test_runs t ON t.revision_id = r.id
    WHERE r.id = p_revision AND r.edit_seq = p_edit_seq
      AND r.test_status = 'passed'
      AND r.test_evidence->>'runner' = 'modal-sandbox-v1'
      AND r.test_evidence->>'edit_seq' = r.edit_seq::text
      AND r.test_evidence->>'run_id' = t.id::text
      AND r.test_evidence->>'code_sha256' ~ '^[0-9a-f]{64}$'
      AND r.test_evidence->>'case_count' = jsonb_array_length(r.test_cases)::text
      AND jsonb_array_length(r.test_cases) BETWEEN 1 AND 20
      AND jsonb_typeof(r.test_evidence->'results') = 'array'
      AND jsonb_array_length(r.test_evidence->'results') = jsonb_array_length(r.test_cases)
      AND NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(r.test_evidence->'results') item
        WHERE item->>'passed' IS DISTINCT FROM 'true'
      )
      AND t.status = 'passed' AND t.actor_id = r.created_by
      AND t.edit_seq = r.edit_seq AND t.evidence = r.test_evidence
  );
$$;
REVOKE ALL ON FUNCTION public.revision_has_verified_tests(uuid,integer)
  FROM PUBLIC, anon, authenticated;

-- Remove Phase 1's old unversioned RPC signatures so callers cannot bypass
-- the exact-version check via the legacy functions.
DROP FUNCTION IF EXISTS public.submit_revision(uuid);
DROP FUNCTION IF EXISTS public.approve_revision(uuid);

CREATE FUNCTION public.submit_revision(p_revision uuid, p_expected_edit_seq integer)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE draft public.revisions%ROWTYPE;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR
     public.current_role() NOT IN ('contributor','reviewer','owner') THEN
    RAISE EXCEPTION 'Contributor role required';
  END IF;
  SELECT * INTO draft FROM public.revisions
    WHERE id=p_revision FOR UPDATE;
  IF NOT FOUND OR draft.created_by <> (SELECT auth.uid()) OR
     draft.status NOT IN ('draft','changes_requested') OR
     draft.edit_seq <> p_expected_edit_seq OR
     NOT public.revision_has_verified_tests(p_revision,p_expected_edit_seq) THEN
    RAISE EXCEPTION 'Only your saved, unchanged draft with verified passing tests can be submitted';
  END IF;
  UPDATE public.revisions SET status='submitted', submitted_at=now(),
    reviewer_id=NULL, review_note=NULL, reviewed_at=NULL, updated_at=now()
    WHERE id=p_revision;
  INSERT INTO public.audit_events(actor_id,revision_id,action,details)
    VALUES((SELECT auth.uid()),p_revision,'submitted',
      jsonb_build_object('edit_seq',draft.edit_seq,
                         'test_run_id',draft.test_evidence->>'run_id'));
END $$;
REVOKE ALL ON FUNCTION public.submit_revision(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_revision(uuid,integer) TO authenticated;

-- Any request for revisions must be followed by saving and running fresh tests
-- (even if an author decides not to modify the Python code).
CREATE OR REPLACE FUNCTION public.request_revision_changes(p_revision uuid,p_note text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE item public.revisions%ROWTYPE;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR public.current_role() NOT IN ('reviewer','owner') THEN
    RAISE EXCEPTION 'Reviewer role required';
  END IF;
  IF length(btrim(coalesce(p_note,''))) NOT BETWEEN 10 AND 2000 THEN
    RAISE EXCEPTION 'Review feedback must contain 10 to 2000 characters';
  END IF;
  SELECT * INTO item FROM public.revisions WHERE id=p_revision FOR UPDATE;
  IF NOT FOUND OR item.status <> 'submitted' OR item.created_by=(SELECT auth.uid()) THEN
    RAISE EXCEPTION 'You cannot review your own draft or a non-submitted revision';
  END IF;
  UPDATE public.revisions SET status='changes_requested',
    reviewer_id=(SELECT auth.uid()), review_note=btrim(p_note),
    reviewed_at=now(), updated_at=now(),
    test_status='not_run', test_evidence='{}'::jsonb
    WHERE id=p_revision;
  INSERT INTO public.audit_events(actor_id,revision_id,action,details)
    VALUES((SELECT auth.uid()),p_revision,'changes_requested',
      jsonb_build_object('note',btrim(p_note),'edit_seq',item.edit_seq));
END $$;
REVOKE ALL ON FUNCTION public.request_revision_changes(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.request_revision_changes(uuid,text) TO authenticated;

-- Approved revision text is immutable; the pointer on implementations selects
-- precisely which reviewed version is currently public.
CREATE FUNCTION public.approve_revision(p_revision uuid,p_expected_edit_seq integer)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE item public.revisions%ROWTYPE;
DECLARE impl public.implementations%ROWTYPE;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR public.current_role() NOT IN ('reviewer','owner') THEN
    RAISE EXCEPTION 'Reviewer role required';
  END IF;
  SELECT * INTO item FROM public.revisions WHERE id=p_revision FOR UPDATE;
  IF NOT FOUND OR item.created_by=(SELECT auth.uid()) OR
     item.status <> 'submitted' OR item.edit_seq <> p_expected_edit_seq OR
     NOT public.revision_has_verified_tests(p_revision,p_expected_edit_seq) THEN
    RAISE EXCEPTION 'Submission changed, is untested, or belongs to this reviewer';
  END IF;
  SELECT * INTO impl FROM public.implementations
    WHERE id=item.implementation_id FOR UPDATE;
  IF NOT FOUND OR impl.created_by <> item.created_by THEN
    RAISE EXCEPTION 'Implementation author mismatch';
  END IF;
  IF impl.published_revision_id IS NOT NULL THEN
    -- Defensive: never silently overwrite another implementation's pointer.
    IF NOT EXISTS (SELECT 1 FROM public.revisions
      WHERE id=impl.published_revision_id AND implementation_id=impl.id
      AND status='published') THEN
      RAISE EXCEPTION 'Published version pointer inconsistent';
    END IF;
    UPDATE public.revisions SET status='archived',updated_at=now()
      WHERE id=impl.published_revision_id;
  END IF;
  UPDATE public.revisions SET status='published',reviewer_id=(SELECT auth.uid()),
    review_note=NULL,reviewed_at=now(),updated_at=now()
    WHERE id=p_revision;
  UPDATE public.implementations SET published_revision_id=p_revision,archived_at=NULL
    WHERE id=impl.id;
  INSERT INTO public.audit_events(actor_id,revision_id,action,details)
    VALUES((SELECT auth.uid()),p_revision,'published',
      jsonb_build_object('edit_seq',item.edit_seq,
                         'test_run_id',item.test_evidence->>'run_id',
                         'previous_revision',impl.published_revision_id));
END $$;
REVOKE ALL ON FUNCTION public.approve_revision(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.approve_revision(uuid,integer) TO authenticated;

-- Emergency owner rollback: remove a currently published revision from public
-- visibility without deleting educational content, test runs, or audit trail.
CREATE FUNCTION public.withdraw_published_revision(p_revision uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE item public.revisions%ROWTYPE;
DECLARE impl public.implementations%ROWTYPE;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR public.current_role() <> 'owner' THEN
    RAISE EXCEPTION 'Owner access required';
  END IF;
  SELECT * INTO item FROM public.revisions WHERE id=p_revision FOR UPDATE;
  IF NOT FOUND OR item.status <> 'published' THEN
    RAISE EXCEPTION 'The revision is not currently published';
  END IF;
  SELECT * INTO impl FROM public.implementations
    WHERE id=item.implementation_id FOR UPDATE;
  IF impl.published_revision_id IS DISTINCT FROM p_revision THEN
    RAISE EXCEPTION 'Current published revision has changed';
  END IF;
  UPDATE public.implementations SET published_revision_id=NULL,archived_at=now()
    WHERE id=impl.id;
  UPDATE public.revisions SET status='archived',updated_at=now()
    WHERE id=p_revision;
  INSERT INTO public.audit_events(actor_id,revision_id,action)
    VALUES((SELECT auth.uid()),p_revision,'publication_withdrawn');
END $$;
REVOKE ALL ON FUNCTION public.withdraw_published_revision(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.withdraw_published_revision(uuid) TO authenticated;

-- Owner may restore only a previously approved, unchanged, tested revision.
-- Restoring an unreviewed draft, including owner's own draft, is impossible.
CREATE FUNCTION public.restore_published_revision(p_revision uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE item public.revisions%ROWTYPE;
DECLARE impl public.implementations%ROWTYPE;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR public.current_role() <> 'owner' THEN
    RAISE EXCEPTION 'Owner access required';
  END IF;
  SELECT * INTO item FROM public.revisions WHERE id=p_revision FOR UPDATE;
  IF NOT FOUND OR item.status <> 'archived' OR
    item.reviewer_id IS NULL OR item.reviewer_id=item.created_by OR
    item.reviewed_at IS NULL OR
    NOT public.revision_has_verified_tests(p_revision,item.edit_seq) THEN
    RAISE EXCEPTION 'Only previously reviewed and verified revisions may be restored';
  END IF;
  SELECT * INTO impl FROM public.implementations
    WHERE id=item.implementation_id FOR UPDATE;
  IF NOT FOUND OR impl.created_by <> item.created_by THEN
    RAISE EXCEPTION 'Implementation author mismatch';
  END IF;
  IF impl.published_revision_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.revisions
      WHERE id=impl.published_revision_id AND implementation_id=impl.id
        AND status='published') THEN
      RAISE EXCEPTION 'Published version pointer inconsistent';
    END IF;
    UPDATE public.revisions SET status='archived',updated_at=now()
      WHERE id=impl.published_revision_id;
  END IF;
  UPDATE public.revisions SET status='published',updated_at=now()
    WHERE id=p_revision;
  UPDATE public.implementations SET published_revision_id=p_revision,archived_at=NULL
    WHERE id=impl.id;
  INSERT INTO public.audit_events(actor_id,revision_id,action,details)
    VALUES((SELECT auth.uid()),p_revision,'publication_restored',
      jsonb_build_object('previous_revision',impl.published_revision_id));
END $$;
REVOKE ALL ON FUNCTION public.restore_published_revision(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.restore_published_revision(uuid) TO authenticated;

-- Authors and reviewers can inspect relevant events without granting blanket
-- access to the otherwise owner-only audit_events table.
CREATE FUNCTION public.get_revision_history(p_revision uuid)
RETURNS TABLE(action text, created_at timestamptz, actor_id uuid, details jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.revisions r
      WHERE r.id=p_revision AND
      (r.created_by=(SELECT auth.uid())
       OR public.current_role() IN ('reviewer','owner'))
  ) THEN
    RAISE EXCEPTION 'History access denied';
  END IF;
  RETURN QUERY
    SELECT a.action,a.created_at,a.actor_id,a.details
    FROM public.audit_events a
    WHERE a.revision_id=p_revision
      AND a.action IN ('draft_created','draft_updated','draft_test_passed',
                       'draft_test_failed','draft_test_error',
                       'submitted','changes_requested','published',
                       'publication_withdrawn','publication_restored')
    ORDER BY a.created_at DESC,a.id DESC LIMIT 40;
END $$;
REVOKE ALL ON FUNCTION public.get_revision_history(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_revision_history(uuid) TO authenticated;

-- Browser requests may only call the scoped RPCs above; all direct content
-- and audit writes stay prohibited.
REVOKE INSERT,UPDATE,DELETE ON public.profiles,public.topics,
  public.implementations,public.revisions,public.audit_events,
  public.draft_test_runs FROM anon,authenticated;
