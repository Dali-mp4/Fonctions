-- 014: Permanently remove one redundant PRIVATE draft, without touching the
-- active publication or any other version of the same implementation.
-- Reviewer-approved, submitted, archived and published revisions are protected.
CREATE FUNCTION public.owner_delete_draft_revision(
  p_revision uuid, p_expected_edit_seq integer, p_confirmation text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  actor uuid := (SELECT auth.uid());
  item public.revisions%ROWTYPE;
  impl public.implementations%ROWTYPE;
  topic_slug text;
  remaining_count integer;
BEGIN
  IF actor IS NULL OR public.current_role() <> 'owner' THEN
    RAISE EXCEPTION 'Owner access required';
  END IF;
  IF p_confirmation IS DISTINCT FROM 'SUPPRIMER' THEN
    RAISE EXCEPTION 'Exact deletion confirmation required';
  END IF;
  SELECT * INTO item FROM public.revisions WHERE id=p_revision FOR UPDATE;
  IF NOT FOUND OR item.status <> 'draft'
     OR item.edit_seq IS DISTINCT FROM p_expected_edit_seq THEN
    RAISE EXCEPTION 'Only an unchanged, private draft can be deleted. Refresh El studio.';
  END IF;
  SELECT * INTO impl FROM public.implementations
    WHERE id=item.implementation_id FOR UPDATE;
  IF NOT FOUND OR impl.published_revision_id IS NOT DISTINCT FROM p_revision THEN
    RAISE EXCEPTION 'A published version cannot be deleted here';
  END IF;
  -- Prevent leaving behind an implementation without any revision.
  SELECT count(*) INTO remaining_count FROM public.revisions
    WHERE implementation_id=impl.id AND id<>p_revision;
  IF remaining_count=0 THEN
    RAISE EXCEPTION 'This is the only version; delete the implementation instead';
  END IF;
  SELECT slug INTO topic_slug FROM public.topics WHERE id=impl.topic_id;
  -- These rows reference the discarded draft via restrictive foreign keys.
  DELETE FROM public.audit_events WHERE revision_id=p_revision;
  DELETE FROM public.draft_test_runs WHERE revision_id=p_revision;
  DELETE FROM public.public_method_runs WHERE revision_id=p_revision;
  -- The old localization table has ON DELETE CASCADE on revision_id.
  DELETE FROM public.revisions WHERE id=p_revision;
  IF NOT FOUND THEN RAISE EXCEPTION 'Draft already deleted'; END IF;
  INSERT INTO public.audit_events(actor_id,action,details)
    VALUES(actor,'draft_revision_deleted',
      jsonb_build_object('revision_id',p_revision,'implementation_id',impl.id,
        'topic_slug',topic_slug,'edit_seq',item.edit_seq,
        'remaining_versions',remaining_count));
END $$;
REVOKE ALL ON FUNCTION public.owner_delete_draft_revision(uuid,integer,text)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.owner_delete_draft_revision(uuid,integer,text)
  TO authenticated;
