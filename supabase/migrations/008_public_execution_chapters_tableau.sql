-- Phase 5 extensions: contributor-proposed concepts + metered student executions.
-- Apply ONCE after 007. Does not erase accounts, drafts, approved code or reviews.

-- Proposed concepts are private to creator/reviewers until the first method is
-- independently approved. Existing 7 official topics are always published.
ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT 'published'
    CHECK (state IN ('pending','published')),
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS summary text NOT NULL DEFAULT '';

DROP POLICY IF EXISTS topics_read ON public.topics;
CREATE POLICY topics_read ON public.topics FOR SELECT TO anon, authenticated
 USING (state='published' OR created_by = (SELECT auth.uid())
   OR public.current_role() IN ('reviewer','owner'));
-- The only way to create a chapter is a scoped transaction that creates its
-- first base draft in the same transaction and audits it. No direct writes.
REVOKE INSERT, UPDATE, DELETE ON public.topics FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.create_chapter_lesson(
  p_slug text, p_chapter_title text, p_category text,
  p_school_level text, p_summary text,
  p_title text, p_explanation text, p_pseudocode text, p_python_code text,
  p_entry_function text, p_input_schema jsonb, p_test_cases jsonb,
  p_lesson_content jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE new_revision uuid;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR
    public.current_role() NOT IN ('contributor','reviewer','owner') THEN
    RAISE EXCEPTION 'Contributor role required';
  END IF;
  IF coalesce(p_slug,'') !~ '^[a-z][a-z0-9-]{2,39}$'
     OR p_slug IN ('api','admin','studio','compte','bibliotheque')
     OR length(btrim(coalesce(p_chapter_title,''))) NOT BETWEEN 4 AND 100
     OR length(btrim(coalesce(p_category,''))) NOT BETWEEN 3 AND 80
     OR length(btrim(coalesce(p_school_level,''))) NOT BETWEEN 3 AND 80
     OR length(btrim(coalesce(p_summary,''))) NOT BETWEEN 20 AND 500 THEN
    RAISE EXCEPTION 'Chapter slug, title, category, level or summary invalid';
  END IF;
  INSERT INTO public.topics (slug,title,category,school_level,summary,state,created_by)
  VALUES (p_slug,btrim(p_chapter_title),btrim(p_category),
          btrim(p_school_level),btrim(p_summary),'pending',(SELECT auth.uid()));
  new_revision := public.create_draft_lesson_with_contract(
    p_slug,'base',p_title,p_explanation,p_pseudocode,p_python_code,
    p_entry_function,p_input_schema,p_test_cases,p_lesson_content);
  INSERT INTO public.audit_events(actor_id,revision_id,action,details)
    VALUES ((SELECT auth.uid()),new_revision,'chapter_proposed',
      jsonb_build_object('slug',p_slug,'title',p_chapter_title));
  RETURN new_revision;
END $$;
REVOKE ALL ON FUNCTION public.create_chapter_lesson(
  text,text,text,text,text,text,text,text,text,text,jsonb,jsonb,jsonb
) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_chapter_lesson(
  text,text,text,text,text,text,text,text,text,text,jsonb,jsonb,jsonb
) TO authenticated;

-- On approval (or restoration), the reviewed first method makes its chapter
-- visible. The trigger re-checks the approved pointer and cannot publish a
-- chapter from an unapproved or self-reviewed draft.
CREATE FUNCTION public.publish_reviewed_chapter()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.topics t SET state='published'
  FROM public.revisions r
  WHERE t.id=NEW.topic_id AND t.state='pending'
    AND t.created_by=NEW.created_by
    AND r.id=NEW.published_revision_id
    AND r.implementation_id=NEW.id
    AND r.created_by=NEW.created_by
    AND r.status='published' AND r.test_status='passed'
    AND r.reviewer_id IS NOT NULL AND r.reviewer_id<>r.created_by
    AND r.reviewed_at IS NOT NULL
    AND public.revision_has_verified_tests(r.id,r.edit_seq);
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.publish_reviewed_chapter() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER publish_reviewed_chapter_after_approval
 AFTER UPDATE OF published_revision_id ON public.implementations
 FOR EACH ROW WHEN (NEW.published_revision_id IS NOT NULL)
 EXECUTE FUNCTION public.publish_reviewed_chapter();

-- The public approved-only view is the sole read endpoint for runnable source.
-- It inherits RLS on revisions, implementations and topics (security_invoker).
CREATE OR REPLACE VIEW public.published_methods WITH (security_invoker=true) AS
SELECT r.id, i.id AS implementation_id,
  t.slug AS topic_slug, t.title AS topic_title, t.category, t.school_level,
  i.method_type, r.title, r.explanation, r.pseudocode, r.python_code,
  r.entry_function, r.input_schema, r.test_cases, r.reviewed_at,
  r.lesson_content, t.summary AS topic_summary
FROM public.implementations i
JOIN public.revisions r ON r.id=i.published_revision_id AND r.implementation_id=i.id
JOIN public.topics t ON t.id=i.topic_id
WHERE t.state='published' AND r.status='published' AND r.test_status='passed'
  AND r.reviewer_id IS NOT NULL AND r.reviewer_id<>r.created_by
  AND r.reviewed_at IS NOT NULL;
REVOKE ALL ON public.published_methods FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.published_methods TO anon,authenticated;

-- Meter paid public-method executions even across multiple API hosts.
-- Auth required: 2/min + 15/day per account, 250/day across project. A
-- per-project advisory lock makes reservations serializable for quota counts.
CREATE TABLE public.public_method_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 revision_id uuid NOT NULL REFERENCES public.revisions(id),
 actor_id uuid NOT NULL REFERENCES public.profiles(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX public_method_runs_actor_time ON public.public_method_runs(actor_id,created_at DESC);
CREATE INDEX public_method_runs_time ON public.public_method_runs(created_at DESC);
ALTER TABLE public.public_method_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.public_method_runs FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.reserve_public_method_run(p_revision uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE reserved_uuid uuid;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid())) THEN
    RAISE EXCEPTION 'Connecte-toi pour essayer cette méthode';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(584920314);
  IF (SELECT count(*) FROM public.public_method_runs
       WHERE created_at > now()-interval '1 day') >= 250 THEN
    RAISE EXCEPTION 'Budget journalier de la plateforme atteint';
  END IF;
  IF (SELECT count(*) FROM public.public_method_runs
       WHERE actor_id=(SELECT auth.uid()) AND created_at>now()-interval '1 minute') >= 2
     OR (SELECT count(*) FROM public.public_method_runs
       WHERE actor_id=(SELECT auth.uid()) AND created_at>now()-interval '1 day') >= 15 THEN
    RAISE EXCEPTION 'Limite de lancements atteinte; réessaie plus tard';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.revisions r
    JOIN public.implementations i ON i.published_revision_id=r.id
      AND i.id=r.implementation_id
    JOIN public.topics t ON t.id=i.topic_id
    WHERE r.id=p_revision AND t.state='published'
      AND r.status='published' AND r.test_status='passed'
      AND r.reviewer_id IS NOT NULL AND r.reviewer_id<>r.created_by
      AND r.reviewed_at IS NOT NULL
      AND public.revision_has_verified_tests(r.id,r.edit_seq)
  ) THEN
    RAISE EXCEPTION 'Méthode non publiée ou non vérifiée';
  END IF;
  INSERT INTO public.public_method_runs(revision_id,actor_id)
  VALUES(p_revision,(SELECT auth.uid())) RETURNING id INTO reserved_uuid;
  RETURN reserved_uuid;
END $$;
REVOKE ALL ON FUNCTION public.reserve_public_method_run(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reserve_public_method_run(uuid) TO authenticated;

-- TABLEAU: remove optional sorting from the original classroom lesson in DB.
-- Its previous selection-sort section becomes a separate, trusted Base variant
-- in application code; legacy audit/import provenance is retained.
UPDATE public.legacy_lessons l
SET payload = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(l.payload, '{inputs}', (l.payload->'inputs') - 1),
      '{code_sections}', (l.payload->'code_sections') - 4),
    '{summary}',to_jsonb('Comprendre la déclaration, le remplissage et l’affichage d’un tableau.'::text)),
  '{principle}',to_jsonb('Un tableau contient plusieurs valeurs du même type, accessibles par leur indice. On le déclare, on remplit ses cases, puis on les affiche dans l’ordre.'::text))
WHERE l.slug='tableau'
  AND jsonb_array_length(l.payload->'inputs')=2
  AND jsonb_array_length(l.payload->'code_sections')=5;
-- source_sha256 remains the archived checksum of the ORIGINAL Fonctions V1 source.
