-- 011: Independent AI translation approval for immutable, approved French revisions.
-- Apply once after 010. French publications remain immediately available.
CREATE TABLE public.revision_translations (
  revision_id uuid NOT NULL REFERENCES public.revisions(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('en','ar')),
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','pending','approved')),
  content jsonb,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (revision_id,locale),
  CONSTRAINT translated_content_object CHECK (content IS NULL OR jsonb_typeof(content) = 'object')
);
CREATE INDEX translation_review_queue ON public.revision_translations(status,updated_at DESC);
ALTER TABLE public.revision_translations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revision_translations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.revision_translations TO anon, authenticated;

-- Unapproved text is never readable by students. Reviewers can see their queue.
CREATE POLICY translation_reviewers_read ON public.revision_translations
 FOR SELECT TO authenticated USING ((SELECT public.current_role()) IN ('reviewer','owner'));
CREATE POLICY translation_students_read_approved ON public.revision_translations
 FOR SELECT TO anon,authenticated USING (
  status='approved' AND EXISTS (
   SELECT 1 FROM public.revisions r
   JOIN public.implementations i ON i.id=r.implementation_id
   WHERE r.id=revision_id AND r.status='published'
     AND i.published_revision_id=r.id
  )
 );

-- French code/pseudocode are never part of translated content. This schema accepts
-- ONLY safe teaching prose and section labels, not executable content or identifiers.
CREATE FUNCTION public.translation_content_valid(p_content jsonb, p_sections integer)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT coalesce(
   jsonb_typeof(p_content)='object'
   AND p_content ?& ARRAY['topic_summary','explanation','principle','example','limits','sections']
   AND NOT EXISTS (
     SELECT 1 FROM jsonb_object_keys(p_content) key
     WHERE key NOT IN ('topic_summary','explanation','principle','example','limits','sections')
   )
   AND jsonb_typeof(p_content->'sections')='array'
   AND jsonb_array_length(p_content->'sections')=p_sections
   AND length(p_content::text)<=30000
   AND jsonb_typeof(p_content->'topic_summary')='string'
   AND jsonb_typeof(p_content->'explanation')='string'
   AND jsonb_typeof(p_content->'principle')='string'
   AND jsonb_typeof(p_content->'example')='string'
   AND jsonb_typeof(p_content->'limits')='string'
   AND length(p_content->>'topic_summary')<=500
   AND length(p_content->>'explanation') BETWEEN 1 AND 20000
   AND length(p_content->>'principle') BETWEEN 1 AND 5000
   AND length(p_content->>'example')<=1000
   AND length(p_content->>'limits')<=2000
   AND NOT EXISTS (
     SELECT 1 FROM jsonb_array_elements(p_content->'sections') s
     WHERE jsonb_typeof(s)<>'object'
       OR NOT (s ?& ARRAY['title','note'])
       OR EXISTS (SELECT 1 FROM jsonb_object_keys(s) k WHERE k NOT IN ('title','note'))
       OR jsonb_typeof(s->'title')<>'string'
       OR jsonb_typeof(s->'note')<>'string'
       OR length(s->>'title') NOT BETWEEN 1 AND 160
       OR length(s->>'note')>1500
   ), false);
$$;
REVOKE ALL ON FUNCTION public.translation_content_valid(jsonb,integer) FROM PUBLIC,anon,authenticated;

-- Queue both languages atomically when a reviewer publishes a revision.
CREATE FUNCTION public.queue_approved_revision_translations()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.status='published' THEN
  INSERT INTO public.revision_translations(revision_id,locale)
  VALUES(NEW.id,'en'),(NEW.id,'ar')
  ON CONFLICT (revision_id,locale) DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.queue_approved_revision_translations() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER queue_translations_after_publication
 AFTER UPDATE OF status ON public.revisions
 FOR EACH ROW WHEN (NEW.status='published')
 EXECUTE FUNCTION public.queue_approved_revision_translations();

-- Existing published revisions also get queued without changing publications.
INSERT INTO public.revision_translations(revision_id,locale)
 SELECT r.id, l.locale FROM public.revisions r
 JOIN public.implementations i ON i.published_revision_id=r.id,
 (VALUES ('en'),('ar')) l(locale)
 WHERE r.status='published'
 ON CONFLICT DO NOTHING;

-- Only a signed-in reviewer can record machine-generated text. Already-pending
-- edits and approved translations cannot be overwritten by a generation retry.
CREATE FUNCTION public.record_generated_translation(
 p_revision uuid,p_locale text,p_content jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE original public.revisions%ROWTYPE;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR public.current_role() NOT IN ('reviewer','owner')
   OR p_locale NOT IN ('en','ar') THEN
   RAISE EXCEPTION 'Reviewer role required';
 END IF;
 SELECT * INTO original FROM public.revisions WHERE id=p_revision;
 IF NOT FOUND OR original.status<>'published' OR
    NOT EXISTS (SELECT 1 FROM public.implementations i
      WHERE i.id=original.implementation_id AND i.published_revision_id=original.id) THEN
  RAISE EXCEPTION 'Revision is not currently published';
 END IF;
 IF NOT public.translation_content_valid(p_content,
   jsonb_array_length(original.lesson_content->'sections')) THEN
   RAISE EXCEPTION 'Invalid translation structure';
 END IF;
 UPDATE public.revision_translations SET content=p_content,status='pending',
   reviewed_by=NULL,reviewed_at=NULL,updated_at=now()
 WHERE revision_id=p_revision AND locale=p_locale AND status='queued';
 IF NOT FOUND THEN RAISE EXCEPTION 'Translation is no longer queued'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.record_generated_translation(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_generated_translation(uuid,text,jsonb) TO authenticated;

-- Approval is distinct from the French technical review and still cannot be
-- performed by the original author. Reviewed edits are stored atomically.
CREATE FUNCTION public.approve_reviewed_translation(
 p_revision uuid,p_locale text,p_content jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE original public.revisions%ROWTYPE;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR public.current_role() NOT IN ('reviewer','owner')
   OR p_locale NOT IN ('en','ar') THEN
   RAISE EXCEPTION 'Reviewer role required';
 END IF;
 SELECT * INTO original FROM public.revisions WHERE id=p_revision;
 IF NOT FOUND OR original.created_by=(SELECT auth.uid()) OR original.status<>'published'
 OR NOT EXISTS (SELECT 1 FROM public.implementations i
  WHERE i.id=original.implementation_id AND i.published_revision_id=original.id) THEN
   RAISE EXCEPTION 'Only an independent reviewer may approve a published revision translation';
 END IF;
 IF NOT public.translation_content_valid(p_content,
   jsonb_array_length(original.lesson_content->'sections')) THEN
   RAISE EXCEPTION 'Invalid translation structure';
 END IF;
 UPDATE public.revision_translations
  SET content=p_content,status='approved',reviewed_by=(SELECT auth.uid()),
      reviewed_at=now(),updated_at=now()
 WHERE revision_id=p_revision AND locale=p_locale AND status='pending';
 IF NOT FOUND THEN RAISE EXCEPTION 'No pending translation to approve'; END IF;
 INSERT INTO public.audit_events(actor_id,revision_id,action,details)
 VALUES ((SELECT auth.uid()),p_revision,'translation_approved',
  jsonb_build_object('locale',p_locale));
END $$;
REVOKE ALL ON FUNCTION public.approve_reviewed_translation(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.approve_reviewed_translation(uuid,text,jsonb) TO authenticated;
