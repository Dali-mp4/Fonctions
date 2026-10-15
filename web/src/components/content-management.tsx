"use client";
import { useCallback, useEffect, useState } from "react";
import { PencilLine, RefreshCw, Save } from "lucide-react";
import { browserSupabase } from "@/lib/supabase-browser";

type Module = { id: string; slug: string; title: string; state: string };
const originalSlugs = new Set(["pgcd","ppcm","verif","som-ch","tableau","matrice","enregistrement"]);

export function ContentManagement({ onRenamed }: { onRenamed: () => void }) {
  const [modules,setModules] = useState<Module[]>([]);
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
    const {data,error:e}=await sb.from("topics").select("id,slug,title,state").order("title").limit(1000);
    if(e)setError(e.message);
    else {setModules((data??[]) as Module[]);setError("");}
    setLoading(false);
  },[]);
  useEffect(()=>{void refresh();},[refresh]);

  const module = modules.find(t=>t.id===selectedId)??modules[0];
  useEffect(()=>{setRenameTitle(module?.title??"");},[module?.id,module?.title]);
  const canRename = Boolean(module && !originalSlugs.has(module.slug));
  const trimmedRename = renameTitle.trim();
  const renameValid = trimmedRename.length>=3 && trimmedRename.length<=100 &&
    !/[\u0000-\u001f\u007f]/.test(trimmedRename);
  const renameChanged = Boolean(module && trimmedRename!==module.title);

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

  return <section className="workspace-section" aria-labelledby="content-rename-heading">
    <div className="studio-panel-head">
      <h2 id="content-rename-heading"><PencilLine size={20}/> Renommer un chapitre · Propriétaire</h2>
      <button type="button" className="btn btn-muted" disabled={loading||busy} onClick={()=>void refresh()}>
        <RefreshCw size={15}/> Actualiser
      </button>
    </div>
    <p className="studio-hint">La suppression se fait maintenant depuis l'icône corbeille en haut à droite de chaque
      implémentation dans « Mes implémentations ». Si une implémentation était la dernière d'un chapitre ajouté, le chapitre disparaît aussi.
      Ici tu peux toujours modifier les noms des chapitres ajoutés.</p>
    {error&&<p className="run-error" role="alert">{error}</p>}
    {notice&&<p className="success-strip" role="status">{notice}</p>}
    {loading?<p className="studio-hint">Chargement des chapitres…</p>:!module?
      <p className="studio-hint">Aucun chapitre en base.</p>:<>
      <label>Choisir le chapitre à renommer
        <select value={module.id} disabled={busy} onChange={e=>setSelectedId(e.target.value)}>
          {modules.map(t=><option value={t.id} key={t.id}>{t.title} · {t.slug}</option>)}
        </select>
      </label>
      <div className="review-card">
        <span className="draft-meta">{module.state==="published"?"Chapitre public":"Chapitre en attente"} · {module.slug}</span>
        <h3>{module.title}</h3>
        {canRename ? <form onSubmit={e=>void renameModule(e)} className="chapter-rename-form">
          <label htmlFor="chapter-new-name"><PencilLine size={14}/> Modifier le nom du chapitre
            <input id="chapter-new-name" type="text" maxLength={100} value={renameTitle}
              onChange={e=>setRenameTitle(e.target.value)} disabled={busy}
              aria-describedby="chapter-rename-hint"/>
          </label>
          <p id="chapter-rename-hint" className="studio-hint">
            L'identifiant URL ({module.slug}), les contenus et le statut de publication ne changeront pas.
          </p>
          <button className="btn btn-primary" type="submit" disabled={busy||!renameValid||!renameChanged}>
            <Save size={15}/> {busy?"Enregistrement…":"Enregistrer le nom"}
          </button>
        </form> : <p className="studio-hint">
          Le nom de ce chapitre fondateur est défini dans le code de la plateforme.
        </p>}
      </div>
    </>}
  </section>;
}
