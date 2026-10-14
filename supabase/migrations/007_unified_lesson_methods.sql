-- Phase 5 refinement: approved methods live inside their parent modules and
-- share the same pedagogical structure as the seven base lessons.
-- Apply ONCE after 006. Does not change/delete published pointers or legacy seed.
ALTER TABLE public.revisions
  ADD COLUMN lesson_content jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Existing saved/published drafts are preserved and get a minimal honest
-- presentation derived only from fields they already contain. Authors may
-- enrich their own editable drafts; approved content is never silently edited.
UPDATE public.revisions r SET lesson_content = jsonb_build_object(
  'principle', r.explanation,
  'example', coalesce(nullif(r.test_cases->0->>'label',''), 'Exemple non précisé'),
  'limits', '',
  'sections', jsonb_build_array(jsonb_build_object(
    'title','Algorithme proposé','pseudocode',r.pseudocode,
    'python',r.python_code,'note',''))
) WHERE r.lesson_content = '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.validate_lesson_content(p_content jsonb)
RETURNS void LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE section jsonb;
BEGIN
  IF jsonb_typeof(p_content) IS DISTINCT FROM 'object'
    OR length(p_content::text) > 42000
    OR length(btrim(coalesce(p_content->>'principle',''))) NOT BETWEEN 15 AND 5000
    OR length(btrim(coalesce(p_content->>'example',''))) NOT BETWEEN 3 AND 1000
    OR length(coalesce(p_content->>'limits','')) > 2000
    OR jsonb_typeof(p_content->'sections') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Une fiche complète est requise : principe, exemple et sections';
  END IF;
  IF jsonb_array_length(p_content->'sections') NOT BETWEEN 1 AND 8 THEN
    RAISE EXCEPTION 'Entre 1 et 8 sections pédagogiques sont requises';
  END IF;
  FOR section IN SELECT value FROM jsonb_array_elements(p_content->'sections') LOOP
    IF jsonb_typeof(section) IS DISTINCT FROM 'object'
      OR length(btrim(coalesce(section->>'title',''))) NOT BETWEEN 3 AND 160
      OR length(coalesce(section->>'pseudocode','')) > 10000
      OR length(coalesce(section->>'python','')) > 15000
      OR length(coalesce(section->>'note','')) > 1500
      OR (length(btrim(coalesce(section->>'pseudocode','')))=0
          AND length(btrim(coalesce(section->>'python','')))=0) THEN
      RAISE EXCEPTION 'Titre et pseudo-code ou Python obligatoires pour chaque section';
    END IF;
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.validate_lesson_content(jsonb) FROM PUBLIC, anon, authenticated;

-- Reuse the original, proven contract + optimistic concurrency RPCs in the
-- SAME transaction. If the educational data is invalid, nothing is saved.
CREATE FUNCTION public.create_draft_lesson_with_contract(
  p_topic_slug text, p_method_type text, p_title text, p_explanation text,
  p_pseudocode text, p_python_code text, p_entry_function text,
  p_input_schema jsonb, p_test_cases jsonb, p_lesson_content jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE revision_id uuid;
BEGIN
  PERFORM public.validate_lesson_content(p_lesson_content);
  revision_id := public.create_draft_with_contract(
    p_topic_slug,p_method_type,p_title,p_explanation,p_pseudocode,
    p_python_code,p_entry_function,p_input_schema,p_test_cases);
  UPDATE public.revisions SET lesson_content=p_lesson_content WHERE id=revision_id;
  RETURN revision_id;
END $$;
REVOKE ALL ON FUNCTION public.create_draft_lesson_with_contract(text,text,text,text,text,text,text,jsonb,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_draft_lesson_with_contract(text,text,text,text,text,text,text,jsonb,jsonb,jsonb) TO authenticated;

CREATE FUNCTION public.update_draft_lesson_with_contract(
  p_revision uuid,p_expected_edit_seq integer,p_title text,p_explanation text,
  p_pseudocode text,p_python_code text,p_entry_function text,
  p_input_schema jsonb,p_test_cases jsonb,p_lesson_content jsonb
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE next_seq integer;
BEGIN
  PERFORM public.validate_lesson_content(p_lesson_content);
  next_seq := public.update_draft_with_contract(
    p_revision,p_expected_edit_seq,p_title,p_explanation,p_pseudocode,
    p_python_code,p_entry_function,p_input_schema,p_test_cases);
  UPDATE public.revisions SET lesson_content=p_lesson_content WHERE id=p_revision;
  RETURN next_seq;
END $$;
REVOKE ALL ON FUNCTION public.update_draft_lesson_with_contract(uuid,integer,text,text,text,text,text,jsonb,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.update_draft_lesson_with_contract(uuid,integer,text,text,text,text,text,jsonb,jsonb,jsonb) TO authenticated;

-- Keep exact-version trusted checks, ownership, and locked submitted drafts
-- from migration 005. Also enforce pedagogical form for *every* submit caller,
-- including anyone invoking the old browser RPC directly.
CREATE OR REPLACE FUNCTION public.submit_revision(p_revision uuid, p_expected_edit_seq integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE draft public.revisions%ROWTYPE;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR
     public.current_role() NOT IN ('contributor','reviewer','owner') THEN
    RAISE EXCEPTION 'Contributor role required';
  END IF;
  SELECT * INTO draft FROM public.revisions WHERE id=p_revision FOR UPDATE;
  IF NOT FOUND OR draft.created_by <> (SELECT auth.uid()) OR
     draft.status NOT IN ('draft','changes_requested') OR
     draft.edit_seq <> p_expected_edit_seq OR
     NOT public.revision_has_verified_tests(p_revision,p_expected_edit_seq) THEN
    RAISE EXCEPTION 'Only your saved, unchanged draft with verified passing tests can be submitted';
  END IF;
  PERFORM public.validate_lesson_content(draft.lesson_content);
  UPDATE public.revisions SET status='submitted', submitted_at=now(),
    reviewer_id=NULL, review_note=NULL, reviewed_at=NULL, updated_at=now()
    WHERE id=p_revision;
  INSERT INTO public.audit_events(actor_id,revision_id,action,details)
    VALUES((SELECT auth.uid()),p_revision,'submitted',
      jsonb_build_object('edit_seq',draft.edit_seq,
                         'test_run_id',draft.test_evidence->>'run_id'));
END $$;
REVOKE ALL ON FUNCTION public.submit_revision(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_revision(uuid,integer) TO authenticated;

-- Append ONLY a public-approved pedagogical JSON projection. Invoker RLS
-- continues to restrict anon visitors to the revision pinned as published.
CREATE OR REPLACE VIEW public.published_methods WITH (security_invoker=true) AS
SELECT r.id, i.id AS implementation_id,
  t.slug AS topic_slug, t.title AS topic_title, t.category, t.school_level,
  i.method_type, r.title, r.explanation, r.pseudocode, r.python_code,
  r.entry_function, r.input_schema, r.test_cases, r.reviewed_at,
  r.lesson_content
FROM public.implementations i
JOIN public.revisions r ON r.id=i.published_revision_id AND r.implementation_id=i.id
JOIN public.topics t ON t.id=i.topic_id
WHERE r.status='published' AND r.test_status='passed'
  AND r.reviewer_id IS NOT NULL AND r.reviewer_id <> r.created_by
  AND r.reviewed_at IS NOT NULL;
REVOKE ALL ON public.published_methods FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.published_methods TO anon,authenticated;
