"use client";
import { useTranslate, useLocale } from "@/components/language-provider";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, KeyRound, Laptop, LogOut, Mail, ShieldCheck, UserRound, Users } from "lucide-react";
import { browserSupabase } from "@/lib/supabase-browser";

type AccountProps = {
  email: string;
  displayName: string;
  role: string;
  joined: string;
  lastLogin: string | null;
  confirmed: boolean;
  providers: string[];
  deletionStatus: string | null;
};
type PendingRequest = { user_id: string; requested_at: string; status: string };
const roleLabels: Record<string,string> = {
  student: "Étudiant", contributor: "Contributeur", reviewer: "Relecteur", owner: "Propriétaire",
};
const formatDate = (s: string | null,locale:string) => s ? new Date(s).toLocaleString(locale==="ar"?"ar-TN":locale==="en"?"en-GB":"fr-FR") : "—";

export function AccountClient(props: AccountProps) {
  const t=useTranslate();
  const locale=useLocale();
  const router = useRouter();
  const [name,setName] = useState(props.displayName);
  const [email,setEmail] = useState(props.email);
  const [password,setPassword] = useState("");
  const [confirmPassword,setConfirmPassword] = useState("");
  const [busy,setBusy] = useState("");
  const [notice,setNotice] = useState("");
  const [error,setError] = useState("");
  const [deletionConfirmed,setDeletionConfirmed] = useState(false);
  const [deletionEmail,setDeletionEmail] = useState("");
  const [pendingRequests,setPendingRequests] = useState<PendingRequest[]>([]);
  const [queueError,setQueueError] = useState("");
  const [queueLoading,setQueueLoading] = useState(props.role === "owner");

  function resetMessages() { setError(""); setNotice(""); }
  async function saveName() {
    resetMessages();
    const trimmed=name.trim();
    if(trimmed.length<2 || trimmed.length>80) { setError(t("Choisis un nom de 2 à 80 caractères."));return; }
    const sb=browserSupabase();if(!sb){setError(t("Supabase non configuré."));return;}
    setBusy("name");
    const {error:e}=await sb.rpc("set_my_display_name",{p_name:trimmed});
    if(e)setError(e.message);
    else {setName(trimmed);setNotice(t("Ton nom d'affichage a été mis à jour."));router.refresh();}
    setBusy("");
  }
  async function saveEmail() {
    resetMessages();
    const value=email.trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {setError(t("Adresse e-mail invalide."));return;}
    if(value===props.email){setNotice(t("Cette adresse est déjà associée au compte."));return;}
    const sb=browserSupabase();if(!sb){setError(t("Supabase non configuré."));return;}
    setBusy("email");
    const {error:e}=await sb.auth.updateUser({email:value});
    if(e)setError(e.message);else setNotice(t("Demande envoyée. Confirme le changement depuis les e-mails de validation avant qu'il prenne effet."));
    setBusy("");
  }
  async function changePassword() {
    resetMessages();
    if(password.length<12 || password.length>72) {setError(t("Utilise un mot de passe de 12 à 72 caractères."));return;}
    if(password!==confirmPassword){setError(t("Les deux mots de passe ne correspondent pas."));return;}
    const sb=browserSupabase();if(!sb){setError(t("Supabase non configuré."));return;}
    setBusy("password");
    const {error:e}=await sb.auth.updateUser({password});
    setPassword("");setConfirmPassword("");
    if(e)setError(e.message);
    else setNotice(t("Mot de passe mis à jour. Supabase peut demander une reconnexion selon les paramètres de sécurité."));
    setBusy("");
  }
  async function signOut(scope:"local"|"global"|"others") {
    resetMessages();const sb=browserSupabase();if(!sb)return;
    if(scope==="global" && !window.confirm("Fermer toutes les sessions de ce compte ?"))return;
    setBusy(scope);
    const {error:e}=await sb.auth.signOut({scope});
    if(e){setError(e.message);setBusy("");return;}
    if(scope==="others"){setNotice(t("Les autres sessions ont été révoquées. Les jetons déjà émis peuvent rester valides jusqu'à expiration."));setBusy("");return;}
    router.replace("/connexion");router.refresh();
  }
  async function deleteMyAccount() {
    resetMessages();
    if (!deletionConfirmed || deletionEmail.trim() !== props.email) {
      setError(t("Confirme les conséquences et recopie ton adresse e-mail exacte."));
      return;
    }
    if (!window.confirm("Supprimer définitivement ton compte ? Les méthodes approuvées et les décisions de relecture restent conservées avec un auteur pseudonyme. Cette action est irréversible.")) return;
    const sb = browserSupabase();
    if (!sb) {setError(t("Supabase non configuré."));return;}
    setBusy("delete");
    const {error:e} = await sb.rpc("delete_my_account",{p_confirm_email:props.email});
    if (e) {setError(e.message);setBusy("");return;}
    // Authentication record is deleted. Best effort local session cleanup.
    await sb.auth.signOut({scope:"local"});
    router.replace("/connexion?deleted=1");
    router.refresh();
  }

  useEffect(()=>{
    if(props.role!=="owner")return;
    let active=true;
    const load=async()=>{
      const sb=browserSupabase();if(!sb){if(active){setQueueLoading(false);setQueueError("Supabase non configuré.");}return;}
      const {data,error:e}=await sb.from("account_deletion_requests")
        .select("user_id,requested_at,status").eq("status","pending")
        .order("requested_at",{ascending:true}).limit(100);
      if(!active)return;
      if(e)setQueueError(e.message);else setPendingRequests((data??[]) as PendingRequest[]);
      setQueueLoading(false);
    };
    void load();
    return()=>{active=false;};
  },[props.role]);

  return <div className="account-layout">
    <div className="account-overview">
      <div className="account-avatar"><UserRound size={30}/></div>
      <div><strong>{props.displayName || "Membre Algo Fi Jib"}</strong>
        <span>{props.email || "Adresse non renseignée"}</span></div>
      <div className="account-role"><ShieldCheck size={15}/>{t(roleLabels[props.role] ?? props.role)}</div>
      <div className="account-facts">
        <div><span>{t("Inscription")}</span><strong>{formatDate(props.joined,locale)}</strong></div>
        <div><span>{t("Dernière connexion")}</span><strong>{formatDate(props.lastLogin,locale)}</strong></div>
        <div><span>{t("Adresse vérifiée")}</span><strong>{t(props.confirmed ? "Oui" : "En attente")}</strong></div>
      </div>
      {["contributor","reviewer","owner"].includes(props.role) &&
        <Link className="btn btn-muted account-studio-link" href="/studio">{t("Ouvrir El studio. →")}</Link>}
    </div>
    <div className="account-main">
      {error && <div className="run-error" role="alert">{error}</div>}
      {notice && <div className="success-strip" role="status"><CheckCircle2 size={16}/>{notice}</div>}

      <section className="account-panel" aria-labelledby="account-profile">
        <h2 id="account-profile"><UserRound size={21}/> {t("Profil")}</h2>
        <p>{t("Ton nom d'affichage est indépendant de ton rôle et de tes contributions.")}</p>
        <form className="account-form" onSubmit={e=>{e.preventDefault();void saveName();}}>
          <label>{t("Nom d'affichage")}<input maxLength={80} minLength={2} required autoComplete="nickname"
            value={name} onChange={e=>setName(e.target.value)} placeholder={t("Ton nom public")}/></label>
          <button className="btn btn-primary" type="submit" disabled={Boolean(busy)}>
            {t(busy==="name"?"Enregistrement…":"Enregistrer le nom")}</button>
        </form>
      </section>

      <section className="account-panel" aria-labelledby="account-identity">
        <h2 id="account-identity"><Mail size={21}/> {t("E-mail et connexion")}</h2>
        <p>{t("Méthodes liées à ce compte :")} <strong>{props.providers.length?props.providers.map(p=>p==="email"?"E-mail":p==="google"?"Google":p).join(" · "):"E-mail"}</strong>.</p>
        <p className="account-hint">{t(props.providers.includes("google") ?
          "Ton identité Google est associée à ce compte. Les paramètres de Google se gèrent également chez Google." :
          "Tu peux choisir Continuer avec Google depuis la page de connexion après avoir activé ce fournisseur dans Supabase Auth.")}</p>
        <form className="account-form" onSubmit={e=>{e.preventDefault();void saveEmail();}}>
          <label>{t("Nouvelle adresse e-mail")}<input type="email" required maxLength={320} autoComplete="email"
            value={email} onChange={e=>setEmail(e.target.value)}/></label>
          <button className="btn btn-muted" type="submit" disabled={Boolean(busy)}>
            {t(busy==="email"?"Envoi…":"Demander le changement d'e-mail")}</button>
        </form>
      </section>

      <section className="account-panel" aria-labelledby="account-password">
        <h2 id="account-password"><KeyRound size={21}/> {t("Mot de passe")}</h2>
        <p>{t("Choisis au moins 12 caractères. Une reconnexion ou une vérification supplémentaire peut être demandée.")}</p>
        <form className="account-form" onSubmit={e=>{e.preventDefault();void changePassword();}}>
          <label>{t("Nouveau mot de passe")}<input type="password" autoComplete="new-password" minLength={12}
            maxLength={72} required value={password} onChange={e=>setPassword(e.target.value)}/></label>
          <label>{t("Confirmer le mot de passe")}<input type="password" autoComplete="new-password" minLength={12}
            maxLength={72} required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}/></label>
          <button className="btn btn-muted" disabled={Boolean(busy)} type="submit">
            {t(busy==="password"?"Mise à jour…":"Changer mon mot de passe")}</button>
        </form>
      </section>

      <section className="account-panel" aria-labelledby="account-sessions">
        <h2 id="account-sessions"><Laptop size={21}/> {t("Sessions et appareils")}</h2>
        <p>{t("Gère la session de ce navigateur ou révoque les sessions des autres appareils.")}</p>
        <div className="account-buttons">
          <button className="btn btn-muted" disabled={Boolean(busy)} onClick={()=>void signOut("others")}>{t("Déconnecter les autres appareils")}</button>
          <button className="btn btn-muted" disabled={Boolean(busy)} onClick={()=>void signOut("local")}><LogOut size={16}/> {t("Se déconnecter ici")}</button>
          <button className="btn btn-muted" disabled={Boolean(busy)} onClick={()=>void signOut("global")}><LogOut size={16}/> {t("Se déconnecter partout")}</button>
        </div>
        <p className="account-hint">{t("La révocation des sessions n'invalide pas instantanément les jetons d'accès déjà émis ; ils expirent naturellement.")}</p>
      </section>

      <section className="account-panel account-danger" aria-labelledby="account-deletion">
        <h2 id="account-deletion"><AlertTriangle size={21}/> {t("Suppression définitive")}</h2>
        {props.role==="owner" ?
          <p>{t("Le compte propriétaire ne peut pas être supprimé depuis cette page. Un transfert de propriété est nécessaire.")}</p> :
          <>
            <p>{t("Supprime ton compte sans validation administrative. Ton accès, ton e-mail et ton nom d'affichage seront effacés. Les cours, les méthodes et les décisions de relecture restent conservés sans identité personnelle liée.")}</p>
            <p className="account-hint">{t("Par sécurité, reconnecte-toi dans les 15 minutes précédant cette opération. La suppression est irréversible. Les contenus que tu as créés restent visibles s'ils ont été approuvés.")}</p>
            {props.deletionStatus==="pending" && <p className="account-hint">
              {t("Tu avais une demande en attente. Tu peux maintenant supprimer directement ton compte.")}
            </p>}
            <label className="review-approval-check">
              <input type="checkbox" checked={deletionConfirmed}
                onChange={e=>setDeletionConfirmed(e.target.checked)}/>
              {t("Je comprends que mon compte sera supprimé et que mes contributions pédagogiques et leurs validations resteront conservées sous un auteur pseudonyme.")}
            </label>
            <label>{t("Recopie ton e-mail pour confirmer")}
              <input type="email" value={deletionEmail}
                onChange={e=>setDeletionEmail(e.target.value)} placeholder={props.email}/>
            </label>
            <button className="btn btn-muted account-request-delete"
              disabled={Boolean(busy)||!deletionConfirmed||deletionEmail.trim()!==props.email}
              onClick={()=>void deleteMyAccount()}>
              {t(busy==="delete"?"Suppression…":"Supprimer définitivement mon compte")}
            </button>
          </>
        }
      </section>

      {props.role==="owner" && <section className="account-panel" aria-labelledby="account-owner-requests">
        <h2 id="account-owner-requests"><Users size={21}/> {t("Demandes antérieures")}</h2>
        <p>{t("Ces demandes datent de l'ancien système. Les membres peuvent désormais supprimer directement leur compte après confirmation et reconnexion récente.")}</p>
        {queueError && <p className="run-error" role="alert">{queueError}</p>}
        {queueLoading ? <p>{t("Chargement…")}</p> :
          pendingRequests.length ? <div className="account-requests">{pendingRequests.map(request=>
            <div key={request.user_id}><code>{request.user_id}</code><span>{formatDate(request.requested_at,locale)}</span></div>)}</div> :
          <p className="account-hint">{t("Aucune demande en attente.")}</p>}
        <p className="account-hint">{t("Retrouve l'identifiant dans Supabase → Authentication → Users. Les contenus pédagogiques et l'historique sont conservés de manière pseudonyme.")}</p>
      </section>}
    </div>
  </div>;
}
