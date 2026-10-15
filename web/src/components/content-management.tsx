"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, PencilLine, RefreshCw, Save, Trash2 } from "lucide-react";
import { browserSupabase } from "@/lib/supabase-browser";

type Module = { id: string; slug: string; title: string; state: string };
type Implementation = { id: string; topic_id: string; method_type: "base" | "advanced"; published_revision_id: string | null };
type Version = { id: string; implementation_id: string; title: string; status: string; updated_at: string };

const originalSlugs = new Set(["pgcd","ppcm","verif","som-ch","tableau","matrice","enregistrement"]);

export function ContentManagement({ onDeleted, onRenamed }: { onDeleted: () => void; onRenamed: () => void }) {
  const [modules,setModules] = useState<Module[]>([]);
  const [implementations,setImplementations] = useState<Implementation[]>([]);
  const [versions,setVersions] = useState<Version[]>([]);
  const [selectedId,setSelectedId] = useState("");
  const [renameTitle,setRenameTitle] = useState("");
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");

  const refresh=useCallback(async()=>{
    const sb=browserSupabase();
    if(!sb){setError("Supabase non configuré.");setLoading(false);return;}
    setLoading(true);
    const [t,i,r] = await Promise.all([
      sb.from("topics").select("id,slug,title,state").order("title").limit(1000),
      sb.from("implementations").select("id,topic_id,method_type,published_revision_id").limit(1000),
      sb.from("revisions").select("id,implementation_id,title,status,updated_at")
        .order("updated_at",{ascending:false}).limit(2000),
    ]);
    if(t.error||i.error||r.error){
      setError(t.error?.message??i.error?.message??r.error?.message??"Chargement impossible.");
    }else{
      setModules(t.data as Module[]);
      setImplementations(i.data as Implementation[]);
      setVersions(r.data as Version[]);
      setError("");
    }
    setLoading(false);
  },[]);
  useEffect(()=>{void refresh();},[refresh]);

  const module = modules.find(t=>t.id===selectedId)??modules[0];
  // Reset unsaved changes when switching modules or when a fresh title is loaded.
  useEffect(()=>{setRenameTitle(module?.title??"");},[module?.id,module?.title]);
  const canRename = Boolean(module && !originalSlugs.has(module.slug));
  const trimmedRename = renameTitle.trim();
  const renameValid = trimmedRename.length>=3 && trimmedRename.length<=100 &&
    !/[\u0000-\u001f\u007f]/.test(trimmedRename);
  const renameChanged = Boolean(module && trimmedRename!==module.title);
  const related=implementations.filter(i=>i.topic_id===module?.id);
  const versionsByImplementation = useMemo(()=>{
    const m=new Map<string,Version[]>();
    for(const v of versions){const list=m.get(v.implementation_id)??[];list.push(v);m.set(v.implementation_id,list);}
    return m;
  },[versions]);

  async function renameModule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!module || !canRename || !renameValid || !renameChanged || busy) return;
    const sb=browserSupabase();
    if(!sb){setError("Supabase non configuré.");return;}
    setBusy(true);setError("");setNotice("");
    try {
      const {error:rpcError}=await sb.rpc("owner_rename_module",{
        p_topic:module.id,p_expected_title:module.title,p_new_title:trimmedRename,
      });
      if(rpcError)throw rpcError;
      setNotice("Nom du chapitre enregistré. Son adresse URL et ses implémentations sont conservées.");
      await refresh();
      onRenamed();
    }catch(err){
      setError(err instanceof Error?err.message:"Impossible de renommer le chapitre.");
    }finally{setBusy(false);}
  }

  async function remove(kind:"module"|"implementation",id:string,label:string,count:number){
    const subject=kind==="module"?"le module et toutes ses implémentations":"l'implémentation et toutes ses versions";
    const confirmed=window.prompt(
      `Suppression DÉFINITIVE de ${subject} : ${label}\n`+
      `Cela supprimera aussi les tests et l'historique des validations (${count} version(s) au minimum pour cette sélection).\n`+
      'Cette opération est irréversible. Saisis SUPPRIMER pour confirmer :'
    );
    if(confirmed!=="SUPPRIMER")return;
    const sb=browserSupabase();
    if(!sb){setError("Supabase non configuré.");return;}
    setBusy(true);setError("");setNotice("");
    try{
      const {error:e}=kind==="module"?
        await sb.rpc("owner_delete_module",{p_topic:id,p_confirmation:"SUPPRIMER"}):
        await sb.rpc("owner_delete_implementation",{p_implementation:id,p_confirmation:"SUPPRIMER"});
      if(e)throw e;
      if(kind==="module")setSelectedId("");
      setNotice(kind==="module"?"Module et implémentations définitivement supprimés.":"Implémentation et versions définitivement supprimées.");
      await refresh();
      onDeleted();
    }catch(e){
      setError(e instanceof Error?e.message:"La suppression a échoué.");
    }finally{setBusy(false);}
  }

  const moduleVersions=related.reduce((sum,i)=>sum+(versionsByImplementation.get(i.id)?.length??0),0);
  return <section className="workspace-section" aria-labelledby="content-delete-heading">
    <div className="studio-panel-head">
      <h2 id="content-delete-heading"><PencilLine size={20}/> Gestion des modules · Propriétaire</h2>
      <button className="btn btn-muted" disabled={loading||busy} onClick={()=>void refresh()}>
        <RefreshCw size={15}/> Actualiser
      </button>
    </div>
    <p className="studio-hint">Renomme les chapitres ajoutés dans la base, ou gère leur suppression et leurs implémentations. Les sept modules fondateurs ont des titres définis dans le code.</p>
    <p className="studio-hint"><AlertTriangle size={16}/> Supprimer est définitif : les versions, tests et décisions de relecture
      seront effacés, et les méthodes publiées disparaîtront de la bibliothèque.
      Seul un journal de suppression sans code est conservé.</p>
    {error&&<p className="run-error" role="alert">{error}</p>}
    {notice&&<p className="success-strip" role="status">{notice}</p>}
    {loading?<p className="studio-hint">Chargement des modules…</p>:!module?
      <p className="studio-hint">Aucun module en base.</p>:<>
      <label>Choisir le module
        <select value={module.id} disabled={busy} onChange={e=>setSelectedId(e.target.value)}>
          {modules.map(t=><option value={t.id} key={t.id}>{t.title} · {t.slug}</option>)}
        </select>
      </label>
      <div className="review-card">
        <span className="draft-meta">{module.state==="published"?"Module public":"Module en attente"} · {module.slug}</span>
        <h3>{module.title}</h3>
        <p>{related.length} implémentation(s) · {moduleVersions} version(s)</p>
        {canRename ? <form onSubmit={e=>void renameModule(e)} className="chapter-rename-form">
          <label htmlFor="chapter-new-name"><PencilLine size={14}/> Modifier le nom du chapitre
            <input id="chapter-new-name" type="text" maxLength={100} value={renameTitle}
              onChange={e=>setRenameTitle(e.target.value)} disabled={busy}
              aria-describedby="chapter-rename-hint"/>
          </label>
          <p id="chapter-rename-hint" className="studio-hint">
            Le nom affiché sera mis à jour. L'identifiant URL ({module.slug}), les contenus et le statut de publication ne changeront pas.
          </p>
          <button className="btn btn-primary" type="submit"
            disabled={busy||!renameValid||!renameChanged}>
            <Save size={15}/> {busy?"Enregistrement…":"Enregistrer le nom"}
          </button>
        </form> : null}
        {originalSlugs.has(module.slug)?<p className="studio-hint">
          Module d'origine protégé (défini dans le code). Ses implémentations ajoutées en base restent supprimables.
        </p>:<button type="button" className="btn btn-muted" disabled={busy}
          onClick={()=>void remove("module",module.id,module.title,moduleVersions)}>
          <Trash2 size={16}/> Supprimer définitivement ce module
        </button>}
      </div>
      <h3>Implémentations de ce module</h3>
      {related.length===0?<p className="studio-hint">Aucune implémentation en base pour ce module.</p>:
        <div className="review-grid">{related.map(i=>{
          const revs=versionsByImplementation.get(i.id)??[];
          const latest=revs[0];
          return <article className="review-card" key={i.id}>
            <span className="draft-meta">{i.method_type==="base"?"Base":"Advanced"} ·
              {i.published_revision_id?" Publiée":" Non publiée"}</span>
            <h3>{latest?.title??"Implémentation sans version"}</h3>
            <small>{revs.length} version(s) · {latest?.status??"Sans statut"}</small>
            <button type="button" className="btn btn-muted" disabled={busy}
              onClick={()=>void remove("implementation",i.id,latest?.title??i.id,revs.length)}>
              <Trash2 size={16}/> Supprimer définitivement l'implémentation
            </button>
          </article>;
        })}</div>}
    </>}
  </section>;
}
