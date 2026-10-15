-- 023: Self-service management of private school contributions.
-- Only the creator can delete an implementation with no approved/public history.
-- Contributors and reviewers may rename a chapter they created while it is private.
-- Owner admin RPCs remain unchanged. No raw table write privileges are granted.

CREATE FUNCTION public.delete_own_private_implementation(
  p_implementation uuid, p_confirmation text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  actor uuid := (SELECT auth.uid());
  role_name text := public.current_role();
  item public.implementations%ROWTYPE;
  chapter public.topics%ROWTYPE;
  topic_id uuid;
  revision_count integer;
  chapter_deleted boolean := false;
BEGIN
  IF actor IS NULL OR role_name NOT IN ('contributor','reviewer','owner') THEN
    RAISE EXCEPTION 'Contributor or reviewer access required';
  END IF;
  IF p_confirmation IS DISTINCT FROM 'SUPPRIMER' THEN
    RAISE EXCEPTION 'Saisis SUPPRIMER pour confirmer la suppression.';
  END IF;

  -- Lock the chapter before the implementation, matching the owner deletion RPC.
  SELECT i.topic_id INTO topic_id FROM public.implementations i
   WHERE i.id=p_implementation;
  IF topic_id IS NULL THEN RAISE EXCEPTION 'Implémentation introuvable.'; END IF;
  SELECT * INTO chapter FROM public.topics WHERE id=topic_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Chapitre introuvable.'; END IF;
  SELECT * INTO item FROM public.implementations
    WHERE id=p_implementation FOR UPDATE;
  IF NOT FOUND OR item.topic_id<>chapter.id THEN
    RAISE EXCEPTION 'Implémentation modifiée : actualise El studio.';
  END IF;

  IF item.created_by<>actor THEN
    RAISE EXCEPTION 'Tu ne peux supprimer que tes propres implémentations.';
  END IF;
  -- A withdrawn publication also has published_revision_id=NULL.
  -- archived_at and ALL revision statuses must therefore be checked.
  IF item.published_revision_id IS NOT NULL OR item.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cette implémentation a déjà été publiée. Contacte le propriétaire.';
  END IF;

  -- Protect concurrent review approval from racing against deletion.
  PERFORM 1 FROM public.revisions
    WHERE implementation_id=p_implementation FOR UPDATE;
  IF EXISTS (
    SELECT 1 FROM public.revisions
    WHERE implementation_id=p_implementation
      AND (status NOT IN ('draft','changes_requested','submitted') OR created_by<>actor)
  ) OR EXISTS (
    SELECT 1 FROM public.public_method_runs pm
    JOIN public.revisions r ON r.id=pm.revision_id
    WHERE r.implementation_id=p_implementation
  ) THEN
    RAISE EXCEPTION 'Une publication approuvée ou un historique protégé empêche cette suppression.';
  END IF;

  SELECT count(*) INTO revision_count FROM public.revisions
    WHERE implementation_id=p_implementation;

  DELETE FROM public.audit_events WHERE revision_id IN
    (SELECT id FROM public.revisions WHERE implementation_id=p_implementation);
  DELETE FROM public.draft_test_runs WHERE revision_id IN
    (SELECT id FROM public.revisions WHERE implementation_id=p_implementation);
  DELETE FROM public.revisions WHERE implementation_id=p_implementation;
  DELETE FROM public.implementations WHERE id=p_implementation;

  -- Never delete a built-in chapter or someone else's chapter.
  IF chapter.created_by=actor AND chapter.state='pending'
     AND chapter.slug NOT IN ('pgcd','ppcm','verif','som-ch','tableau','matrice','enregistrement')
     AND NOT EXISTS (SELECT 1 FROM public.legacy_lessons WHERE slug=chapter.slug)
     AND NOT EXISTS (SELECT 1 FROM public.implementations WHERE topic_id=chapter.id)
  THEN
    DELETE FROM public.topics WHERE id=chapter.id;
    chapter_deleted := true;
  END IF;

  INSERT INTO public.audit_events(actor_id,action,details)
  VALUES(actor,'private_implementation_deleted',
    jsonb_build_object('implementation_id',p_implementation,'chapter_slug',chapter.slug,
      'revisions_deleted',revision_count,'chapter_deleted',chapter_deleted));
  IF chapter_deleted THEN
    INSERT INTO public.audit_events(actor_id,action,details)
    VALUES(actor,'module_deleted',
      jsonb_build_object('topic_id',chapter.id,'slug',chapter.slug,
       'reason','creator_deleted_last_private_implementation','implementations_deleted',1,
       'revisions_deleted',revision_count));
  END IF;

  RETURN jsonb_build_object('revisions_deleted',revision_count,
     'chapter_deleted',chapter_deleted,'chapter_slug',chapter.slug);
END $$;
REVOKE ALL ON FUNCTION public.delete_own_private_implementation(uuid,text)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.delete_own_private_implementation(uuid,text) TO authenticated;

CREATE FUNCTION public.rename_own_private_chapter(
  p_topic uuid, p_expected_title text, p_new_title text
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  actor uuid := (SELECT auth.uid());
  role_name text := public.current_role();
  chapter public.topics%ROWTYPE;
  trimmed_title text := btrim(coalesce(p_new_title,''));
BEGIN
  IF actor IS NULL OR role_name NOT IN ('contributor','reviewer','owner') THEN
    RAISE EXCEPTION 'Contributor or reviewer access required';
  END IF;
  IF char_length(trimmed_title) NOT BETWEEN 3 AND 100
     OR trimmed_title ~ '[[:cntrl:]]' THEN
    RAISE EXCEPTION 'Le titre doit contenir de 3 à 100 caractères, sans retour à la ligne.';
  END IF;

  SELECT * INTO chapter FROM public.topics WHERE id=p_topic FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Chapitre introuvable.'; END IF;
  IF chapter.created_by IS DISTINCT FROM actor OR chapter.state<>'pending' THEN
    RAISE EXCEPTION 'Tu peux renommer uniquement un chapitre privé que tu as créé.';
  END IF;
  IF chapter.slug IN ('pgcd','ppcm','verif','som-ch','tableau','matrice','enregistrement')
     OR EXISTS (SELECT 1 FROM public.legacy_lessons WHERE slug=chapter.slug)
     OR EXISTS (
       SELECT 1 FROM public.implementations i
       JOIN public.revisions r ON r.implementation_id=i.id
       WHERE i.topic_id=chapter.id AND r.status IN ('published','archived')
     ) THEN
    RAISE EXCEPTION 'Un chapitre fondateur ou déjà publié ne peut pas être renommé ici.';
  END IF;
  IF chapter.title IS DISTINCT FROM p_expected_title THEN
    RAISE EXCEPTION 'Le chapitre a changé. Actualise El studio avant de réessayer.';
  END IF;
  IF chapter.title=trimmed_title THEN RETURN chapter.title; END IF;

  UPDATE public.topics SET title=trimmed_title WHERE id=chapter.id;
  INSERT INTO public.audit_events(actor_id,action,details)
    VALUES(actor,'private_chapter_renamed',
      jsonb_build_object('topic_id',chapter.id,'slug',chapter.slug,
         'old_title',chapter.title,'new_title',trimmed_title));
  RETURN trimmed_title;
END $$;
REVOKE ALL ON FUNCTION public.rename_own_private_chapter(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rename_own_private_chapter(uuid,text,text) TO authenticated;
