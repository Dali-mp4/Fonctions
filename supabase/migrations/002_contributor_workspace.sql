-- Algo Fi Jib 2.0 / milestone 2: editable private drafts and reviewer feedback.
-- Run AFTER 001_initial_schema.sql in the Supabase SQL Editor (once per project).
-- No client may mark test_status='passed' or publish untested source code.

-- Only the author of a still-private revision can edit it. Optimistic locking
-- prevents an older browser tab from silently replacing newer saved work.
CREATE OR REPLACE FUNCTION public.update_draft(
  p_revision uuid, p_expected_edit_seq integer,
  p_title text, p_explanation text, p_pseudocode text, p_python_code text
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE new_seq integer;
BEGIN
  IF (SELECT auth.uid()) IS NULL
     OR public.current_role() NOT IN ('contributor', 'reviewer', 'owner') THEN
    RAISE EXCEPTION 'Contributor access required';
  END IF;
  IF p_expected_edit_seq < 1 OR p_expected_edit_seq IS NULL
     OR length(btrim(coalesce(p_title, ''))) NOT BETWEEN 5 AND 160
     OR length(btrim(coalesce(p_explanation, ''))) NOT BETWEEN 15 AND 20000
     OR length(coalesce(p_python_code, '')) NOT BETWEEN 10 AND 30000
     OR length(coalesce(p_pseudocode, '')) > 30000 THEN
    RAISE EXCEPTION 'Invalid draft content';
  END IF;

  UPDATE public.revisions SET
    title = btrim(p_title), explanation = btrim(p_explanation),
    pseudocode = coalesce(p_pseudocode, ''), python_code = p_python_code,
    status = 'draft', edit_seq = edit_seq + 1,
    -- Any edit invalidates ALL earlier testing and review decisions.
    test_status = 'not_run', test_evidence = '{}'::jsonb,
    reviewer_id = NULL, review_note = NULL, reviewed_at = NULL,
    updated_at = now()
  WHERE id = p_revision AND created_by = (SELECT auth.uid())
    AND status IN ('draft', 'changes_requested')
    AND edit_seq = p_expected_edit_seq
  RETURNING edit_seq INTO new_seq;

  IF new_seq IS NULL THEN
    RAISE EXCEPTION 'Draft unavailable or changed in another tab. Reload before editing.';
  END IF;

  INSERT INTO public.audit_events(actor_id, revision_id, action, details)
  VALUES ((SELECT auth.uid()), p_revision, 'draft_updated',
          jsonb_build_object('edit_seq', new_seq));
  RETURN new_seq;
END $$;

REVOKE ALL ON FUNCTION public.update_draft(uuid, integer, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_draft(uuid, integer, text, text, text, text) TO authenticated;

-- Reviewer can request changes only to a submitted, non-self-authored revision.
-- This cannot be triggered on a private draft or published content.
CREATE OR REPLACE FUNCTION public.request_revision_changes(
  p_revision uuid, p_note text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL
     OR public.current_role() NOT IN ('reviewer', 'owner') THEN
    RAISE EXCEPTION 'Reviewer access required';
  END IF;
  IF length(btrim(coalesce(p_note, ''))) NOT BETWEEN 10 AND 2000 THEN
    RAISE EXCEPTION 'Review feedback must contain 10 to 2000 characters';
  END IF;

  UPDATE public.revisions SET
    status = 'changes_requested',
    reviewer_id = (SELECT auth.uid()),
    review_note = btrim(p_note),
    reviewed_at = now(), updated_at = now()
  WHERE id = p_revision
    AND status = 'submitted' AND created_by <> (SELECT auth.uid());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only someone else''s submitted revision can be reviewed';
  END IF;

  INSERT INTO public.audit_events(actor_id, revision_id, action)
  VALUES ((SELECT auth.uid()), p_revision, 'changes_requested');
END $$;

REVOKE ALL ON FUNCTION public.request_revision_changes(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_revision_changes(uuid, text) TO authenticated;

-- Make permissions explicit for newly created Supabase projects: since May 2026,
-- public tables are no longer automatically exposed to the Data API.
GRANT SELECT ON public.profiles, public.topics,
  public.implementations, public.revisions TO authenticated;
GRANT SELECT ON public.topics, public.implementations, public.revisions TO anon;
-- Never make private audit events or direct content edits browser-writable.
REVOKE INSERT, UPDATE, DELETE ON public.profiles, public.topics,
  public.implementations, public.revisions, public.audit_events
  FROM anon, authenticated;
