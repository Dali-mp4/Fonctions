"use client";
import { useState } from "react";
import { Clock3, History } from "lucide-react";
import { browserSupabase } from "@/lib/supabase-browser";

type RevisionEvent = {action:string;created_at:string;actor_id:string;details:Record<string,unknown>|null};
const labels:Record<string,string> = {
  draft_created:"Brouillon créé", draft_updated:"Brouillon modifié",
  draft_test_passed:"Tests Python réussis",draft_test_failed:"Tests Python échoués",
  draft_test_error:"Erreur des tests", submitted:"Soumission envoyée",
  changes_requested:"Modifications demandées",published:"Approuvé et publié",
  publication_withdrawn:"Publication retirée",publication_restored:"Version restaurée",
};
export function RevisionHistory({revisionId}:{revisionId:string}) {
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const [events,setEvents]=useState<RevisionEvent[]>([]);
  const [error,setError]=useState("");
  async function toggle() {
    if(open){setOpen(false);return;}
    setOpen(true);setLoading(true);setError("");
    const sb=browserSupabase();
    if(!sb){setError("Supabase non configuré.");setLoading(false);return;}
    const {data,error:e}=await sb.rpc("get_revision_history",{p_revision:revisionId});
    if(e)setError(e.message);else setEvents((data??[]) as RevisionEvent[]);
    setLoading(false);
  }
  return <div className="review-history">
    <button type="button" className="review-history-toggle" onClick={()=>void toggle()} aria-expanded={open}>
      <History size={14}/>{open?"Masquer l'historique":"Historique des décisions"}
    </button>
    {open&&<div className="review-history-panel">
      {loading&&<p className="studio-hint">Chargement…</p>}
      {error&&<p className="run-error" role="alert">{error}</p>}
      {!loading&&!error&&events.length===0&&<p className="studio-hint">Aucun événement enregistré.</p>}
      {!loading&&!error&&events.map((evt,i)=><div className="review-history-event" key={`${evt.created_at}-${i}`}>
        <Clock3 size={14}/><div><strong>{labels[evt.action]??evt.action}</strong>
          <small>{new Date(evt.created_at).toLocaleString("fr-FR")}</small>
          {typeof evt.details?.note==="string"&&<p>{evt.details.note}</p>}
        </div>
      </div>)}
    </div>}
  </div>;
}
