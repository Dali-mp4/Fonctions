"use client";
import { useTranslate, useLocale } from "@/components/language-provider";
import { useCallback, useEffect, useState } from "react";
import { ArchiveRestore, BookCheck, RefreshCw, ShieldAlert } from "lucide-react";
import { browserSupabase } from "@/lib/supabase-browser";
import { revisionWithImplementationSelect } from "@/lib/revision-select";
import { RevisionHistory } from "@/components/revision-history";
import type { Revision } from "@/components/studio-client";
export function PublicationManagement(){
  const t=useTranslate();
  const locale=useLocale();
  const [versions,setVersions]=useState<Revision[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState<string|null>(null);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const refresh=useCallback(async()=>{
    const sb=browserSupabase();if(!sb){setError(t("Supabase non configuré."));setLoading(false);return;}
    setLoading(true);
    const {data,error:e}=await sb.from("revisions").select(revisionWithImplementationSelect)
      .in("status",["published","archived"]).order("updated_at",{ascending:false}).limit(100);
    if(e)setError(e.message);else{setVersions((data??[]) as unknown as Revision[]);setError("");}
    setLoading(false);
  },[]);
  useEffect(()=>{void refresh();},[refresh]);
  async function action(r:Revision,kind:"withdraw"|"restore"){
    const question=kind==="withdraw"?"Retirer cette version de la publication, sans effacer son historique ?":
      "Restaurer cette ancienne version approuvée ? Elle remplacera l'actuelle pour cette méthode.";
    if(!window.confirm(question))return;
    const sb=browserSupabase();if(!sb)return;
    setError("");setNotice("");setBusy(r.id);
    const {error:e}=await sb.rpc(kind==="withdraw"?"withdraw_published_revision":"restore_published_revision",{p_revision:r.id});
    if(e)setError(e.message);else{
      setNotice(kind==="withdraw"?"Publication retirée et auditée.":"Version approuvée restaurée et auditée.");
      await refresh();
    }
    setBusy(null);
  }
  return <section className="workspace-section" aria-labelledby="publication-heading">
    <div className="studio-panel-head"><h2 id="publication-heading"><BookCheck size={21}/> {t("Publications · Propriétaire")}</h2>
      <button className="btn btn-muted" onClick={()=>void refresh()} disabled={loading||busy!==null}><RefreshCw size={15}/> {t("Actualiser")}</button>
    </div>
    <p className="studio-hint">{t("Les méthodes approuvées rejoignent immédiatement la bibliothèque. Retirer une publication la rend indisponible sans effacer son historique.")}</p>
    {error&&<p className="run-error" role="alert">{error}</p>}
    {notice&&<p className="success-strip" role="status">{notice}</p>}
    {loading?<p className="studio-hint">{t("Chargement…")}</p>:versions.length===0?
      <div className="studio-empty">{t("Aucune version publiée ou archivée.")}</div>:
      <div className="review-grid">{versions.map(r=><article className="review-card" key={r.id}>
        <span className="draft-meta">{r.implementations.topics.title} · {r.status==="published"?"Publié":"Archivé"}</span>
        <h3>{r.title}</h3><p>{r.explanation}</p>
        <small>Version {r.edit_seq} · {r.status==="published"?"Actuellement active en base":"Inactive"}</small>
        <RevisionHistory revisionId={r.id}/>
        <div className="publication-actions">{r.status==="published"?
          <button className="btn btn-muted" disabled={busy!==null} onClick={()=>void action(r,"withdraw")}>
            <ShieldAlert size={16}/> {t("Retirer de publication")}</button>:
          <button className="btn btn-muted" disabled={busy!==null} onClick={()=>void action(r,"restore")}>
            <ArchiveRestore size={16}/> {t("Restaurer cette version")}</button>}</div>
      </article>)}</div>}
  </section>;
}
