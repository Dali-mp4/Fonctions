-- 015: Owner-only rename for editable database chapters.
-- The stable URL slug, publication status, implementations, revisions and
-- existing test/review approvals stay unchanged. Git-backed legacy chapters
-- cannot be renamed here because their visible title comes from seed code.
CREATE FUNCTION public.owner_rename_module(
  p_topic uuid, p_expected_title text, p_new_title text
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  actor uuid := (SELECT auth.uid());
  chapter public.topics%ROWTYPE;
  trimmed_title text := btrim(coalesce(p_new_title,''));
BEGIN
  IF actor IS NULL OR public.current_role() <> 'owner' THEN
    RAISE EXCEPTION 'Owner access required';
  END IF;

  IF char_length(trimmed_title) NOT BETWEEN 3 AND 100
     OR trimmed_title ~ '[[:cntrl:]]' THEN
    RAISE EXCEPTION 'Le titre doit contenir entre 3 et 100 caractères, sans retour à la ligne.';
  END IF;

  SELECT * INTO chapter FROM public.topics WHERE id=p_topic FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Chapitre introuvable'; END IF;
  IF chapter.slug IN ('pgcd','ppcm','verif','som-ch','tableau','matrice','enregistrement')
     OR EXISTS (SELECT 1 FROM public.legacy_lessons WHERE slug=chapter.slug) THEN
    RAISE EXCEPTION 'Le nom de ce module fondateur est défini dans le code de la plateforme.';
  END IF;
  IF chapter.title IS DISTINCT FROM p_expected_title THEN
    RAISE EXCEPTION 'Le chapitre a été modifié entre-temps. Actualise la liste.';
  END IF;
  IF chapter.title=trimmed_title THEN
    RETURN chapter.title;
  END IF;

  UPDATE public.topics SET title=trimmed_title WHERE id=p_topic;
  INSERT INTO public.audit_events(actor_id,action,details)
    VALUES (actor,'module_renamed',
      jsonb_build_object('topic_id',p_topic,'slug',chapter.slug,
        'old_title',chapter.title,'new_title',trimmed_title));
  RETURN trimmed_title;
END $$;

REVOKE ALL ON FUNCTION public.owner_rename_module(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.owner_rename_module(uuid,text,text) TO authenticated;
