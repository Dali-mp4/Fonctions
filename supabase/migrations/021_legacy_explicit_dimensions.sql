-- 021: Ensure public built-in lesson forms carry explicit school dimensions.
-- School input parameters: TABLEAU(T, n), MATRICE(M, l, c).
-- Content is a reviewed legacy lesson snapshot, not user-submitted executable code.
BEGIN;
UPDATE public.legacy_lessons
 SET payload=jsonb_set(payload,'{inputs}',
   payload->'inputs'||jsonb_build_array(
      jsonb_build_object('name','n','label','Taille du tableau (n)',
        'kind','int','default',5,'min_value',1,'max_value',40,'options',jsonb_build_array(),
        'hint','n doit être égal au nombre de valeurs.')
   ),true)
 WHERE slug='tableau'
 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(payload->'inputs') AS v
  WHERE v->>'name'='n');
UPDATE public.legacy_lessons
 SET payload=jsonb_set(payload,'{inputs}',
   payload->'inputs'||jsonb_build_array(
      jsonb_build_object('name','l','label','Nombre de lignes (l)',
        'kind','int','default',2,'min_value',1,'max_value',10,'options',jsonb_build_array(),
        'hint','Nombre de lignes de M.'),
      jsonb_build_object('name','c','label','Nombre de colonnes (c)',
        'kind','int','default',3,'min_value',1,'max_value',10,'options',jsonb_build_array(),
        'hint','Nombre de colonnes par ligne.')
   ),true)
 WHERE slug='matrice'
 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(payload->'inputs') AS v
  WHERE v->>'name'='l');
COMMIT;
