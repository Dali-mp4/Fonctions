-- 018: NumPy teaching draft refresh + four sorting implementations in TRI.
-- Existing approved/public revisions are immutable: create a fresh private draft
-- for the published MATRICE method instead of rewriting its certified code.
-- Any changed draft has certification invalidated. Submitted diagonal is
-- returned to draft with an audit event because its code must change.
BEGIN;
DO $do$
DECLARE
  item jsonb;
  rev public.revisions%ROWTYPE;
  impl public.implementations%ROWTYPE;
  new_code text;
  new_pseudo text;
  new_lesson jsonb;
  new_title text;
  owner_id uuid;
  tri_topic uuid;
  matrix_impl uuid;
  approved public.revisions%ROWTYPE;
  fresh_id uuid;
  method jsonb;
  schema jsonb;
  cases jsonb;
BEGIN
  SELECT id INTO STRICT owner_id FROM public.profiles WHERE role='owner' AND NOT is_deleted;
  FOR item IN SELECT value FROM jsonb_array_elements($edits$[{"entry":"parcours_tableau","code":"from numpy import array\n\ndef parcours_tableau(t):\n    T = array(t, dtype=int)\n    R = array([int()] * len(T))\n    for i in range(len(T)):\n        R[i] = T[i]\n    return R.tolist()","pseudo":"Fonction PARCOURS_TABLEAU(T : Tab, n : Entier) : Tab\nDébut\n  Déclarer R : Tableau de n Entiers\n  Pour i de 0 à n-1 Faire\n    R[i] ← T[i]\n  FinPour\n  Retourner R\nFin","title":null,"explain":null},{"entry":"maximum_tableau","code":"from numpy import array\n\ndef maximum_tableau(t):\n    T = array(t, dtype=int)\n    if len(T) == 0:\n        return 0\n    maxi = int(T[0])\n    for i in range(1, len(T)):\n        if T[i] > maxi:\n            maxi = int(T[i])\n    return maxi","pseudo":"Fonction MAXIMUM_TABLEAU(T : Tab, n : Entier) : Entier\nDébut\n  Si n=0 Alors Retourner 0 FinSi\n  maxi ← T[0]\n  Pour i de 1 à n-1 Faire\n    Si T[i]>maxi Alors maxi ← T[i] FinSi\n  FinPour\n  Retourner maxi\nFin","title":null,"explain":null},{"entry":"recherche_sequentielle","code":"from numpy import array\n\ndef recherche_sequentielle(t, valeur):\n    T = array(t, dtype=int)\n    for i in range(len(T)):\n        if T[i] == valeur:\n            return i\n    return -1","pseudo":"Fonction RECHERCHE_SEQUENTIELLE(T : Tab, n,x : Entier) : Entier\nDébut\n  Pour i de 0 à n-1 Faire\n    Si T[i]=x Alors Retourner i FinSi\n  FinPour\n  Retourner -1\nFin","title":null,"explain":null},{"entry":"recherche_dichotomique","code":"from numpy import array\n\ndef recherche_dichotomique(t, valeur):\n    T = array(t, dtype=int)\n    gauche = 0\n    droite = len(T) - 1\n    while gauche <= droite:\n        milieu = (gauche + droite) // 2\n        if T[milieu] == valeur:\n            return milieu\n        if T[milieu] < valeur:\n            gauche = milieu + 1\n        else:\n            droite = milieu - 1\n    return -1","pseudo":"Fonction RECHERCHE_DICHOTOMIQUE(T : Tab trié,n,x : Entier) : Entier\nDébut\n  g ← 0 ; d ← n-1\n  TantQue g≤d Faire\n    m ← (g+d) DIV 2\n    Si T[m]=x Alors Retourner m FinSi\n    Si T[m]<x Alors g ← m+1 Sinon d ← m-1 FinSi\n  FinTantQue\n  Retourner -1\nFin","title":null,"explain":null},{"entry":"facteurs_premiers","code":"from numpy import array\n\ndef facteurs_premiers(n):\n    facteurs = array([int()] * 64)\n    k = 0\n    d = 2\n    while d * d <= n:\n        while n % d == 0:\n            facteurs[k] = d\n            k = k + 1\n            n = n // d\n        d = d + 1\n    if n > 1:\n        facteurs[k] = n\n        k = k + 1\n    return facteurs[:k].tolist()","pseudo":"Fonction FACTEURS_PREMIERS(n : Entier) : Tab\nDébut\n  Déclarer F : Tableau de 64 Entiers\n  k ← 0 ; d ← 2\n  TantQue d*d≤n Faire\n    TantQue n MOD d=0 Faire\n      F[k] ← d ; k ← k+1 ; n ← n DIV d\n    FinTantQue\n    d ← d+1\n  FinTantQue\n  Si n>1 Alors F[k] ← n ; k ← k+1 FinSi\n  Retourner les k premières valeurs de F\nFin","title":null,"explain":null},{"entry":"meilleur_eleve","code":"from numpy import array\n\ndef meilleur_eleve(noms, notes):\n    N = array([s.strip() for s in noms.split(\",\")], dtype=str)\n    T = array(notes, dtype=int)\n    if len(T) == 0 or len(N) != len(T):\n        return \"\"\n    meilleur = 0\n    for i in range(1, len(T)):\n        if T[i] > T[meilleur]:\n            meilleur = i\n    return str(N[meilleur])","pseudo":"Fonction MEILLEUR_ELEVE(Noms : TabChaînes, Notes : TabEntiers,n : Entier) : Chaîne\nDébut\n  Si n=0 Alors Retourner \"\" FinSi\n  meilleur ← 0\n  Pour i de 1 à n-1 Faire\n    Si Notes[i]>Notes[meilleur] Alors meilleur ← i FinSi\n  FinPour\n  Retourner Noms[meilleur]\nFin","title":null,"explain":null},{"entry":"tri_selection","code":"from numpy import array\n\ndef tri_selection(t):\n    T = array(t, dtype=int)\n    n = len(T)\n    for i in range(n - 1):\n        pos = i\n        for j in range(i + 1, n):\n            if T[j] < T[pos]:\n                pos = j\n        temp = int(T[i])\n        T[i] = T[pos]\n        T[pos] = temp\n    return T.tolist()","pseudo":"Fonction TRI_SELECTION(T : Tab, n : Entier) : Tab\nDébut\n  Pour i de 0 à n-2 Faire\n    pos ← i\n    Pour j de i+1 à n-1 Faire\n      Si T[j]<T[pos] Alors pos ← j FinSi\n    FinPour\n    aux ← T[i] ; T[i] ← T[pos] ; T[pos] ← aux\n  FinPour\n  Retourner T\nFin","title":"Tri par sélection — tableau NumPy","explain":"Repérer la plus petite case de la partie non triée, puis la permuter avec la première case de cette zone. Tableau NumPy (array), indices de 0 à n-1. Aucun sort() ou sorted()."},{"entry":"tri_bulles","code":"from numpy import array\n\ndef tri_bulles(t):\n    T = array(t, dtype=int)\n    n = len(T)\n    for i in range(n - 1):\n        for j in range(n - 1 - i):\n            if T[j] > T[j + 1]:\n                aux = int(T[j])\n                T[j] = T[j + 1]\n                T[j + 1] = aux\n    return T.tolist()","pseudo":"Fonction TRI_BULLES(T : Tab,n : Entier) : Tab\nDébut\n  Pour i de 0 à n-2 Faire\n    Pour j de 0 à n-2-i Faire\n      Si T[j]>T[j+1] Alors\n        aux ← T[j] ; T[j] ← T[j+1] ; T[j+1] ← aux\n      FinSi\n    FinPour\n  FinPour\n  Retourner T\nFin","title":"Tri à bulles — tableau NumPy","explain":"Comparer deux éléments voisins, puis les permuter si l'ordre croissant n'est pas respecté. Tableau NumPy (array), aucune fonction de tri prédéfinie."},{"entry":"somme_diagonale","code":"from numpy import array\n\ndef somme_diagonale(matrice, n):\n    if n == 0:\n        return 0\n    M = array(matrice, dtype=int)\n    s = 0\n    for i in range(n):\n        s = s + int(M[i, i])\n    return s","pseudo":"Fonction SOMME_DIAGONALE(M : Mat,n : Entier) : Entier\nDébut\n  s ← 0\n  Pour i de 0 à n-1 Faire\n    s ← s + M[i,i]\n  FinPour\n  Retourner s\nFin","title":null,"explain":null}]$edits$::jsonb) LOOP
    SELECT r.* INTO rev FROM public.revisions r
      JOIN public.implementations i ON i.id=r.implementation_id
      WHERE r.entry_function=item->>'entry'
      AND r.status IN ('draft','submitted','changes_requested')
      AND i.created_by=owner_id
      ORDER BY r.updated_at DESC LIMIT 1 FOR UPDATE OF r;
    IF NOT FOUND THEN RAISE EXCEPTION 'NumPy draft not found: %',item->>'entry'; END IF;
    new_code:=item->>'code';
    new_pseudo:=item->>'pseudo';
    new_title:=coalesce(item->>'title',rev.title);
    new_lesson:=jsonb_set(jsonb_set(
      rev.lesson_content,'{sections,0,python}',to_jsonb(new_code),true),
      '{sections,0,pseudocode}',to_jsonb(new_pseudo),true);
    new_lesson:=jsonb_set(new_lesson,'{limits}',to_jsonb(
      concat(coalesce(new_lesson->>'limits',''),
      ' Les données saisies en JSON sont converties en tableaux NumPy array ; pour renvoyer un tableau au navigateur, utiliser .tolist().')) ,true);
    PERFORM public.validate_function_contract(rev.entry_function,rev.input_schema,rev.test_cases);
    PERFORM public.validate_lesson_content(new_lesson);
    UPDATE public.revisions SET
      python_code=new_code,pseudocode=new_pseudo,lesson_content=new_lesson,
      title=new_title,explanation=case when item->>'explain' IS NULL then rev.explanation
       || E'\n\nConvention 3ème Info : stockage des tableaux/matrices avec numpy.array, et non des listes Python.' else item->>'explain' end,
      status='draft',test_status='not_run',test_evidence='{}'::jsonb,
      edit_seq=edit_seq+1,submitted_at=NULL,reviewer_id=NULL,review_note=NULL,reviewed_at=NULL,
      updated_at=now()
      WHERE id=rev.id;
    INSERT INTO public.audit_events(actor_id,revision_id,action,details)
      VALUES(owner_id,rev.id,'curriculum_numpy_updated',
        jsonb_build_object('previous_status',rev.status,'old_edit_seq',rev.edit_seq,
          'new_edit_seq',rev.edit_seq+1,'sandbox_tests_required',true));
  END LOOP;
  SELECT id INTO STRICT tri_topic FROM public.topics WHERE slug='tri';
  FOR method IN SELECT value FROM jsonb_array_elements($matrixsorts$[{"entry":"tri_selection_matrice","title":"Tri par sélection — matrice NumPy","code":"from numpy import array\n\ndef tri_selection_matrice(matrice):\n    if len(matrice) == 0:\n        return []\n    M = array(matrice, dtype=int)\n    l, c = M.shape\n    n = l * c\n    for k in range(n - 1):\n        pos = k\n        for j in range(k + 1, n):\n            if M[j // c, j % c] < M[pos // c, pos % c]:\n                pos = j\n        aux = int(M[k // c, k % c])\n        M[k // c, k % c] = M[pos // c, pos % c]\n        M[pos // c, pos % c] = aux\n    return M.tolist()","pseudo":"Fonction TRI_SELECTION_MATRICE(M : Mat,l,c : Entier) : Mat\nDébut\n  n ← l*c\n  Pour k de 0 à n-2 Faire\n    pos ← k\n    Pour j de k+1 à n-1 Faire\n      Si M[j DIV c,j MOD c] < M[pos DIV c,pos MOD c] Alors pos ← j FinSi\n    FinPour\n    aux ← M[k DIV c,k MOD c]\n    M[k DIV c,k MOD c] ← M[pos DIV c,pos MOD c]\n    M[pos DIV c,pos MOD c] ← aux\n  FinPour\n  Retourner M\nFin","principle":"Tri par sélection des cellules d'une matrice NumPy dans l'ordre de parcours ligne par ligne.","example":"[[9,1,5],[3,7,2]] devient [[1,2,3],[5,7,9]].","limits":"Matrice rectangulaire d'entiers. Les dimensions ne changent pas. Les éléments sont triés globalement dans l'ordre des lignes.","tests":[{"inputs":{"matrice":[[9,1,5],[3,7,2]]},"expected":[[1,2,3],[5,7,9]]},{"inputs":{"matrice":[[4,4],[0,-2]]},"expected":[[-2,0],[4,4]]},{"inputs":{"matrice":[]},"expected":[]}]},{"entry":"tri_bulles_matrice","title":"Tri à bulles — matrice NumPy","code":"from numpy import array\n\ndef tri_bulles_matrice(matrice):\n    if len(matrice) == 0:\n        return []\n    M = array(matrice, dtype=int)\n    l, c = M.shape\n    n = l * c\n    for i in range(n - 1):\n        for k in range(n - 1 - i):\n            if M[k // c, k % c] > M[(k + 1) // c, (k + 1) % c]:\n                aux = int(M[k // c, k % c])\n                M[k // c, k % c] = M[(k + 1) // c, (k + 1) % c]\n                M[(k + 1) // c, (k + 1) % c] = aux\n    return M.tolist()","pseudo":"Fonction TRI_BULLES_MATRICE(M : Mat,l,c : Entier) : Mat\nDébut\n  n ← l*c\n  Pour i de 0 à n-2 Faire\n    Pour k de 0 à n-2-i Faire\n      Si M[k DIV c,k MOD c]>M[(k+1) DIV c,(k+1) MOD c] Alors\n        aux ← M[k DIV c,k MOD c]\n        M[k DIV c,k MOD c] ← M[(k+1) DIV c,(k+1) MOD c]\n        M[(k+1) DIV c,(k+1) MOD c] ← aux\n      FinSi\n    FinPour\n  FinPour\n  Retourner M\nFin","principle":"Tri à bulles des cellules d'une matrice NumPy, dans l'ordre ligne par ligne.","example":"[[6,1],[9,3]] devient [[1,3],[6,9]].","limits":"Matrice rectangulaire d'entiers. Les cellules sont comparées comme une suite parcourue ligne par ligne.","tests":[{"inputs":{"matrice":[[9,1,5],[3,7,2]]},"expected":[[1,2,3],[5,7,9]]},{"inputs":{"matrice":[[6,1],[9,3]]},"expected":[[1,3],[6,9]]},{"inputs":{"matrice":[]},"expected":[]}]}]$matrixsorts$::jsonb) LOOP
    IF EXISTS(SELECT 1 FROM public.revisions WHERE entry_function=method->>'entry') THEN CONTINUE; END IF;
    schema:=jsonb_build_object('parameters',jsonb_build_array(jsonb_build_object('name','matrice','type','list[list[int]]')),'returns','list[list[int]]');
    SELECT jsonb_agg(jsonb_build_object('label',(method->>'title')||' — test '||ord,'inputs',test->'inputs','expected',test->'expected')) INTO cases
      FROM jsonb_array_elements(method->'tests') WITH ORDINALITY AS x(test,ord);
    new_lesson:=jsonb_build_object('principle',method->>'principle','example',method->>'example',
      'limits',method->>'limits','sections',jsonb_build_array(jsonb_build_object(
        'title','Méthode de tri NumPy — Base',
        'python',method->>'code','pseudocode',method->>'pseudo',
        'note','On parcourt M[i,j] en suivant un indice logique k = i*c+j.')));
    PERFORM public.validate_function_contract(method->>'entry',schema,cases);
    PERFORM public.validate_lesson_content(new_lesson);
    INSERT INTO public.implementations(topic_id,method_type,created_by)
      VALUES(tri_topic,'base',owner_id) RETURNING id INTO matrix_impl;
    INSERT INTO public.revisions(implementation_id,created_by,title,explanation,pseudocode,python_code,
      entry_function,input_schema,test_cases,lesson_content,status,test_status)
      VALUES(matrix_impl,owner_id,method->>'title',
        method->>'principle'||E'\n\n'||method->>'example'||E'\n'||method->>'limits',
        method->>'pseudo',method->>'code',method->>'entry',schema,cases,new_lesson,'draft','not_run')
      RETURNING id INTO fresh_id;
    INSERT INTO public.audit_events(actor_id,revision_id,action,details)
      VALUES(owner_id,fresh_id,'draft_created',jsonb_build_object('curriculum','3eme_info_numpy_tri'));
  END LOOP;
  -- Preserve the published MATRICE lesson while preparing a reviewer-gated NumPy successor.
  SELECT r.* INTO approved FROM public.revisions r
    JOIN public.implementations i ON i.id=r.implementation_id
    JOIN public.topics t ON t.id=i.topic_id
    WHERE t.slug='matrice' AND r.entry_function='somme_matrice'
      AND r.status='published' AND i.published_revision_id=r.id
    LIMIT 1;
  IF FOUND AND NOT EXISTS(
      SELECT 1 FROM public.revisions WHERE implementation_id=approved.implementation_id AND status IN ('draft','changes_requested','submitted')
  ) THEN
    new_code:=$matrix$from numpy import array

def somme_matrice(matrice, l, c):
    if l == 0 or c == 0:
        return 0
    M = array(matrice, dtype=int)
    s = 0
    for i in range(l):
        for j in range(c):
            s = s + int(M[i, j])
    return s$matrix$;
    new_pseudo:='Fonction SOMME_MATRICE(M : Mat,l,c : Entier) : Entier'
      ||E'\nDébut\n  s ← 0\n  Pour i de 0 à l-1 Faire\n    Pour j de 0 à c-1 Faire\n      s ← s+M[i,j]\n    FinPour\n  FinPour\n  Retourner s\nFin';
    new_lesson:=jsonb_set(jsonb_set(approved.lesson_content,
      '{sections,0,python}',to_jsonb(new_code),true),
      '{sections,0,pseudocode}',to_jsonb(new_pseudo),true);
    new_lesson:=jsonb_set(new_lesson,'{limits}',to_jsonb(
      concat(coalesce(new_lesson->>'limits',''),' Version NumPy : M[i,j] ; l et c sont les dimensions.')),true);
    PERFORM public.validate_lesson_content(new_lesson);
    INSERT INTO public.revisions(implementation_id,created_by,title,explanation,pseudocode,python_code,
      entry_function,input_schema,test_cases,lesson_content,status,test_status,edit_seq)
      VALUES(approved.implementation_id,owner_id,approved.title,
        approved.explanation||E'\n\nProposition de correction : NumPy array(M), accès M[i,j].',
        new_pseudo,new_code,approved.entry_function,approved.input_schema,
        approved.test_cases,new_lesson,'draft','not_run',1)
      RETURNING id INTO fresh_id;
    INSERT INTO public.audit_events(actor_id,revision_id,action,details)
      VALUES(owner_id,fresh_id,'draft_created',
        jsonb_build_object('source_published_revision',approved.id,'curriculum','3eme_numpy','requires_new_review',true));
  END IF;
END $do$;
COMMIT;
