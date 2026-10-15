"use client";
import { TransientAlert } from "@/components/transient-alert";
import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { browserSupabase } from "@/lib/supabase-browser";
import { revisionWithImplementationSelect } from "@/lib/revision-select";
import { RevisionHistory } from "@/components/revision-history";
import type { Revision } from "@/components/studio-client";
import type { ExecutedCase } from "@/lib/draft-runner";

type TestEvidence = {run_id?:string;results?:ExecutedCase[];code_sha256?:string;edit_seq?:number};
export function ReviewerWorkspace({userId}:{userId:string}) {
  const [queue,setQueue]=useState<Revision[]>([]);
  const [loading,setLoading]=useState(true);
  const [noteById,setNoteById]=useState<Record<string,string>>({});
  const [checkedById,setCheckedById]=useState<Record<string,boolean>>({});
  const [busy,setBusy]=useState<string|null>(null);
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");
  const refresh=useCallback(async()=>{
    const sb=browserSupabase();if(!sb){setError("Supabase non configuré.");setLoading(false);return;}
    setLoading(true);
    const {data,error:e}=await sb.from("revisions").select(revisionWithImplementationSelect)
      .eq("status","submitted").order("submitted_at",{ascending:true}).limit(100);
    if(e)setError(e.message);else{setQueue((data??[]) as unknown as Revision[]);setError("");}
    setLoading(false);
  },[]);
  useEffect(()=>{void refresh();},[refresh]);
  async function requestChanges(id:string){
    setNotice("");setError("");const note=(noteById[id]??"").trim();
    if(note.length<10||note.length>2000){setError("Ton commentaire doit contenir entre 10 et 2 000 caractères.");return;}
    const sb=browserSupabase();if(!sb)return;
    setBusy(id);
    const {error:e}=await sb.rpc("request_revision_changes",{p_revision:id,p_note:note});
    if(e)setError(e.message);else{setNotice("Retour envoyé. L'auteur doit refaire ses tests.");setNoteById(p=>({...p,[id]:""}));await refresh();}
    setBusy(null);
  }
  async function approve(r:Revision){
    setNotice("");setError("");
    if(r.created_by===userId||!checkedById[r.id]||r.test_status!=="passed"){
      setError("Vérifie le code et les tests d'un autre auteur avant d'approuver.");return;
    }
    if(!window.confirm("Approuver et publier cette méthode dans El biblioteque. ?"))return;
    const sb=browserSupabase();if(!sb)return;
    setBusy(r.id);
    const {error:e}=await sb.rpc("approve_revision",{p_revision:r.id,p_expected_edit_seq:r.edit_seq});
    if(e)setError(e.message);else{
      setNotice("Méthode approuvée et publiée dans El biblioteque.");
      setCheckedById(p=>({...p,[r.id]:false}));await refresh();
    }
    setBusy(null);
  }
  return <section className="workspace-section" aria-labelledby="review-heading">
    <div className="studio-panel-head"><h2 id="review-heading"><ClipboardCheck size={21}/> File de relecture</h2>
      <button className="btn btn-muted" disabled={loading||busy!==null} onClick={()=>void refresh()}><RefreshCw size={15}/> Actualiser</button></div>
    <p className="studio-hint">Inspecte le code Python, le pseudo-code, les cas de test et les résultats avant d'approuver. Un test réussi n'est pas une preuve de correction complète. Tu ne peux pas relire ton propre travail.</p>
    <TransientAlert message={error} tone="error"/>
    <TransientAlert message={notice} tone="success"/>
    {loading?<p className="studio-hint">Chargement…</p>:queue.length===0?
      <div className="studio-empty">Aucune soumission en attente. Les brouillons privés ne figurent pas ici.</div>:
      <div className="review-grid">{queue.map(r=>{
        const evidence=r.test_evidence as TestEvidence|null;
        const results=Array.isArray(evidence?.results)?evidence.results:[];
        const own=r.created_by===userId;
        const verified=!own&&r.test_status==="passed"&&Boolean(evidence?.run_id)&&results.length>0&&results.every(x=>x.passed);
        return <article className="review-card" key={r.id}>
          <span className="draft-meta">{r.implementations?.topics?.title} · {r.implementations?.method_type}</span>
          <h3>{r.title}</h3><p>{r.explanation}</p>
          <small>Version {r.edit_seq} · Soumise {r.submitted_at?new Date(r.submitted_at).toLocaleString("fr-FR"):"récemment"} · {r.test_status==="passed"?"Tests réussis":"Non vérifiée"}</small>
          <details><summary>Code Python et pseudo-code soumis</summary>
            <h4>Pseudo-code</h4><pre>{r.pseudocode||"Non renseigné"}</pre>
            <h4>Python</h4><pre>{r.python_code}</pre>
          </details>
          <details><summary>Contrat, tests et résultats d'exécution</summary>
            <h4>Fonction : {r.entry_function??"Non déclarée"}</h4><pre>{JSON.stringify(r.input_schema,null,2)}</pre>
            <h4>Cas de test ({Array.isArray(r.test_cases)?r.test_cases.length:0})</h4>
            <pre>{JSON.stringify(r.test_cases,null,2)}</pre>
            <h4>Résultats réels</h4><div className="review-run-evidence">
              {results.length===0?<p>Aucune preuve enregistrée.</p>:results.map((item,i)=><p key={i}>
                {item.passed?"✓":"✗"} <strong>{item.label}</strong> — {item.error??`attendu ${JSON.stringify(item.expected)}, obtenu ${JSON.stringify(item.actual)}`}
              </p>)}
            </div>
            <small>Version testée : {evidence?.edit_seq??"?"} · SHA-256 : {evidence?.code_sha256??"indisponible"}</small>
          </details>
          <section className="review-lesson-preview">
            <h4>Fiche pédagogique présentée aux élèves</h4>
            <strong>Le principe</strong><p>{r.lesson_content?.principle || r.explanation}</p>
            <strong>Exemple</strong><p>{r.lesson_content?.example || "Non renseigné"}</p>
            <strong>Limites</strong><p>{r.lesson_content?.limits || "Non précisées"}</p>
            <strong>Sections d&apos;apprentissage</strong>
            {(r.lesson_content?.sections || []).map((sec,i)=><details key={i}><summary>{i+1}. {sec.title}</summary>
              <h4>Pseudo-code</h4><pre>{sec.pseudocode || "Non fourni"}</pre>
              <h4>Python</h4><pre>{sec.python || "Non fourni"}</pre>
              {sec.note && <p>{sec.note}</p>}
            </details>)}
          </section>
          <RevisionHistory revisionId={r.id}/>
          {own?<p className="studio-hint">Cette soumission t'appartient. Demande à un autre relecteur de la valider.</p>:<>
            <label>Demander des modifications<textarea maxLength={2000} rows={3}
              value={noteById[r.id]??""} onChange={e=>setNoteById(p=>({...p,[r.id]:e.target.value}))}
              placeholder="Explique précisément les changements à effectuer."/></label>
            <button className="btn btn-muted" disabled={busy!==null} onClick={()=>void requestChanges(r.id)}><Send size={14}/> Envoyer le retour</button>
            <label className="review-approval-check"><input type="checkbox" checked={Boolean(checkedById[r.id])}
              onChange={e=>setCheckedById(p=>({...p,[r.id]:e.target.checked}))}/>
              J'ai vérifié la méthode, le code, les tests et ses limites.
            </label>
            <button className="btn btn-primary" disabled={busy!==null||!verified||!checkedById[r.id]}
              onClick={()=>void approve(r)}><ShieldCheck size={16}/>{busy===r.id?"Approbation…":"Approuver et publier"}</button>
          </>}
        </article>;
      })}</div>}
  </section>;
}
