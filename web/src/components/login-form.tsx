"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { authConfigured, browserSupabase } from "@/lib/supabase-browser";

export function LoginForm(){
  const [mode,setMode]=useState<"login"|"signup">("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [pending,setPending]=useState(false);
  const [googlePending,setGooglePending]=useState(false);
  const router=useRouter();
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    if(params.get("oauth_error")==="1")
      setError("Connexion Google interrompue. Réessaie ou utilise ton e-mail.");
    if(params.get("deleted")==="1")
      setNotice("Ton compte a été supprimé. Tes anciennes contributions restent consultables sans identité personnelle liée.");
  },[]);

  async function submit(e:React.FormEvent){
    e.preventDefault();setPending(true);setError("");setNotice("");
    const sb=browserSupabase();
    if(!sb){setError("L'authentification n'est pas encore configurée.");setPending(false);return;}
    const result=mode==="login"?
      await sb.auth.signInWithPassword({email,password}):
      await sb.auth.signUp({email,password});
    if(result.error)setError(result.error.message);
    else if(mode==="signup")setNotice("Compte créé. Vérifie ta boîte mail si la confirmation est activée.");
    else{router.push("/compte");router.refresh();}
    setPending(false);
  }
  async function signInWithGoogle(){
    setError("");setNotice("");
    const sb=browserSupabase();
    if(!sb){setError("L'authentification n'est pas encore configurée.");return;}
    setGooglePending(true);
    try {
      // @supabase/ssr saves the PKCE verifier to the same-origin auth cookie.
      // Google's credentials and client secret stay ONLY in Supabase / Google.
      const {data,error:oauthError}=await sb.auth.signInWithOAuth({
        provider:"google",
        options:{redirectTo:`${window.location.origin}/auth/callback`,skipBrowserRedirect:true},
      });
      if(oauthError)throw oauthError;
      if(!data.url)throw new Error("Lien de connexion Google indisponible.");
      // Supabase usually redirects automatically in browsers; handle custom clients.
      window.location.assign(data.url);
    } catch(e){
      setError(e instanceof Error?e.message:"La connexion Google a échoué.");
      setGooglePending(false);
    }
  }
  return <div className="auth-card">
    <div className="auth-icon"><LockKeyhole size={22}/></div>
    <h2>{mode==="login"?"Bienvenue !":"Créer mon compte"}</h2>
    <p>{mode==="login"?"Choisis une méthode pour te connecter.":"Un nouveau compte commence avec le rôle étudiant."}</p>
    {!authConfigured&&<div className="warning-strip">Configure Supabase pour activer les comptes.</div>}
    <button type="button" className="google-auth-button"
      disabled={!authConfigured||pending||googlePending}
      onClick={()=>void signInWithGoogle()}>
      <span className="google-auth-mark" aria-hidden="true">G</span>
      {googlePending?"Redirection vers Google…":"Continuer avec Google"}
    </button>
    <div className="auth-divider"><span>ou avec ton e-mail</span></div>
    <form onSubmit={e=>void submit(e)} className="auth-form">
      <label>E-mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="toi@exemple.com"/></label>
      <label>Mot de passe<input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label>
      {error&&<div className="run-error" role="alert">{error}</div>}
      {notice&&<div className="success-strip">{notice}</div>}
      <button className="btn btn-primary" disabled={pending||googlePending||!authConfigured}>
        {pending?"Veuillez patienter...":mode==="login"?"Se connecter":"Créer mon compte"}<ArrowRight size={17}/>
      </button>
    </form>
    <div className="auth-switch">
      {mode==="login"?"Pas encore de compte ?":"Déjà un compte ?"}{" "}
      <button onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");setNotice("");}}>
        {mode==="login"?"S'inscrire":"Se connecter"}
      </button>
    </div>
    <p className="auth-disclaimer">Les rôles contributeur et relecteur restent réservés aux invitations.
      {" "}<Link href="/">Retour à l&apos;accueil</Link>
    </p>
  </div>;
}
