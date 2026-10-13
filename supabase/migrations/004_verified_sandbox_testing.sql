-- Phase 3B: trusted, rate-limited draft test reservations and verified results.
-- Run once AFTER 001, 002 and 003; do not rerun earlier migrations.
-- The API host alone holds the service_role credential; Modal sandboxes have NO keys.
CREATE TABLE public.draft_test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id uuid NOT NULL REFERENCES public.revisions(id),
  actor_id uuid NOT NULL REFERENCES public.profiles(id),
  edit_seq integer NOT NULL CHECK (edit_seq > 0),
  status text NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved','passed','failed','error')),
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX draft_test_runs_actor_created_idx ON public.draft_test_runs(actor_id, created_at DESC);
ALTER TABLE public.draft_test_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY draft_test_runs_read_self ON public.draft_test_runs
  FOR SELECT TO authenticated USING (actor_id = (SELECT auth.uid()) OR public.current_role() IN ('reviewer','owner'));
REVOKE ALL ON public.draft_test_runs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.draft_test_runs TO authenticated;

-- Each user may reserve at most 4 runs/minute, 30/day, across ALL API instances.
-- Advisory lock prevents simultaneous requests bypassing this quota.
CREATE OR REPLACE FUNCTION public.reserve_draft_test(p_revision uuid, p_edit_seq integer)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE run_uuid uuid;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR public.current_role() NOT IN ('contributor','reviewer','owner') THEN
    RAISE EXCEPTION 'Contributor role required';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended((SELECT auth.uid())::text, 903));
  IF (SELECT count(*) FROM public.draft_test_runs
      WHERE actor_id = (SELECT auth.uid()) AND created_at > now() - interval '1 minute') >= 4 OR
     (SELECT count(*) FROM public.draft_test_runs
      WHERE actor_id = (SELECT auth.uid()) AND created_at > now() - interval '1 day') >= 30 THEN
    RAISE EXCEPTION 'Limite de tests atteinte; réessaie plus tard';
  END IF;
  IF NOT EXISTS (
      SELECT 1 FROM public.revisions
      WHERE id = p_revision AND created_by = (SELECT auth.uid())
      AND edit_seq = p_edit_seq AND status IN ('draft','changes_requested')
      AND entry_function IS NOT NULL AND jsonb_array_length(test_cases) BETWEEN 1 AND 20
  ) THEN
    RAISE EXCEPTION 'Brouillon non autorisé, modifié ou sans tests';
  END IF;
  INSERT INTO public.draft_test_runs(revision_id, actor_id, edit_seq)
    VALUES(p_revision, (SELECT auth.uid()), p_edit_seq) RETURNING id INTO run_uuid;
  RETURN run_uuid;
END $$;
REVOKE ALL ON FUNCTION public.reserve_draft_test(uuid,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_draft_test(uuid,integer) TO authenticated;

-- This is a *service_role-only* RPC. Test authors must never be able to call
-- it or update test_status directly. The edit sequence also locks out races
-- with edits during sandbox execution, and locks submitted revisions.
CREATE OR REPLACE FUNCTION public.finish_draft_test(
  p_run_id uuid, p_revision uuid, p_edit_seq integer,
  p_outcome text, p_evidence jsonb
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE reserved public.draft_test_runs%ROWTYPE; current_rev public.revisions%ROWTYPE;
BEGIN
  IF p_outcome NOT IN ('passed','failed','error') OR
     jsonb_typeof(p_evidence) IS DISTINCT FROM 'object' OR
     length(p_evidence::text) > 100000 OR
     p_evidence->>'runner' IS DISTINCT FROM 'modal-sandbox-v1' OR
     coalesce(p_evidence->>'edit_seq','') IS DISTINCT FROM p_edit_seq::text OR
     coalesce(p_evidence->>'code_sha256','') !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Invalid trusted test evidence';
  END IF;
  SELECT * INTO reserved FROM public.draft_test_runs
    WHERE id = p_run_id AND revision_id = p_revision AND edit_seq = p_edit_seq
      AND status = 'reserved' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Test reservation invalid or already finalized'; END IF;
  SELECT * INTO current_rev FROM public.revisions WHERE id = p_revision FOR UPDATE;
  IF NOT FOUND OR current_rev.edit_seq <> p_edit_seq OR
     current_rev.created_by <> reserved.actor_id OR
     current_rev.status NOT IN ('draft','changes_requested') OR
     p_evidence->>'case_count' IS DISTINCT FROM jsonb_array_length(current_rev.test_cases)::text OR
     jsonb_typeof(p_evidence->'results') IS DISTINCT FROM 'array' OR
     (p_outcome <> 'error' AND jsonb_array_length(p_evidence->'results') <> jsonb_array_length(current_rev.test_cases)) OR
     (p_outcome = 'passed' AND EXISTS (
       SELECT 1 FROM jsonb_array_elements(p_evidence->'results') x
       WHERE x->>'passed' IS DISTINCT FROM 'true')) THEN
    RAISE EXCEPTION 'Revision changed or inconsistent evidence';
  END IF;
  UPDATE public.draft_test_runs SET status = p_outcome, evidence = p_evidence, finished_at = now() WHERE id = p_run_id;
  UPDATE public.revisions SET test_status = CASE WHEN p_outcome = 'passed' THEN 'passed'
    WHEN p_outcome = 'failed' THEN 'failed' ELSE 'not_run' END,
    test_evidence = p_evidence, updated_at = now()
    WHERE id = p_revision;
  INSERT INTO public.audit_events(actor_id, revision_id, action, details)
    VALUES(reserved.actor_id, p_revision, 'draft_test_' || p_outcome,
       jsonb_build_object('run_id', p_run_id, 'edit_seq', p_edit_seq));
END $$;
REVOKE ALL ON FUNCTION public.finish_draft_test(uuid,uuid,integer,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_draft_test(uuid,uuid,integer,text,jsonb) TO service_role;
