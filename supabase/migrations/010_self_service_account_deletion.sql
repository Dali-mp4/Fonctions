-- 010: irreversible self-service account deletion, preserving reviewed lessons.
-- Run ONCE AFTER 009. This migration alone deletes NO existing accounts.
-- A deleted author/reviewer becomes a unique, unlinked pseudonymous profile.
-- No published source, revision, approval or trusted test evidence is deleted.
--
-- WHY: profiles.id previously cascaded from auth.users; revisions and their
-- attestations require durable, distinct authors/reviewers. Dropping ONLY this
-- profiles-to-auth FK permits orphaned pseudonymous actor profiles with no login.
-- Ordinary user profiles remain created by the auth.users insert trigger.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- A deleted actor never has an active role even if legacy JWT claims exist.
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p.role FROM public.profiles p
  JOIN auth.users u ON u.id=p.id
  WHERE p.id=(SELECT auth.uid()) AND NOT p.is_deleted
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.current_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_role() TO anon,authenticated;

-- Prevent management UI from assigning a role to an orphaned tombstone.
CREATE OR REPLACE FUNCTION public.set_member_role(p_user uuid, p_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE target_role text;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR public.current_role() <> 'owner'
     OR p_role NOT IN ('student','contributor','reviewer') THEN
    RAISE EXCEPTION 'Seul le propriétaire peut attribuer ce rôle';
  END IF;
  SELECT p.role INTO target_role
  FROM public.profiles p JOIN auth.users u ON u.id=p.id
  WHERE p.id=p_user AND NOT p.is_deleted FOR UPDATE OF p;
  IF NOT FOUND OR target_role='owner' THEN
    RAISE EXCEPTION 'Compte introuvable, supprimé ou propriétaire';
  END IF;
  UPDATE public.profiles SET role=p_role WHERE id=p_user;
  INSERT INTO public.audit_events(actor_id,action,details)
    VALUES ((SELECT auth.uid()),'role_changed',
      jsonb_build_object('user_id',p_user,'new_role',p_role));
END $$;
REVOKE ALL ON FUNCTION public.set_member_role(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_member_role(uuid,text) TO authenticated;

-- Never accept an identity UUID from the caller: only auth.uid() is deletable.
-- All relational changes and auth.users deletion happen in ONE DB transaction.
-- The caller must have signed in recently and confirm their exact email.
-- The app does not currently offer user-managed Storage uploads. If objects
-- owned by this user exist, abort: Storage API handling is required first.
CREATE FUNCTION public.delete_my_account(p_confirm_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  target_uid uuid := (SELECT auth.uid());
  confirmed_user auth.users%ROWTYPE;
  account_role text;
  anonymous_uid uuid := gen_random_uuid();
BEGIN
  IF target_uid IS NULL THEN
    RAISE EXCEPTION 'Connexion requise';
  END IF;
  -- Serializes with role changes and other edits to this account.
  SELECT * INTO confirmed_user FROM auth.users
    WHERE id=target_uid FOR UPDATE;
  IF NOT FOUND OR confirmed_user.email IS NULL
     OR confirmed_user.email IS DISTINCT FROM p_confirm_email THEN
    RAISE EXCEPTION 'Confirme ton adresse e-mail exacte pour continuer';
  END IF;
  SELECT role INTO account_role FROM public.profiles
    WHERE id=target_uid AND NOT is_deleted FOR UPDATE;
  IF NOT FOUND OR account_role='owner' THEN
    RAISE EXCEPTION 'La suppression du compte propriétaire est désactivée';
  END IF;
  IF confirmed_user.last_sign_in_at IS NULL OR
     confirmed_user.last_sign_in_at < now()-interval '15 minutes' THEN
    RAISE EXCEPTION 'Reconnecte-toi avant de supprimer ton compte (15 minutes)';
  END IF;
  IF EXISTS(SELECT 1 FROM storage.objects WHERE owner_id=target_uid::text) THEN
    RAISE EXCEPTION 'Supprime les fichiers stockés avant de supprimer ce compte';
  END IF;

  -- One tombstone PER person preserves the reviewer != author relationship.
  -- It has NO auth.users identity, email, display name or login credentials.
  INSERT INTO public.profiles(id,display_name,role,is_deleted,created_at)
    VALUES(anonymous_uid,NULL,'student',true,now());

  -- Preserve reviewed code, independent approvals, moderation evidence,
  -- audit decisions and quota history, now with unlinked author references.
  UPDATE public.topics SET created_by=anonymous_uid WHERE created_by=target_uid;
  UPDATE public.implementations SET created_by=anonymous_uid WHERE created_by=target_uid;
  UPDATE public.revisions SET created_by=anonymous_uid WHERE created_by=target_uid;
  UPDATE public.revisions SET reviewer_id=anonymous_uid WHERE reviewer_id=target_uid;
  UPDATE public.draft_test_runs SET actor_id=anonymous_uid WHERE actor_id=target_uid;
  UPDATE public.public_method_runs SET actor_id=anonymous_uid WHERE actor_id=target_uid;
  UPDATE public.audit_events SET actor_id=anonymous_uid WHERE actor_id=target_uid;
  UPDATE public.audit_events SET
    details=jsonb_set(details,'{user_id}',to_jsonb(anonymous_uid::text))
    WHERE details->>'user_id'=target_uid::text;

  INSERT INTO public.audit_events(actor_id,action,details)
    VALUES(anonymous_uid,'account_self_deleted',
      jsonb_build_object('identity_removed',true,'publications_preserved',true));

  -- Profile and auth account disappear; deletion_requests follow auth.users
  -- via the existing ON DELETE CASCADE. Other contributors stay untouched.
  DELETE FROM public.profiles WHERE id=target_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profil introuvable; suppression annulée'; END IF;
  DELETE FROM auth.users WHERE id=target_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Identité introuvable; suppression annulée'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.delete_my_account(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account(text) TO authenticated;
