-- Phase 5+ account management. Apply once after 008.
-- Deliberately NON-destructive: deletion requests do NOT delete auth users,
-- published revisions, audit actors, reviewer attestations or private drafts.
-- Accounts with linked work need manual review / a future preservation policy.

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','cancelled')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS account_deletion_requests_self_or_owner ON public.account_deletion_requests;
CREATE POLICY account_deletion_requests_self_or_owner
  ON public.account_deletion_requests FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.current_role() = 'owner');

REVOKE ALL ON public.account_deletion_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.account_deletion_requests TO authenticated;

-- Display names are controlled server-side; direct profile role changes stay
-- forbidden. Never copy names into the audit event payload.
CREATE OR REPLACE FUNCTION public.set_my_display_name(p_name text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE clean_name text := btrim(coalesce(p_name,''));
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN RAISE EXCEPTION 'Connexion requise'; END IF;
  IF length(clean_name) NOT BETWEEN 2 AND 80
     OR clean_name ~ '[[:cntrl:]]' THEN
    RAISE EXCEPTION 'Le nom doit contenir de 2 à 80 caractères valides';
  END IF;
  UPDATE public.profiles SET display_name = clean_name
    WHERE id = (SELECT auth.uid());
  IF NOT FOUND THEN RAISE EXCEPTION 'Profil introuvable'; END IF;
  INSERT INTO public.audit_events(actor_id, action, details)
    VALUES((SELECT auth.uid()),'profile_updated','{}'::jsonb);
  RETURN clean_name;
END $$;
REVOKE ALL ON FUNCTION public.set_my_display_name(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_display_name(text) TO authenticated;

-- Never directly delete profiles here: REFERENCES from active/published
-- implementations, reviewer attestations, test runs and audit history exist.
CREATE OR REPLACE FUNCTION public.request_my_account_deletion()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE account_role text;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN RAISE EXCEPTION 'Connexion requise'; END IF;
  SELECT role INTO account_role FROM public.profiles
    WHERE id=(SELECT auth.uid()) FOR UPDATE;
  IF account_role IS NULL THEN RAISE EXCEPTION 'Profil introuvable'; END IF;
  IF account_role='owner' THEN
    RAISE EXCEPTION 'Le propriétaire ne peut pas supprimer son compte ici';
  END IF;
  INSERT INTO public.account_deletion_requests (user_id, status, requested_at, updated_at)
    VALUES((SELECT auth.uid()),'pending',now(),now())
  ON CONFLICT (user_id) DO UPDATE SET
    status='pending',requested_at=now(),updated_at=now();
END $$;
REVOKE ALL ON FUNCTION public.request_my_account_deletion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_my_account_deletion() TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_my_account_deletion()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN RAISE EXCEPTION 'Connexion requise'; END IF;
  UPDATE public.account_deletion_requests
    SET status='cancelled',updated_at=now()
    WHERE user_id=(SELECT auth.uid()) AND status='pending';
END $$;
REVOKE ALL ON FUNCTION public.cancel_my_account_deletion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_my_account_deletion() TO authenticated;
