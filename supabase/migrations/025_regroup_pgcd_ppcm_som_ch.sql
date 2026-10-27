-- 025: PGCD/PPCM become reviewed built-in methods inside Arithmétique;
-- SOM_CH and its independently approved implementation belong to Chaînes.
-- The immutable classroom content remains in Git (seven reviewed seed lessons).
-- Only obsolete DB chapter/legacy snapshot rows are removed.
DO $relocation$
DECLARE
  old_pgcd uuid;
  old_ppcm uuid;
  old_som uuid;
  arithmetic uuid;
  strings uuid;
  som_methods integer;
  som_published integer;
  moved integer;
  snapshots_removed integer;
  chapters_removed integer;
  actor uuid;
BEGIN
  SELECT id INTO STRICT arithmetic FROM public.topics
   WHERE slug='arithmetique' AND state='published' FOR UPDATE;
  SELECT id INTO STRICT strings FROM public.topics
   WHERE slug='chaines' AND state='published' FOR UPDATE;
  SELECT id INTO STRICT old_pgcd FROM public.topics WHERE slug='pgcd' FOR UPDATE;
  SELECT id INTO STRICT old_ppcm FROM public.topics WHERE slug='ppcm' FOR UPDATE;
  SELECT id INTO STRICT old_som FROM public.topics WHERE slug='som-ch' FOR UPDATE;

  IF EXISTS(SELECT 1 FROM public.implementations WHERE topic_id IN(old_pgcd,old_ppcm)) THEN
    RAISE EXCEPTION 'Unexpected PGCD/PPCM implementation: manual migration required.';
  END IF;

  SELECT count(*), count(*) FILTER (WHERE published_revision_id IS NOT NULL)
  INTO som_methods,som_published FROM public.implementations WHERE topic_id=old_som;
  IF som_methods<>1 OR som_published<>1 THEN
    RAISE EXCEPTION 'SOM_CH publication changed; abort migration to protect approved content.';
  END IF;

  -- Move the existing approval and all its revision history without rewriting it.
  UPDATE public.implementations SET topic_id=strings WHERE topic_id=old_som;
  GET DIAGNOSTICS moved=ROW_COUNT;
  IF moved<>1 THEN RAISE EXCEPTION 'Expected exactly one SOM_CH implementation moved.'; END IF;

  DELETE FROM public.legacy_lessons WHERE slug IN('pgcd','ppcm','som-ch');
  GET DIAGNOSTICS snapshots_removed=ROW_COUNT;
  IF snapshots_removed<>3 THEN
    RAISE EXCEPTION 'Expected three original snapshots; refusing to leave a partial migration.';
  END IF;

  -- These topic rows are now empty. Their reviewed code stays Git-backed and
  -- is rendered as a method of the target chapter, not a catalog card.
  DELETE FROM public.topics WHERE id IN(old_pgcd,old_ppcm,old_som);
  GET DIAGNOSTICS chapters_removed=ROW_COUNT;
  IF chapters_removed<>3 THEN
    RAISE EXCEPTION 'Expected three removed legacy chapters.';
  END IF;

  IF NOT EXISTS (
      SELECT 1 FROM public.published_methods
      WHERE topic_slug='chaines' AND entry_function='somme_chiffres'
  ) THEN
    RAISE EXCEPTION 'The approved SOM_CH method disappeared; rolling back.';
  END IF;

  SELECT id INTO actor FROM public.profiles WHERE role='owner' AND NOT is_deleted LIMIT 1;
  INSERT INTO public.audit_events(actor_id,action,details)
  VALUES(actor,'legacy_chapters_regrouped',
    jsonb_build_object('old_chapters',jsonb_build_array('pgcd','ppcm','som-ch'),
     'new_chapters',jsonb_build_object('pgcd','arithmetique','ppcm','arithmetique','som-ch','chaines'),
     'approved_implementations_moved',moved,
     'reviewed_code_preserved_in_git',true));
END $relocation$;
