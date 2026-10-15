-- 013: Owner-only permanent deletion of database implementations and custom modules.
-- A module can contain multiple implementations/versions. Purging irreversibly removes
-- their tests, published execution history, approval audits and translations.
-- Keep a metadata-only audit event for the deletion itself, with no source code.
-- Seven Git-tracked legacy modules cannot be deleted from the database.
--
-- No direct DELETE grants are added: all mutation paths check auth.uid() and owner.
CREATE FUNCTION public._owner_purge_implementation_rows(p_implementation uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  row_impl public.implementations%ROWTYPE;
  num_revisions integer;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR public.current_role() <> 'owner' THEN
    RAISE EXCEPTION 'Owner access required';
  END IF;
  SELECT * INTO row_impl FROM public.implementations
    WHERE id=p_implementation FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Implementation not found'; END IF;

  SELECT count(*) INTO num_revisions FROM public.revisions
    WHERE implementation_id=p_implementation;

  -- Break the cyclic publication FK before purging revisions.
  UPDATE public.implementations SET published_revision_id=NULL
    WHERE id=p_implementation;
  -- Foreign key children of revisions use RESTRICT, so delete in dependency order.
  DELETE FROM public.audit_events WHERE revision_id IN
    (SELECT id FROM public.revisions WHERE implementation_id=p_implementation);
  DELETE FROM public.draft_test_runs WHERE revision_id IN
    (SELECT id FROM public.revisions WHERE implementation_id=p_implementation);
  DELETE FROM public.public_method_runs WHERE revision_id IN
    (SELECT id FROM public.revisions WHERE implementation_id=p_implementation);
  -- Existing revision_translations records cascade with revision removal.
  DELETE FROM public.revisions WHERE implementation_id=p_implementation;
  DELETE FROM public.implementations WHERE id=p_implementation;
  RETURN num_revisions;
END $$;
REVOKE ALL ON FUNCTION public._owner_purge_implementation_rows(uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.owner_delete_implementation(p_implementation uuid, p_confirmation text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  item public.implementations%ROWTYPE;
  module_slug text;
  removed_versions integer;
  was_published boolean;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR public.current_role() <> 'owner' THEN
    RAISE EXCEPTION 'Owner access required';
  END IF;
  IF p_confirmation IS DISTINCT FROM 'SUPPRIMER' THEN
    RAISE EXCEPTION 'Exact deletion confirmation required';
  END IF;

  SELECT * INTO item FROM public.implementations
    WHERE id=p_implementation FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Implementation not found'; END IF;
  SELECT slug INTO module_slug FROM public.topics WHERE id=item.topic_id;
  was_published := item.published_revision_id IS NOT NULL;
  removed_versions := public._owner_purge_implementation_rows(p_implementation);

  INSERT INTO public.audit_events(actor_id,action,details)
    VALUES ((SELECT auth.uid()),'implementation_deleted',
      jsonb_build_object('implementation_id',p_implementation,'topic_slug',module_slug,
        'method_type',item.method_type,'revisions_deleted',removed_versions,
        'was_published',was_published));
  RETURN jsonb_build_object('revisions_deleted',removed_versions);
END $$;
REVOKE ALL ON FUNCTION public.owner_delete_implementation(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.owner_delete_implementation(uuid,text) TO authenticated;

CREATE FUNCTION public.owner_delete_module(p_topic uuid, p_confirmation text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  item public.topics%ROWTYPE;
  impl_id uuid;
  removed_impls integer := 0;
  removed_versions integer := 0;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR public.current_role() <> 'owner' THEN
    RAISE EXCEPTION 'Owner access required';
  END IF;
  IF p_confirmation IS DISTINCT FROM 'SUPPRIMER' THEN
    RAISE EXCEPTION 'Exact deletion confirmation required';
  END IF;

  SELECT * INTO item FROM public.topics WHERE id=p_topic FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Module not found'; END IF;
  -- These seven built-ins are still present in the version-controlled
  -- website and API; deleting a DB row cannot remove the real built-in module.
  IF item.slug IN ('pgcd','ppcm','verif','som-ch','tableau','matrice','enregistrement')
     OR EXISTS(SELECT 1 FROM public.legacy_lessons WHERE slug=item.slug) THEN
    RAISE EXCEPTION 'Original built-in modules cannot be deleted';
  END IF;

  FOR impl_id IN SELECT id FROM public.implementations
    WHERE topic_id=p_topic ORDER BY id FOR UPDATE LOOP
    removed_versions := removed_versions +
      public._owner_purge_implementation_rows(impl_id);
    removed_impls := removed_impls+1;
  END LOOP;

  DELETE FROM public.topics WHERE id=p_topic;
  INSERT INTO public.audit_events(actor_id,action,details)
    VALUES ((SELECT auth.uid()),'module_deleted',
      jsonb_build_object('topic_id',p_topic,'slug',item.slug,
        'implementations_deleted',removed_impls,'revisions_deleted',removed_versions));
  RETURN jsonb_build_object('implementations_deleted',removed_impls,
     'revisions_deleted',removed_versions);
END $$;
REVOKE ALL ON FUNCTION public.owner_delete_module(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.owner_delete_module(uuid,text) TO authenticated;
