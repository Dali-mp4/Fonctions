"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, RefreshCw, Send } from "lucide-react";
import { browserSupabase } from "@/lib/supabase-browser";
import type { Revision } from "@/components/studio-client";

export function ReviewerWorkspace({userId}: {userId:string}) {
  const [queue, setQueue] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteById, setNoteById] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const sb = browserSupabase();
    if (!sb) return;
    setLoading(true);
    const {data, error: e} = await sb.from("revisions")
      .select("id,title,explanation,pseudocode,python_code,status,test_status,review_note,edit_seq,updated_at,created_by,implementations(method_type,topics(slug,title))")
      .eq("status", "submitted").order("updated_at", {ascending:true}).limit(100);
    if (e) setError(e.message); else {setQueue((data ?? []) as unknown as Revision[]);setError("");}
    setLoading(false);
  }, []);
  useEffect(() => {void refresh();}, [refresh]);

  async function requestChanges(id:string) {
    setNotice("");setError("");
    const note = (noteById[id] ?? "").trim();
    if (note.length < 10 || note.length > 2000) {
      setError("Ton commentaire doit contenir entre 10 et 2 000 caractères.");return;
    }
    const sb=browserSupabase(); if(!sb)return;
    setBusy(id);
    const {error:e}=await sb.rpc("request_revision_changes", {p_revision:id,p_note:note});
    if(e)setError(e.message);
    else {setNotice("Retour envoyé au contributeur.");setNoteById(p=>({...p,[id]:""}));await refresh();}
    setBusy(null);
  }

  return <section className="workspace-section" aria-labelledby="review-heading">
    <div className="studio-panel-head"><h2 id="review-heading"><ClipboardCheck size={21}/> Espace relecture</h2>
      <button className="btn btn-muted" onClick={()=>void refresh()} disabled={loading}><RefreshCw size={15}/> Actualiser</button></div>
    <p className="studio-hint">Les soumissions arrivent ici après des tests vérifiés par le futur sandbox. Pour l&apos;instant, la publication et l&apos;approbation restent fermées.</p>
    {error&&<p className="run-error" role="alert">{error}</p>}
    {notice&&<p className="success-strip" role="status">{notice}</p>}
    {loading?<p className="studio-hint">Chargement de la file…</p>:queue.length===0?
      <div className="studio-empty">Aucune soumission en attente. Les brouillons privés ne figurent pas dans cette liste.</div>
      :<div className="review-grid">{queue.map(r=><article className="review-card" key={r.id}>
        <span className="draft-meta">{r.implementations?.topics?.title} · {r.implementations?.method_type}</span>
        <h3>{r.title}</h3><p>{r.explanation}</p>
        <details><summary>Afficher le pseudo-code et le Python soumis</summary>
          <h4>Pseudo-code</h4><pre>{r.pseudocode || "Non renseigné"}</pre>
          <h4>Python</h4><pre>{r.python_code}</pre>
        </details>
        {r.created_by === userId ? <p className="studio-hint">Tu ne peux pas relire ta propre contribution.</p>:
          <label>Demander des modifications<textarea maxLength={2000} rows={3} value={noteById[r.id]??""}
            onChange={e=>setNoteById(p=>({...p,[r.id]:e.target.value}))}
            placeholder="Indique précisément ce que l'auteur doit améliorer."/>
            <button className="btn btn-muted" disabled={busy===r.id} onClick={()=>void requestChanges(r.id)}><Send size={14}/> Envoyer le retour</button>
          </label>}
        <small>Approbation désactivée jusqu&apos;à la vérification des tests.</small>
      </article>)}</div>}
  </section>;
}
