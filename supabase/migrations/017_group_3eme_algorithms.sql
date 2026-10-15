-- 017: Group 3ème Info algorithms into shared chapters (not one chapter per implementation).
-- Preserve all implementation/revision UUIDs, author accounts, approved snapshots
-- and review history. No existing teaching source is modified by this migration.
BEGIN;
DO $do$
DECLARE
  author uuid;
  g jsonb;
  move jsonb;
  old_id uuid;
  new_id uuid;
  imp uuid;
  src_state text;
BEGIN
  SELECT id INTO STRICT author FROM public.profiles WHERE role='owner' AND NOT is_deleted;
  FOR g IN SELECT value FROM jsonb_array_elements($groups$[["chaines","Chaînes de caractères","Traitements et vérifications de chaînes : palindrome, occurrences, voyelles et recherche."],["arithmetique","Arithmétique et nombres","Primalité, facteurs, diviseurs, conversions et manipulations de chiffres."],["recurrences","Algorithmes récurrents","Suites et calculs récurrents : factorielle, Fibonacci et accumulateurs."],["approximations","Calcul approché","Calculs approchés : π, e et racine carrée."],["tri","TRI","Méthodes de tri par sélection et à bulles, appliquées aux tableaux NumPy et aux matrices NumPy."]]$groups$::jsonb) LOOP
    INSERT INTO public.topics(slug,title,category,school_level,summary,state,created_by)
      VALUES (g->>0,g->>1,'Algorithmique','3ème Info',g->>2,'pending',author)
      ON CONFLICT (slug) DO NOTHING;
  END LOOP;
  FOR move IN SELECT value FROM jsonb_array_elements($moves$[{"src":"compter-voyelles","dst":"chaines"},{"src":"occurrences-caractere","dst":"chaines"},{"src":"palindrome-chaine","dst":"chaines"},{"src":"majuscules-chaine","dst":"chaines"},{"src":"recherche-sous-chaine","dst":"chaines"},{"src":"conversion-binaire","dst":"arithmetique"},{"src":"facteurs-premiers","dst":"arithmetique"},{"src":"inverser-chiffres","dst":"arithmetique"},{"src":"nombre-parfait","dst":"arithmetique"},{"src":"nombre-premier","dst":"arithmetique"},{"src":"somme-diviseurs","dst":"arithmetique"},{"src":"factorielle","dst":"recurrences"},{"src":"fibonacci","dst":"recurrences"},{"src":"approximation-e","dst":"approximations"},{"src":"approximation-pi","dst":"approximations"},{"src":"racine-approchee","dst":"approximations"},{"src":"maximum-tableau","dst":"tableau"},{"src":"moyenne-tableau","dst":"tableau"},{"src":"filtrage-tableau","dst":"tableau"},{"src":"recherche-sequentielle","dst":"tableau"},{"src":"recherche-dichotomique","dst":"tableau"},{"src":"matrice-diagonale","dst":"matrice"},{"src":"vecteur-enregistrements","dst":"enregistrement"},{"src":"tri-bulles","dst":"tri"},{"src":"tri-selection","dst":"tri"}]$moves$::jsonb) LOOP
    SELECT id,state INTO old_id,src_state FROM public.topics WHERE slug=move->>'src';
    IF old_id IS NULL THEN CONTINUE; END IF;
    SELECT id INTO STRICT new_id FROM public.topics WHERE slug=move->>'dst';
    IF old_id = new_id THEN CONTINUE; END IF;
    IF src_state <> 'pending' THEN
      RAISE EXCEPTION 'Refusing to relocate a public chapter: %',move->>'src';
    END IF;
    FOR imp IN SELECT id FROM public.implementations WHERE topic_id=old_id LOOP
      UPDATE public.implementations SET topic_id=new_id WHERE id=imp;
      INSERT INTO public.audit_events(actor_id,action,details)
      VALUES(author,'implementation_chapter_moved',
       jsonb_build_object('implementation_id',imp,'from',move->>'src','to',move->>'dst',
          'batch','3eme_numpy_chapters_2026'));
    END LOOP;
    IF NOT EXISTS(SELECT 1 FROM public.implementations WHERE topic_id=old_id) THEN
      DELETE FROM public.topics WHERE id=old_id;
    END IF;
    old_id:=NULL;
  END LOOP;
END $do$;
COMMIT;
