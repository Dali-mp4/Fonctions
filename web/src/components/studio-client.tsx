"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  CheckCircle2, FileCode2, FolderOpen, LockKeyhole, Plus, RefreshCw,
  Save, ShieldCheck, TerminalSquare,
} from "lucide-react";
import { algorithms } from "@/lib/catalog";
import { browserSupabase } from "@/lib/supabase-browser";
import { revisionWithImplementationSelect } from "@/lib/revision-select";
import { ReviewerWorkspace } from "@/components/reviewer-workspace";
import { TeamRoles } from "@/components/team-roles";

const Monaco = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="editor-loading">Chargement de l&apos;éditeur...</div>,
});

const sample = `from random import randint\nfrom numpy import array\n\ndef remplir_aleatoire(n):\n    T = array([int()] * n)\n    for i in range(n):\n        T[i] = randint(1, 100)\n    return T`;

type Topic = { slug: string; title: string };
type Implementation = { method_type: "base" | "advanced"; topics: Topic };
export type Revision = {
  id: string;
  title: string;
  explanation: string;
  pseudocode: string;
  python_code: string;
  status: "draft" | "changes_requested" | "submitted" | "published" | "archived";
  test_status: "not_run" | "passed" | "failed";
  review_note: string | null;
  edit_seq: number;
  updated_at: string;
  created_by: string;
  implementations: Implementation;
};

const editable = (r: Revision) => r.status === "draft" || r.status === "changes_requested";
const statusName: Record<Revision["status"], string> = {
  draft: "Brouillon", changes_requested: "Modifications demandées",
  submitted: "En attente de relecture", published: "Publié", archived: "Archivé",
};

export function StudioClient({ user, userId, role }: { user: string; userId: string; role: string }) {
  const [drafts, setDrafts] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editSeq, setEditSeq] = useState(1);
  const [topic, setTopic] = useState("pgcd");
  const [method, setMethod] = useState<"base" | "advanced">("advanced");
  const [title, setTitle] = useState("");
  const [explanation, setExplanation] = useState("");
  const [pseudocode, setPseudocode] = useState("");
  const [code, setCode] = useState(sample);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const refresh = useCallback(async () => {
    const sb = browserSupabase();
    if (!sb) { setListError("Supabase n'est pas configuré."); setLoading(false); return; }
    setLoading(true);
    const { data, error: queryError } = await sb.from("revisions")
      .select(revisionWithImplementationSelect)
      .eq("created_by", userId).order("updated_at", { ascending: false }).limit(100);
    if (queryError) setListError(queryError.message);
    else { setDrafts((data ?? []) as unknown as Revision[]); setListError(""); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  function newDraft() {
    setEditing(null); setEditSeq(1); setTopic("pgcd"); setMethod("advanced");
    setTitle(""); setExplanation(""); setPseudocode(""); setCode(sample);
    setError(""); setOk("");
  }

  function openDraft(draft: Revision) {
    if (!editable(draft)) return;
    setEditing(draft.id); setEditSeq(draft.edit_seq);
    setTopic(draft.implementations.topics.slug);
    setMethod(draft.implementations.method_type);
    setTitle(draft.title); setExplanation(draft.explanation);
    setPseudocode(draft.pseudocode); setCode(draft.python_code);
    setError(""); setOk("");
  }

  async function save() {
    setError(""); setOk("");
    if (title.trim().length < 5 || code.length < 10 || explanation.trim().length < 15 ||
      title.trim().length > 160 || explanation.length > 20000 ||
      code.length > 30000 || pseudocode.length > 30000) {
      setError("Titre (5–160), explication (15–20 000) et code Python (10–30 000 caractères) requis.");
      return;
    }
    const sb = browserSupabase();
    if (!sb) { setError("Supabase n'est pas configuré."); return; }
    setBusy(true);
    try {
      if (editing) {
        const { data, error: saveError } = await sb.rpc("update_draft", {
          p_revision: editing, p_expected_edit_seq: editSeq,
          p_title: title.trim(), p_explanation: explanation.trim(),
          p_pseudocode: pseudocode, p_python_code: code,
        });
        if (saveError) throw saveError;
        setEditSeq(Number(data));
        setOk("Brouillon mis à jour. Les éventuels anciens tests ont été annulés.");
      } else {
        const { data, error: saveError } = await sb.rpc("create_draft", {
          p_topic_slug: topic, p_method_type: method,
          p_title: title.trim(), p_explanation: explanation.trim(),
          p_pseudocode: pseudocode, p_python_code: code,
        });
        if (saveError) throw saveError;
        setEditing(String(data)); setEditSeq(1);
        setOk("Brouillon privé créé. Aucun code n'a été exécuté ni publié.");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer le brouillon.");
    } finally { setBusy(false); }
  }

  return <div className="studio-workspace">
    <div className="studio-banner"><ShieldCheck size={20}/><div>
      <strong>{user}</strong><small>Rôle : {role} · La base de données protège tes brouillons privés.</small>
    </div></div>

    <div className="studio-panel-head">
      <h2><FolderOpen size={21}/> Mes implémentations</h2>
      <div className="studio-actions">
        <button className="btn btn-muted" disabled={loading} onClick={() => void refresh()}><RefreshCw size={15}/> Actualiser</button>
        <button className="btn btn-primary" onClick={newDraft}><Plus size={15}/> Nouvelle</button>
      </div>
    </div>
    {listError && <p className="run-error" role="alert">{listError}. Vérifie que les migrations Supabase ont été appliquées.</p>}
    {loading ? <p className="studio-hint">Chargement des brouillons…</p> : drafts.length === 0
      ? <p className="studio-hint">Tu n&apos;as pas encore de brouillon. Crée ta première méthode ci-dessous.</p>
      : <div className="draft-grid">{drafts.map(d =>
        <div key={d.id} className={`draft-card${editing === d.id ? " selected" : ""}`}>
          <span className="draft-meta">{d.implementations?.topics?.title ?? "Concept"} · {d.implementations?.method_type === "base" ? "Base" : "Advanced"}</span>
          <strong>{d.title}</strong>
          <small>{statusName[d.status]} · version {d.edit_seq}</small>
          {d.review_note && <p className="review-message">Retour : {d.review_note}</p>}
          {editable(d) ? <button type="button" onClick={() => openDraft(d)}>Ouvrir et modifier →</button>
            : <span className="studio-muted">Lecture seule · enregistrement verrouillé</span>}
        </div>)}</div>}

    <div className="studio-layout">
      <div className="studio-form">
        <h2><FileCode2 size={22}/>{editing ? "Modifier le brouillon" : "Nouvelle implémentation"}</h2>
        <p className="studio-hint">{editing ? "Tu peux enregistrer plusieurs fois, sans créer de doublon." : "Choisis un concept et rédige ta méthode."}</p>
        <label>Concept<select value={topic} disabled={Boolean(editing) || busy} onChange={e => setTopic(e.target.value)}>
          {algorithms.map(a => <option key={a.slug} value={a.slug}>{a.name} — {a.title}</option>)}
        </select></label>
        <label>Type<select value={method} disabled={Boolean(editing) || busy} onChange={e => setMethod(e.target.value as "base" | "advanced")}>
          <option value="base">Base — méthode scolaire</option><option value="advanced">Advanced — autre méthode</option>
        </select></label>
        <label>Titre<input maxLength={160} placeholder="Ex. PGCD avec Euclide" value={title} onChange={e => setTitle(e.target.value)}/></label>
        <label>Explication<textarea rows={5} maxLength={20000} placeholder="Explique la méthode aux élèves…" value={explanation} onChange={e => setExplanation(e.target.value)}/></label>
        <label>Pseudo-code<textarea rows={5} maxLength={30000} placeholder="Version algorithmique pour la classe…" value={pseudocode} onChange={e => setPseudocode(e.target.value)}/></label>
        <button className="btn btn-primary" onClick={() => void save()} disabled={busy}><Save size={17}/>{busy ? "Enregistrement…" : editing ? "Enregistrer les changements" : "Créer le brouillon"}</button>
        {error && <div className="run-error" role="alert">{error}</div>}
        {ok && <div className="success-strip" role="status"><CheckCircle2 size={15}/> {ok}</div>}
      </div>
      <div className="studio-editor">
        <div className="editor-toolbar"><span><TerminalSquare size={17}/> Code Python</span><span className="tiny-tag">NUMPY + RANDOM PRÉVUS</span></div>
        <Monaco height="480px" language="python" theme="vs-dark" value={code} onChange={v => setCode(v ?? "")}
          options={{ minimap: { enabled: false }, fontSize: 14, tabSize: 4, wordWrap: "on", scrollBeyondLastLine: false, automaticLayout: true }}/>
        <div className="sandbox-note"><LockKeyhole size={18}/><p>
          <strong>Exécution et publication désactivées.</strong> Les fonctions des contributeurs ne seront testées que dans un environnement isolé. Un brouillon enregistré n&apos;est ni validé ni publié.
        </p></div>
      </div>
    </div>
    {(role === "reviewer" || role === "owner") && <ReviewerWorkspace userId={userId}/>}
    {role === "owner" && <TeamRoles/>}
  </div>;
}
