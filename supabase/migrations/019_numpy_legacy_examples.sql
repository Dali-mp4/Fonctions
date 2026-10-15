-- 019: Align the immutable seven-lesson teaching snapshots stored in Supabase
-- with NumPy array declarations. This only changes explanation/example text for
-- TABLEAU and MATRICE; no approved contributor Python code is overwritten.
BEGIN;
UPDATE public.legacy_lessons
SET payload=jsonb_set(
  jsonb_set(payload,'{example}',
    to_jsonb('T = array([8, 3, 11, 2, 5]) ; T[0] = 8 ; n = 5'::text),true),
  '{principle}',to_jsonb(
    'Un tableau contient plusieurs valeurs du même type, accessibles par leur indice. On le déclare, on remplit ses cases, puis on les affiche dans l’ordre. En Python scolaire, on utilise numpy.array plutôt qu’une liste.'::text),true)
WHERE slug='tableau';
UPDATE public.legacy_lessons
SET payload=jsonb_set(
  jsonb_set(payload,'{example}',
    to_jsonb('M = array([[1, 2, 3], [4, 5, 6]]) → 2 lignes × 3 colonnes'::text),true),
  '{principle}',to_jsonb(
    'Une matrice est organisée en lignes et colonnes. Elle est créée avec numpy.array et on accède aux cellules avec deux indices M[i, j].'::text),true)
WHERE slug='matrice';
COMMIT;
