-- 022: Remove infrastructure-only conversion from 3ème Info private lessons.
-- The isolated runner now receives NumPy arrays and serializes results.
-- Only mutable owner drafts are updated. Archived/approved history is untouched.
DO $do$
DECLARE r public.revisions%ROWTYPE; c text; p text; l jsonb; tests jsonb;
BEGIN
 FOR r IN SELECT * FROM public.revisions
 WHERE status='draft' AND entry_function IN
 ('parcours_tableau','maximum_tableau','recherche_sequentielle','recherche_dichotomique',
  'tri_selection','tri_bulles','tri_selection_matrice','tri_bulles_matrice',
  'somme_diagonale','somme_matrice','meilleur_eleve','facteurs_premiers')
 FOR UPDATE LOOP
   c:=r.python_code;
   p:=r.pseudocode;
   IF r.entry_function='parcours_tableau' THEN
     c:='def parcours_tableau(t, n):'||E'\n    for i in range(n):\n        print(t[i])\n    return t';
     p:='Fonction PARCOURS_TABLEAU(T : Tab, n : Entier) : Tab'||E'\nDébut\n  Pour i de 0 à n-1 Faire\n    Écrire(T[i])\n  FinPour\n  Retourner T\nFin';
   ELSIF r.entry_function='meilleur_eleve' THEN
     c:='def meilleur_eleve(noms, notes, n):'||E'\n    personnes = noms.split(",")\n    meilleur = 0\n    for i in range(1, n):\n        if notes[i] > notes[meilleur]:\n            meilleur = i\n    return personnes[meilleur].strip()';
   ELSIF r.entry_function='facteurs_premiers' THEN
     c:=replace(c,'return facteurs[:k].tolist()','return facteurs[:k]');
   ELSE
     c:=replace(c,E'from numpy import array\n\n','');
     c:=replace(c,E'    T = array(t, dtype=int)\n','');
     c:=replace(c,E'    M = array(matrice, dtype=int)\n','');
     c:=replace(c,E'    if n == 0:\n        return 0\n','');
     c:=replace(c,E'    if l == 0 or c == 0:\n        return 0\n','');
     c:=replace(c,E'    if l == 0 or c == 0:\n        return []\n','');
     c:=replace(c,'T[','t[');
     c:=replace(c,'M[','matrice[');
     c:=regexp_replace(c,'int\((t\[[^]]+\]|matrice\[[^]]+\])\)','\1','g');
     c:=replace(c,'return T.tolist()','return t');
     c:=replace(c,'return M.tolist()','return matrice');
   END IF;
   IF c IS NOT DISTINCT FROM r.python_code THEN
     RAISE EXCEPTION 'No simplification for %',r.entry_function;
   END IF;
   IF r.entry_function<>'facteurs_premiers' AND
      (position('tolist(' in c)>0 OR position('dtype=' in c)>0 OR position('from numpy import array' in c)>0) THEN
     RAISE EXCEPTION 'Boilerplate remains in %',r.entry_function;
   END IF;
   tests:=r.test_cases;
   IF r.entry_function IN ('parcours_tableau','maximum_tableau','recherche_sequentielle',
    'recherche_dichotomique','tri_selection','tri_bulles','tri_selection_matrice',
    'tri_bulles_matrice','somme_diagonale','somme_matrice','meilleur_eleve') THEN
     IF jsonb_array_length(tests)<3 THEN RAISE EXCEPTION 'Missing third test for %',r.entry_function; END IF;
     tests:=jsonb_set(tests,'{2,inputs}',CASE r.entry_function
       WHEN 'parcours_tableau' THEN '{"t":[0],"n":1}'::jsonb
       WHEN 'maximum_tableau' THEN '{"t":[0],"n":1}'::jsonb
       WHEN 'recherche_sequentielle' THEN '{"t":[2],"n":1,"valeur":3}'::jsonb
       WHEN 'recherche_dichotomique' THEN '{"t":[2],"n":1,"valeur":3}'::jsonb
       WHEN 'tri_selection' THEN '{"t":[1],"n":1}'::jsonb
       WHEN 'tri_bulles' THEN '{"t":[1],"n":1}'::jsonb
       WHEN 'tri_selection_matrice' THEN '{"matrice":[[1]],"l":1,"c":1}'::jsonb
       WHEN 'tri_bulles_matrice' THEN '{"matrice":[[1]],"l":1,"c":1}'::jsonb
       WHEN 'somme_diagonale' THEN '{"matrice":[[0]],"n":1}'::jsonb
       WHEN 'somme_matrice' THEN '{"matrice":[[0]],"l":1,"c":1}'::jsonb
       ELSE '{"noms":"A","notes":[10],"n":1}'::jsonb END,true);
     tests:=jsonb_set(tests,'{2,expected}',CASE r.entry_function
       WHEN 'parcours_tableau' THEN '[0]'::jsonb
       WHEN 'maximum_tableau' THEN '0'::jsonb
       WHEN 'recherche_sequentielle' THEN '-1'::jsonb
       WHEN 'recherche_dichotomique' THEN '-1'::jsonb
       WHEN 'tri_selection' THEN '[1]'::jsonb
       WHEN 'tri_bulles' THEN '[1]'::jsonb
       WHEN 'tri_selection_matrice' THEN '[[1]]'::jsonb
       WHEN 'tri_bulles_matrice' THEN '[[1]]'::jsonb
       WHEN 'somme_diagonale' THEN '0'::jsonb
       WHEN 'somme_matrice' THEN '0'::jsonb
       ELSE '"A"'::jsonb END,true);
   END IF;
   l:=jsonb_set(jsonb_set(r.lesson_content,'{sections,0,python}',to_jsonb(c),true),
      '{sections,0,pseudocode}',to_jsonb(p),true);
   l:=jsonb_set(l,'{sections,0,note}',to_jsonb(
     CASE WHEN r.entry_function='facteurs_premiers' THEN
      'La déclaration du tableau des facteurs fait partie de l’exercice ; le site gère le format de sortie.'
     ELSE
      'Le site prépare déjà les tableaux NumPy et vérifie leurs dimensions. Les conversions techniques ne font pas partie de la fonction.'
     END::text),true);
   IF r.entry_function<>'facteurs_premiers' THEN
     l:=jsonb_set(l,'{limits}',to_jsonb('n ou l/c doivent être strictement positifs et correspondre aux dimensions des tableaux préparés par le site.'::text),true);
   END IF;
   PERFORM public.validate_function_contract(r.entry_function,r.input_schema,tests);
   PERFORM public.validate_lesson_content(l);
   UPDATE public.revisions SET
     title=CASE WHEN r.entry_function='parcours_tableau' THEN 'TABLEAU — parcours et affichage' ELSE r.title END,
     python_code=c,pseudocode=p,lesson_content=l,test_cases=tests,
     edit_seq=edit_seq+1,test_status='not_run',test_evidence='{}'::jsonb,updated_at=now()
    WHERE id=r.id;
   INSERT INTO public.audit_events(actor_id,revision_id,action,details)
     VALUES(r.created_by,r.id,'curriculum_student_friendly',
       jsonb_build_object('previous_edit_seq',r.edit_seq,'new_edit_seq',r.edit_seq+1,'review_required',true));
 END LOOP;
END $do$;
