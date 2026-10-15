-- 011: Resume a withdrawn, previously approved revision as a new private draft.
-- Preserve immutable published history; reset tests and require new approval.
CREATE OR REPLACE FUNCTION public.reopen_archived_revision_as_draft(p_revision uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  actor uuid := (SELECT auth.uid());
  source_revision public.revisions%ROWTYPE;
  parent_impl public.implementations%ROWTYPE;
  new_revision_id uuid;
BEGIN
  IF actor IS NULL OR public.current_role() NOT IN ('contributor','reviewer','owner') THEN
    RAISE EXCEPTION 'Contributor access required';
  END IF;

  SELECT * INTO source_revision FROM public.revisions
    WHERE id=p_revision FOR UPDATE;
  IF NOT FOUND OR source_revision.status <> 'archived'
     OR source_revision.created_by <> actor
     OR source_revision.reviewer_id IS NULL
     OR source_revision.reviewer_id=source_revision.created_by
     OR source_revision.reviewed_at IS NULL THEN
    RAISE EXCEPTION 'Only your previously approved archived revision may be reused';
  END IF;

  SELECT * INTO parent_impl FROM public.implementations
    WHERE id=source_revision.implementation_id FOR UPDATE;
  IF NOT FOUND OR parent_impl.created_by <> actor
     OR parent_impl.published_revision_id IS NOT NULL
     OR parent_impl.archived_at IS NULL THEN
    RAISE EXCEPTION 'This implementation has not been withdrawn';
  END IF;

  -- Avoid accidentally producing many simultaneous drafts of the same method.
  IF EXISTS (
    SELECT 1 FROM public.revisions
    WHERE implementation_id=parent_impl.id
      AND status IN ('draft','changes_requested','submitted')
  ) THEN
    RAISE EXCEPTION 'An editable or submitted version already exists for this implementation';
  END IF;

  PERFORM public.validate_lesson_content(source_revision.lesson_content);
  PERFORM public.validate_function_contract(
    source_revision.entry_function,
    source_revision.input_schema,
    source_revision.test_cases
  );

  INSERT INTO public.revisions(
    implementation_id, created_by, title, explanation, pseudocode, python_code,
    entry_function, input_schema, test_cases, lesson_content,
    status, test_status, test_evidence, edit_seq,
    reviewer_id, reviewed_at, review_note, submitted_at
  ) VALUES (
    parent_impl.id, actor, source_revision.title, source_revision.explanation,
    source_revision.pseudocode, source_revision.python_code,
    source_revision.entry_function, source_revision.input_schema,
    source_revision.test_cases, source_revision.lesson_content,
    'draft', 'not_run', '{}'::jsonb, 1, NULL, NULL, NULL, NULL
  ) RETURNING id INTO new_revision_id;

  INSERT INTO public.audit_events(actor_id, revision_id, action, details)
    VALUES (actor, new_revision_id, 'draft_created',
      jsonb_build_object('source_archived_revision',p_revision,'kind','revision_from_withdrawal'));
  RETURN new_revision_id;
END $function$;
REVOKE ALL ON FUNCTION public.reopen_archived_revision_as_draft(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reopen_archived_revision_as_draft(uuid) TO authenticated;
