-- 020: Tunisian 3ème Info explicit dimension parameters for NumPy methods.
-- Update only editable owner drafts; keep published/archived history immutable.
-- New contract, test cases, pseudocode and lesson code are updated atomically.
DO $do$
DECLARE
  rule jsonb;
  original public.revisions%ROWTYPE;
  schema jsonb;
  cases jsonb;
  lesson jsonb;
  item jsonb;
  inputs jsonb;
  arg text;
  source_name text;
  array_kind text;
  num integer;
  num_rows integer;
  num_columns integer;
  user_owner uuid;
  updated_count integer := 0;
BEGIN
  SELECT id INTO STRICT user_owner FROM public.profiles WHERE role='owner' AND NOT is_deleted;
  FOR rule IN SELECT value FROM jsonb_array_elements($rules$[{"entry":"parcours_tableau","params":[["t","list[int]"],["n","int"]],"code":"from numpy import array\n\ndef parcours_tableau(t, n):\n    T = array(t, dtype=int)\n    R = array([int()] * n)\n    for i in range(n):\n        R[i] = T[i]\n    return R.tolist()","pseudo":"Fonction PARCOURS_TABLEAU(T : Tab, n : Entier) : Tab\nDébut\n  Déclarer R : Tableau de n Entiers\n  Pour i de 0 à n-1 Faire\n    R[i] ← T[i]\n  FinPour\n  Retourner R\nFin"},{"entry":"maximum_tableau","params":[["t","list[int]"],["n","int"]],"code":"from numpy import array\n\ndef maximum_tableau(t, n):\n    if n == 0:\n        return 0\n    T = array(t, dtype=int)\n    maxi = int(T[0])\n    for i in range(1, n):\n        if T[i] > maxi:\n            maxi = int(T[i])\n    return maxi","pseudo":"Fonction MAXIMUM_TABLEAU(T : Tab, n : Entier) : Entier\nDébut\n  Si n=0 Alors Retourner 0 FinSi\n  maxi ← T[0]\n  Pour i de 1 à n-1 Faire\n    Si T[i]>maxi Alors maxi ← T[i] FinSi\n  FinPour\n  Retourner maxi\nFin"},{"entry":"recherche_sequentielle","params":[["t","list[int]"],["n","int"],["valeur","int"]],"code":"from numpy import array\n\ndef recherche_sequentielle(t, n, valeur):\n    T = array(t, dtype=int)\n    for i in range(n):\n        if T[i] == valeur:\n            return i\n    return -1","pseudo":"Fonction RECHERCHE_SEQUENTIELLE(T : Tab, n, x : Entier) : Entier\nDébut\n  Pour i de 0 à n-1 Faire\n    Si T[i]=x Alors Retourner i FinSi\n  FinPour\n  Retourner -1\nFin"},{"entry":"recherche_dichotomique","params":[["t","list[int]"],["n","int"],["valeur","int"]],"code":"from numpy import array\n\ndef recherche_dichotomique(t, n, valeur):\n    T = array(t, dtype=int)\n    g = 0\n    d = n - 1\n    while g <= d:\n        m = (g + d) // 2\n        if T[m] == valeur:\n            return m\n        if T[m] < valeur:\n            g = m + 1\n        else:\n            d = m - 1\n    return -1","pseudo":"Fonction RECHERCHE_DICHOTOMIQUE(T : Tab trié, n, x : Entier) : Entier\nDébut\n  g ← 0 ; d ← n-1\n  TantQue g≤d Faire\n    m ← (g+d) DIV 2\n    Si T[m]=x Alors Retourner m FinSi\n    Si T[m]<x Alors g ← m+1 Sinon d ← m-1 FinSi\n  FinTantQue\n  Retourner -1\nFin"},{"entry":"tri_selection","params":[["t","list[int]"],["n","int"]],"code":"from numpy import array\n\ndef tri_selection(t, n):\n    T = array(t, dtype=int)\n    for i in range(n - 1):\n        pos = i\n        for j in range(i + 1, n):\n            if T[j] < T[pos]:\n                pos = j\n        aux = int(T[i])\n        T[i] = T[pos]\n        T[pos] = aux\n    return T.tolist()","pseudo":"Fonction TRI_SELECTION(T : Tab, n : Entier) : Tab\nDébut\n  Pour i de 0 à n-2 Faire\n    pos ← i\n    Pour j de i+1 à n-1 Faire\n      Si T[j]<T[pos] Alors pos ← j FinSi\n    FinPour\n    aux ← T[i] ; T[i] ← T[pos] ; T[pos] ← aux\n  FinPour\n  Retourner T\nFin"},{"entry":"tri_bulles","params":[["t","list[int]"],["n","int"]],"code":"from numpy import array\n\ndef tri_bulles(t, n):\n    T = array(t, dtype=int)\n    for i in range(n - 1):\n        for j in range(n - 1 - i):\n            if T[j] > T[j + 1]:\n                aux = int(T[j])\n                T[j] = T[j + 1]\n                T[j + 1] = aux\n    return T.tolist()","pseudo":"Fonction TRI_BULLES(T : Tab, n : Entier) : Tab\nDébut\n  Pour i de 0 à n-2 Faire\n    Pour j de 0 à n-2-i Faire\n      Si T[j]>T[j+1] Alors\n        aux ← T[j] ; T[j] ← T[j+1] ; T[j+1] ← aux\n      FinSi\n    FinPour\n  FinPour\n  Retourner T\nFin"},{"entry":"tri_selection_matrice","params":[["matrice","list[list[int]]"],["l","int"],["c","int"]],"code":"from numpy import array\n\ndef tri_selection_matrice(matrice, l, c):\n    if l == 0 or c == 0:\n        return []\n    M = array(matrice, dtype=int)\n    total = l * c\n    for k in range(total - 1):\n        pos = k\n        for j in range(k + 1, total):\n            if M[j // c, j % c] < M[pos // c, pos % c]:\n                pos = j\n        aux = int(M[k // c, k % c])\n        M[k // c, k % c] = M[pos // c, pos % c]\n        M[pos // c, pos % c] = aux\n    return M.tolist()","pseudo":"Fonction TRI_SELECTION_MATRICE(M : Mat, l, c : Entier) : Mat\nDébut\n  total ← l*c\n  Pour k de 0 à total-2 Faire\n    pos ← k\n    Pour j de k+1 à total-1 Faire\n      Si M[j DIV c,j MOD c] < M[pos DIV c,pos MOD c] Alors pos ← j FinSi\n    FinPour\n    aux ← M[k DIV c,k MOD c]\n    M[k DIV c,k MOD c] ← M[pos DIV c,pos MOD c]\n    M[pos DIV c,pos MOD c] ← aux\n  FinPour\n  Retourner M\nFin"},{"entry":"tri_bulles_matrice","params":[["matrice","list[list[int]]"],["l","int"],["c","int"]],"code":"from numpy import array\n\ndef tri_bulles_matrice(matrice, l, c):\n    if l == 0 or c == 0:\n        return []\n    M = array(matrice, dtype=int)\n    total = l * c\n    for i in range(total - 1):\n        for k in range(total - 1 - i):\n            if M[k // c, k % c] > M[(k + 1) // c, (k + 1) % c]:\n                aux = int(M[k // c, k % c])\n                M[k // c, k % c] = M[(k + 1) // c, (k + 1) % c]\n                M[(k + 1) // c, (k + 1) % c] = aux\n    return M.tolist()","pseudo":"Fonction TRI_BULLES_MATRICE(M : Mat, l, c : Entier) : Mat\nDébut\n  total ← l*c\n  Pour i de 0 à total-2 Faire\n    Pour k de 0 à total-2-i Faire\n      Si M[k DIV c,k MOD c] > M[(k+1) DIV c,(k+1) MOD c] Alors\n        aux ← M[k DIV c,k MOD c]\n        M[k DIV c,k MOD c] ← M[(k+1) DIV c,(k+1) MOD c]\n        M[(k+1) DIV c,(k+1) MOD c] ← aux\n      FinSi\n    FinPour\n  FinPour\n  Retourner M\nFin"},{"entry":"meilleur_eleve","params":[["noms","str"],["notes","list[int]"],["n","int"]],"code":"from numpy import array\n\ndef meilleur_eleve(noms, notes, n):\n    if n == 0 or noms.count(\",\") + 1 != n:\n        return \"\"\n    N = array([nom.strip() for nom in noms.split(\",\")], dtype=str)\n    T = array(notes, dtype=int)\n    meilleur = 0\n    for i in range(1, n):\n        if T[i] > T[meilleur]:\n            meilleur = i\n    return str(N[meilleur])","pseudo":"Fonction MEILLEUR_ELEVE(Noms : Chaîne, Notes : Tab, n : Entier) : Chaîne\nDébut\n  Si n=0 Alors Retourner \"\" FinSi\n  meilleur ← 0\n  Pour i de 1 à n-1 Faire\n    Si Notes[i]>Notes[meilleur] Alors meilleur ← i FinSi\n  FinPour\n  Retourner Noms[meilleur]\nFin"}]$rules$::jsonb) LOOP
    SELECT r.* INTO original
      FROM public.revisions r JOIN public.implementations i ON i.id=r.implementation_id
      WHERE r.entry_function=rule->>'entry' AND r.status='draft' AND r.created_by=user_owner
      ORDER BY r.updated_at DESC LIMIT 1 FOR UPDATE OF r;
    IF NOT FOUND THEN RAISE EXCEPTION 'Expected private NumPy draft: %',rule->>'entry'; END IF;

    schema:=jsonb_set(original.input_schema,'{parameters}',rule->'params',true);
    -- JSON arrays are the transport format. Class content uses numpy.array
    -- and explicitly named n / l / c to do all educational iteration.
    source_name:=CASE WHEN rule->>'entry'='meilleur_eleve' THEN 'notes'
      WHEN rule->>'entry' LIKE '%matrice' THEN 'matrice'
      ELSE 't' END;
    array_kind:=CASE WHEN source_name='matrice' THEN 'matrix' ELSE 'vector' END;
    cases:='[]'::jsonb;
    FOR item IN SELECT value FROM jsonb_array_elements(original.test_cases) LOOP
      inputs:=item->'inputs';
      IF array_kind='vector' THEN
        num:=jsonb_array_length(inputs->source_name);
        inputs:=jsonb_set(inputs,'{n}',to_jsonb(num),true);
      ELSE
        num_rows:=jsonb_array_length(inputs->source_name);
        num_columns:=CASE WHEN num_rows>0 THEN jsonb_array_length(inputs->source_name->0) ELSE 0 END;
        inputs:=jsonb_set(jsonb_set(inputs,'{l}',to_jsonb(num_rows),true),
          '{c}',to_jsonb(num_columns),true);
      END IF;
      cases:=cases||jsonb_build_array(jsonb_set(item,'{inputs}',inputs,true));
    END LOOP;
    lesson:=jsonb_set(jsonb_set(original.lesson_content,'{sections,0,python}',
      to_jsonb(rule->>'code'),true),'{sections,0,pseudocode}',to_jsonb(rule->>'pseudo'),true);
    lesson:=jsonb_set(lesson,'{limits}',to_jsonb(
      coalesce(lesson->>'limits','')||
      ' Convention 3ème Info : tableau NumPy avec paramètre n, matrice rectangulaire avec l et c, matrice carrée avec n. Pas de len() dans les algorithmes.'
    ),true);
    PERFORM public.validate_function_contract(original.entry_function,schema,cases);
    PERFORM public.validate_lesson_content(lesson);
    UPDATE public.revisions SET
      input_schema=schema,test_cases=cases,python_code=rule->>'code',
      pseudocode=rule->>'pseudo',lesson_content=lesson,
      explanation=original.explanation||
       E'\n\nNotation du programme : les dimensions sont des paramètres de la fonction et servent à contrôler toutes les boucles.',
      edit_seq=edit_seq+1,test_status='not_run',test_evidence='{}'::jsonb,updated_at=now()
    WHERE id=original.id;
    INSERT INTO public.audit_events(actor_id,revision_id,action,details)
      VALUES(user_owner,original.id,'curriculum_dimensions_updated',
        jsonb_build_object('old_edit_seq',original.edit_seq,'new_edit_seq',original.edit_seq+1,
          'runner_test_required',true,'dimensions',CASE WHEN array_kind='matrix' THEN 'l,c' ELSE 'n' END));
    updated_count:=updated_count+1;
  END LOOP;
  IF updated_count<>9 THEN RAISE EXCEPTION 'Expected 9 revisions updated, got %',updated_count; END IF;
END $do$;
