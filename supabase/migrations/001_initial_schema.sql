-- Algo Fi Jib 2.0: audited drafts, permissions, reviewed publication.
-- Run in a NEW Supabase project. Do not expose the service-role key to the browser.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  role text NOT NULL DEFAULT 'student'
    CHECK (role IN ('student','contributor','reviewer','owner')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.create_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles(id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_profile();

-- Role is read on the server from a protected database row, never from the
-- client-supplied JSON. SECURITY DEFINER avoids recursive profile RLS.
CREATE OR REPLACE FUNCTION public.current_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.current_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_role() TO anon;

CREATE TABLE public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,64}$'),
  title text NOT NULL,
  category text NOT NULL,
  school_level text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.implementations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.topics(id),
  method_type text NOT NULL CHECK (method_type IN ('base','advanced')),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  published_revision_id uuid,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX implementations_topic_idx ON public.implementations(topic_id);

CREATE TABLE public.revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  implementation_id uuid NOT NULL REFERENCES public.implementations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  title text NOT NULL CHECK (length(title) BETWEEN 5 AND 160),
  explanation text NOT NULL CHECK (length(explanation) BETWEEN 15 AND 20000),
  pseudocode text NOT NULL DEFAULT '',
  python_code text NOT NULL CHECK (length(python_code) BETWEEN 10 AND 30000),
  entry_function text,
  input_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','changes_requested','published','archived')),
  -- Only the future trusted sandbox service will record verified pass status.
  test_status text NOT NULL DEFAULT 'not_run'
    CHECK (test_status IN ('not_run','passed','failed')),
  test_evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  edit_seq integer NOT NULL DEFAULT 1,
  reviewer_id uuid REFERENCES public.profiles(id),
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX revisions_impl_idx ON public.revisions(implementation_id, created_at DESC);
ALTER TABLE public.implementations
  ADD CONSTRAINT fk_published_revision
  FOREIGN KEY (published_revision_id) REFERENCES public.revisions(id);

CREATE TABLE public.audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES public.profiles(id),
  revision_id uuid REFERENCES public.revisions(id),
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_read_self_or_reviewers ON public.profiles FOR SELECT TO authenticated
 USING (id = auth.uid() OR public.current_role() IN ('reviewer','owner'));
CREATE POLICY topics_read ON public.topics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY implementations_visible ON public.implementations FOR SELECT TO anon, authenticated
 USING (published_revision_id IS NOT NULL OR created_by = auth.uid()
  OR public.current_role() IN ('reviewer','owner'));
CREATE POLICY revisions_visible ON public.revisions FOR SELECT TO anon, authenticated
 USING (
  EXISTS (SELECT 1 FROM public.implementations i
          WHERE i.id = implementation_id AND i.published_revision_id = revisions.id)
  OR created_by = auth.uid() OR public.current_role() IN ('reviewer','owner')
 );
CREATE POLICY audit_owner_read ON public.audit_events FOR SELECT TO authenticated
 USING (public.current_role() = 'owner');

-- All edits go through validated transactions. No direct writes by browsers.
REVOKE INSERT, UPDATE, DELETE ON public.profiles, public.topics,
  public.implementations, public.revisions, public.audit_events FROM anon, authenticated;
GRANT SELECT ON public.profiles, public.topics, public.implementations,
  public.revisions TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_draft(
  p_topic_slug text, p_method_type text, p_title text,
  p_explanation text, p_pseudocode text, p_python_code text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE topic_id uuid; impl_id uuid; rev_id uuid;
BEGIN
  IF auth.uid() IS NULL OR public.current_role() NOT IN ('contributor','reviewer','owner') THEN
    RAISE EXCEPTION 'Contributor access required';
  END IF;
  IF p_method_type NOT IN ('base','advanced') THEN
    RAISE EXCEPTION 'Invalid method type';
  END IF;
  IF length(btrim(p_title)) NOT BETWEEN 5 AND 160
     OR length(btrim(p_explanation)) NOT BETWEEN 15 AND 20000
     OR length(p_python_code) NOT BETWEEN 10 AND 30000
     OR length(coalesce(p_pseudocode, '')) > 30000 THEN
    RAISE EXCEPTION 'Invalid content length';
  END IF;
  SELECT id INTO topic_id FROM public.topics WHERE slug = p_topic_slug;
  IF topic_id IS NULL THEN RAISE EXCEPTION 'Unknown topic'; END IF;
  INSERT INTO public.implementations(topic_id,method_type,created_by)
    VALUES (topic_id,p_method_type,auth.uid()) RETURNING id INTO impl_id;
  INSERT INTO public.revisions(implementation_id,created_by,title,explanation,pseudocode,python_code)
    VALUES (impl_id,auth.uid(),btrim(p_title),btrim(p_explanation),coalesce(p_pseudocode,''),p_python_code)
    RETURNING id INTO rev_id;
  INSERT INTO public.audit_events(actor_id,revision_id,action)
    VALUES (auth.uid(),rev_id,'draft_created');
  RETURN rev_id;
END $$;
REVOKE ALL ON FUNCTION public.create_draft(text,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_draft(text,text,text,text,text,text) TO authenticated;

-- Owners can grant a contributor/reviewer role using this audited function.
-- No one can grant 'owner' using this RPC. Bootstrap the FIRST owner manually
-- from the Supabase SQL editor, after confirming their auth.users id.
CREATE OR REPLACE FUNCTION public.set_member_role(p_user uuid, p_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF public.current_role() <> 'owner' OR p_role NOT IN ('student','contributor','reviewer') THEN
    RAISE EXCEPTION 'Only owner can assign student/contributor/reviewer roles';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user) THEN
    RAISE EXCEPTION 'Unknown user';
  END IF;
  IF (SELECT role FROM public.profiles WHERE id = p_user) = 'owner' THEN
    RAISE EXCEPTION 'Owner account cannot be modified using this RPC';
  END IF;
  UPDATE public.profiles SET role = p_role WHERE id = p_user;
  INSERT INTO public.audit_events(actor_id,action,details)
  VALUES(auth.uid(),'role_changed',jsonb_build_object('user_id',p_user,'new_role',p_role));
END $$;
REVOKE ALL ON FUNCTION public.set_member_role(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_member_role(uuid,text) TO authenticated;

-- These transactions are defined ahead of time. No UI calls them until the
-- untrusted-code runner can prove tests against the exact submitted revision.
CREATE OR REPLACE FUNCTION public.submit_revision(p_revision uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.revisions SET status='submitted', updated_at=now()
   WHERE id=p_revision AND created_by=auth.uid()
     AND status IN ('draft','changes_requested') AND test_status='passed';
  IF NOT FOUND THEN RAISE EXCEPTION 'Passing sandbox tests required'; END IF;
  INSERT INTO public.audit_events(actor_id,revision_id,action)
    VALUES(auth.uid(),p_revision,'submitted');
END $$;
REVOKE ALL ON FUNCTION public.submit_revision(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_revision(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.approve_revision(p_revision uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE x record;
BEGIN
  IF public.current_role() NOT IN ('reviewer','owner') THEN
    RAISE EXCEPTION 'Reviewer required';
  END IF;
  SELECT * INTO x FROM public.revisions WHERE id=p_revision FOR UPDATE;
  IF NOT FOUND OR x.status <> 'submitted' OR x.test_status <> 'passed'
    OR x.created_by = auth.uid() THEN
    RAISE EXCEPTION 'Cannot approve this submission';
  END IF;
  UPDATE public.revisions SET status='archived',updated_at=now()
  WHERE id=(SELECT published_revision_id FROM public.implementations WHERE id=x.implementation_id);
  UPDATE public.revisions SET status='published',reviewer_id=auth.uid(),reviewed_at=now(),updated_at=now() WHERE id=p_revision;
  UPDATE public.implementations SET published_revision_id=p_revision WHERE id=x.implementation_id;
  INSERT INTO public.audit_events(actor_id,revision_id,action)
    VALUES(auth.uid(),p_revision,'published');
END $$;
REVOKE ALL ON FUNCTION public.approve_revision(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_revision(uuid) TO authenticated;

-- These are concept records only. Educational code remains from the initial
-- seven published repository modules until explicitly migrated/reviewed.
INSERT INTO public.topics(slug,title,category,school_level) VALUES
 ('pgcd','PGCD','Mathématiques','general'),
 ('ppcm','PPCM','Mathématiques','general'),
 ('som-ch','SOM_CH','Traitement','general'),
 ('verif','VERIF','Traitement','general'),
 ('tableau','TABLEAU','Structures de données','general'),
 ('enregistrement','ENREGISTREMENT','Structures de données','general'),
 ('matrice','MATRICE','Structures de données','general');
