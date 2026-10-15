import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole, ArrowRight } from "lucide-react";
import { authConfigured, serverSupabase } from "@/lib/supabase-server";
import { AccountClient } from "@/components/account-client";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const sb = await serverSupabase();
  const {data:{user}} = sb ? await sb.auth.getUser() : {data:{user:null}};
  if (!authConfigured || !user) return <div className="shell inner-page">
    <div className="page-eyebrow">/ MON COMPTE</div>
    <h1>Mon compte<span className="title-dot">.</span></h1>
    <div className="studio-guard"><LockKeyhole size={35}/><h2>Connexion requise</h2>
      <p>{!authConfigured ? "L'authentification Supabase n'est pas configurée." :
        "Connecte-toi pour consulter et gérer ton profil en toute sécurité."}</p>
      <Link href="/connexion" className="btn btn-primary">Se connecter <ArrowRight size={17}/></Link>
    </div>
  </div>;
  const [profile, deletion] = await Promise.all([
    sb!.from("profiles").select("display_name,role").eq("id",user.id).maybeSingle(),
    sb!.from("account_deletion_requests").select("status").eq("user_id",user.id).maybeSingle(),
  ]);
  const providers = Array.from(new Set([
    ...(user.identities ?? []).map(identity => identity.provider),
    ...((user.app_metadata?.providers as string[] | undefined) ?? []),
  ]));
  return <div className="shell inner-page">
    <div className="page-eyebrow">/ ESPACE MEMBRES</div>
    <h1>Mon compte<span className="title-dot">.</span></h1>
    <p className="page-lead">Informations personnelles, sécurité et contrôle de tes sessions.</p>
    <AccountClient email={user.email ?? ""} displayName={profile.data?.display_name ?? ""}
      role={profile.data?.role ?? "student"}
      joined={user.created_at} lastLogin={user.last_sign_in_at ?? null}
      confirmed={Boolean(user.email_confirmed_at)}
      providers={providers} deletionStatus={deletion.data?.status ?? null}/>
  </div>;
}
