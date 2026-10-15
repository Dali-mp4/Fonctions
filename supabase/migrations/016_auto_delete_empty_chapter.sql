-- 016: When the owner deletes an implementation, also delete its custom chapter
-- if and only if no other implementation remains there.
-- Never auto-delete the seven Git-backed built-in chapters or legacy lesson rows.
-- The operation is transactional and serializes on the parent topic row.
CREATE OR REPLACE FUNCTION public.owner_delete_implementation(
  p_implementation uuid, p_confirmation text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  actor uuid := (SELECT auth.uid());
  item public.implementations%ROWTYPE;
  chapter public.topics%ROWTYPE;
  target_topic uuid;
  removed_versions integer;
  was_published boolean;
  chapter_deleted boolean := false;
BEGIN
  IF actor IS NULL OR public.current_role() <> 'owner' THEN
    RAISE EXCEPTION 'Owner access required';
  END IF;
  IF p_confirmation IS DISTINCT FROM 'SUPPRIMER' THEN
    RAISE EXCEPTION 'Exact deletion confirmation required';
  END IF;

  -- Parent row locked first to serialize with concurrent chapter changes.
  SELECT topic_id INTO target_topic FROM public.implementations WHERE id=p_implementation;
  IF target_topic IS NULL THEN
    RAISE EXCEPTION 'Implementation not found';
  END IF;
  SELECT * INTO chapter FROM public.topics WHERE id=target_topic FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Chapter not found'; END IF;
  SELECT * INTO item FROM public.implementations WHERE id=p_implementation FOR UPDATE;
  IF NOT FOUND OR item.topic_id <> chapter.id THEN
    RAISE EXCEPTION 'Implementation changed. Refresh El studio.';
  END IF;

  was_published := item.published_revision_id IS NOT NULL;
  removed_versions := public._owner_purge_implementation_rows(p_implementation);

  IF chapter.slug NOT IN ('pgcd','ppcm','verif','som-ch','tableau','matrice','enregistrement')
     AND NOT EXISTS (SELECT 1 FROM public.legacy_lessons WHERE slug=chapter.slug)
     AND NOT EXISTS (SELECT 1 FROM public.implementations WHERE topic_id=chapter.id)
  THEN
    DELETE FROM public.topics WHERE id=chapter.id;
    chapter_deleted := true;
  END IF;

  INSERT INTO public.audit_events(actor_id,action,details)
    VALUES (actor,'implementation_deleted',
      jsonb_build_object('implementation_id',p_implementation,'topic_slug',chapter.slug,
        'method_type',item.method_type,'revisions_deleted',removed_versions,
        'was_published',was_published,'chapter_deleted',chapter_deleted));

  IF chapter_deleted THEN
    INSERT INTO public.audit_events(actor_id,action,details)
      VALUES (actor,'module_deleted',
        jsonb_build_object('topic_id',chapter.id,'slug',chapter.slug,
          'reason','last_implementation_deleted','implementations_deleted',1,
          'revisions_deleted',removed_versions));
  END IF;

  RETURN jsonb_build_object('revisions_deleted',removed_versions,
    'chapter_deleted',chapter_deleted,'chapter_slug',chapter.slug);
END $$;
REVOKE ALL ON FUNCTION public.owner_delete_implementation(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.owner_delete_implementation(uuid,text) TO authenticated;
