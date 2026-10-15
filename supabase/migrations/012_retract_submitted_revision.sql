-- 012: Author may safely retract a pending submission to edit again.
-- Reset certification + version; require new sandbox tests and independent review.
CREATE OR REPLACE FUNCTION public.retract_submitted_revision(p_revision uuid, p_expected_edit_seq integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  actor uuid := (SELECT auth.uid());
  item public.revisions%ROWTYPE;
  impl public.implementations%ROWTYPE;
  next_seq integer;
BEGIN
  IF actor IS NULL OR public.current_role() NOT IN ('contributor','reviewer','owner') THEN
    RAISE EXCEPTION 'Contributor access required';
  END IF;
  SELECT * INTO item FROM public.revisions WHERE id=p_revision FOR UPDATE;
  IF NOT FOUND OR item.created_by <> actor OR item.status <> 'submitted'
     OR item.edit_seq <> p_expected_edit_seq THEN
    RAISE EXCEPTION 'This submission is no longer pending or has changed. Refresh El studio.';
  END IF;
  SELECT * INTO impl FROM public.implementations
    WHERE id=item.implementation_id FOR UPDATE;
  IF NOT FOUND OR impl.created_by <> actor THEN
    RAISE EXCEPTION 'Implementation author mismatch';
  END IF;
  UPDATE public.revisions SET
    status='draft', edit_seq=edit_seq+1,
    test_status='not_run', test_evidence='{}'::jsonb,
    submitted_at=NULL, reviewer_id=NULL, reviewed_at=NULL, review_note=NULL,
    updated_at=now()
    WHERE id=item.id AND status='submitted' AND edit_seq=p_expected_edit_seq
    RETURNING edit_seq INTO next_seq;
  IF next_seq IS NULL THEN RAISE EXCEPTION 'Submission changed. Refresh El studio.'; END IF;
  INSERT INTO public.audit_events(actor_id,revision_id,action,details)
    VALUES(actor,p_revision,'submission_retracted',
      jsonb_build_object('previous_edit_seq',p_expected_edit_seq,'edit_seq',next_seq));
  RETURN next_seq;
END $function$;
REVOKE ALL ON FUNCTION public.retract_submitted_revision(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.retract_submitted_revision(uuid,integer) TO authenticated;

-- Record retractions in the visible decision history.
CREATE OR REPLACE FUNCTION public.get_revision_history(p_revision uuid)
 RETURNS TABLE(action text, created_at timestamp with time zone, actor_id uuid, details jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
                       'publication_withdrawn','publication_restored',
                       'submission_retracted')
    ORDER BY a.created_at DESC,a.id DESC LIMIT 40;
END $function$;
REVOKE ALL ON FUNCTION public.get_revision_history(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_revision_history(uuid) TO authenticated;
