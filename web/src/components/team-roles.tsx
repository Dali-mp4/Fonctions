"use client";

import { useState } from "react";
import { UserCog } from "lucide-react";
import { browserSupabase } from "@/lib/supabase-browser";

const uuidRe=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function TeamRoles(){
  const [id,setId]=useState("");
  const [role,setRole]=useState<"student"|"contributor"|"reviewer">("contributor");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [ok,setOk]=useState("");
  async function changeRole(){
    setError("");setOk("");
    if(!uuidRe.test(id.trim())){setError("Saisis un identifiant utilisateur (UUID) valide.");return;}
    const sb=browserSupabase();if(!sb)return;
    setBusy(true);
    const {error:e}=await sb.rpc("set_member_role",{p_user:id.trim(),p_role:role});
    if(e)setError(e.message);else{setOk("Rôle modifié et enregistré dans l'historique d'audit.");setId("");}
    setBusy(false);
  }
  return <section className="workspace-section" aria-labelledby="team-heading">
    <div className="studio-panel-head"><h2 id="team-heading"><UserCog size={21}/> Gérer les contributeurs</h2></div>
    <p className="studio-hint">Le compte de ton ami doit déjà exister. Retrouve son User UID dans Supabase → Authentication → Users. Seul le propriétaire peut accorder ou retirer ces rôles.</p>
    <div className="team-role-form">
      <label>User UID<input aria-label="User UID" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={id} onChange={e=>setId(e.target.value)}/></label>
      <label>Rôle<select value={role} onChange={e=>setRole(e.target.value as typeof role)}>
        <option value="contributor">Contributeur — crée des brouillons</option>
        <option value="reviewer">Relecteur — vérifie les soumissions</option>
        <option value="student">Étudiant — retire les droits élevés</option>
      </select></label>
      <button className="btn btn-primary" disabled={busy} onClick={()=>void changeRole()}>{busy?"Modification…":"Attribuer le rôle"}</button>
    </div>
    {error&&<p className="run-error" role="alert">{error}</p>}
    {ok&&<p className="success-strip" role="status">{ok}</p>}
    <p className="studio-hint">Le rôle propriétaire n&apos;est jamais attribuable depuis cette interface.</p>
  </section>;
}
