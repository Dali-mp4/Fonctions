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
import { FunctionTestsEditor } from "@/components/function-tests-editor";
import { type EditableTest, type FunctionSchema, type Parameter, type ValueType,
  testsFromDatabase, validateTestCases } from "@/lib/test-contract";
import { ReviewerWorkspace } from "@/components/reviewer-workspace";
import { PublicationManagement } from "@/components/publication-management";
import { RevisionHistory } from "@/components/revision-history";
import type { DraftRunResult } from "@/lib/draft-runner";
import { TeamRoles } from "@/components/team-roles";

const Monaco = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="editor-loading">Chargement de l&apos;éditeur...</div>,
});

const sample = `def pgcd(a, b):\n    while b != 0:\n        a, b = b, a % b\n    return a`;
const initialParameters: Parameter[] = [{ name: "a", type: "int" }, { name: "b", type: "int" }];
const initialTests: EditableTest[] = [
  { id: "example-1", label: "PGCD(24, 18)", inputsText: '{"a":24,"b":18}', expectedText: "6" },
  { id: "example-2", label: "PGCD(15, 25)", inputsText: '{"a":15,"b":25}', expectedText: "5" },
];

type Topic = { slug: string; title: string };
type Implementation = { id: string; published_revision_id: string | null; method_type: "base" | "advanced"; topics: Topic };
export type Revision = {
  id: string;
  title: string;
  explanation: string;
  pseudocode: string;
  python_code: string;
  entry_function: string | null;
  input_schema: FunctionSchema | Record<string, never> | null;
  test_cases: unknown;
  status: "draft" | "changes_requested" | "submitted" | "published" | "archived";
  test_status: "not_run" | "passed" | "failed";
  test_evidence: unknown;
  review_note: string | null;
  reviewer_id: string | null;
  reviewed_at: string | null;
  submitted_at: string | null;
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
  const [entry, setEntry] = useState("pgcd");
  const [parameters, setParameters] = useState<Parameter[]>(initialParameters);
  const [returns, setReturns] = useState<ValueType>("int");
  const [testCases, setTestCases] = useState<EditableTest[]>(initialTests);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<DraftRunResult | null>(null);
  const [runError, setRunError] = useState("");
  const [running, setRunning] = useState(false);
  const [submitBusy, setSubmitBusy] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [submitNotice, setSubmitNotice] = useState("");

  function contentSignature(values: {
    title: string; explanation: string; pseudocode: string; code: string;
    entry: string; parameters: Parameter[]; returns: ValueType; tests: EditableTest[];
  }) {
    const check = validateTestCases(values.entry, values.code,
      { parameters: values.parameters, returns: values.returns }, values.tests);
    return JSON.stringify({ title: values.title.trim(), explanation: values.explanation.trim(),
      pseudocode: values.pseudocode, code: values.code, entry: values.entry,
      parameters: values.parameters, returns: values.returns, cases: check.testCases });
  }
  const signature = contentSignature({ title, explanation, pseudocode, code, entry, parameters, returns, tests: testCases });
  const pristine = Boolean(editing && savedSignature === signature);

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
    setEntry("pgcd"); setParameters(initialParameters.map(p => ({...p})));
    setReturns("int"); setTestCases(initialTests.map(t => ({...t})));
    setError(""); setOk(""); setSavedSignature(null); setRunResult(null); setRunError("");
  }

  function openDraft(draft: Revision) {
    if (!editable(draft)) return;
    setEditing(draft.id); setEditSeq(draft.edit_seq);
    setTopic(draft.implementations.topics.slug);
    setMethod(draft.implementations.method_type);
    setTitle(draft.title); setExplanation(draft.explanation);
    setPseudocode(draft.pseudocode); setCode(draft.python_code);
    setEntry(draft.entry_function ?? "");
    const schema = draft.input_schema;
    setParameters(schema && "parameters" in schema && Array.isArray(schema.parameters)
      ? schema.parameters : []);
    setReturns(schema && "returns" in schema && schema.returns ? schema.returns : "int");
    const restoredTests = testsFromDatabase(draft.test_cases);
    setTestCases(restoredTests);
    setSavedSignature(contentSignature({ title: draft.title, explanation: draft.explanation,
      pseudocode: draft.pseudocode, code: draft.python_code,
      entry: draft.entry_function ?? "", parameters: schema && "parameters" in schema && Array.isArray(schema.parameters)
        ? schema.parameters : [], returns: schema && "returns" in schema && schema.returns ? schema.returns : "int",
      tests: restoredTests }));
    const saved = draft.test_evidence as Partial<DraftRunResult> | null;
    setRunResult(saved?.results && Array.isArray(saved.results) && saved.run_id ? {
      run_id: saved.run_id, status: draft.test_status === "passed" ? "passed" :
        draft.test_status === "failed" ? "failed" : "error",
      case_count: saved.results.length, results: saved.results,
      error: saved.error, timings_ms: saved.timings_ms,
    } : null);
    setRunError("");
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
    const schema: FunctionSchema = { parameters, returns };
    const preflight = validateTestCases(entry, code, schema, testCases);
    const badCases = preflight.cases.filter(t => !t.ok);
    if (preflight.errors.length || badCases.length) {
      setError([...preflight.errors, ...badCases.map(t => `${t.label} : ${t.message}`)].join(" "));
      return;
    }
    const sb = browserSupabase();
    if (!sb) { setError("Supabase n'est pas configuré."); return; }
    setBusy(true);
    try {
      if (editing) {
        const { data, error: saveError } = await sb.rpc("update_draft_with_contract", {
          p_revision: editing, p_expected_edit_seq: editSeq,
          p_title: title.trim(), p_explanation: explanation.trim(),
          p_pseudocode: pseudocode, p_python_code: code,
          p_entry_function: entry, p_input_schema: schema, p_test_cases: preflight.testCases,
        });
        if (saveError) throw saveError;
        setEditSeq(Number(data));
        setOk("Brouillon mis à jour. Les éventuels anciens tests ont été annulés.");
      } else {
        const { data, error: saveError } = await sb.rpc("create_draft_with_contract", {
          p_topic_slug: topic, p_method_type: method,
          p_title: title.trim(), p_explanation: explanation.trim(),
          p_pseudocode: pseudocode, p_python_code: code,
          p_entry_function: entry, p_input_schema: schema, p_test_cases: preflight.testCases,
        });
        if (saveError) throw saveError;
        setEditing(String(data)); setEditSeq(1);
        setOk("Brouillon privé créé. Aucun code n'a été exécuté ni publié.");
      }
      setSavedSignature(signature); setRunResult(null); setRunError("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer le brouillon.");
    } finally { setBusy(false); }
  }

  async function runTests() {
    setRunError(""); setRunResult(null);
    if (!editing || !pristine || testCases.length < 1) {
      setRunError("Enregistre d'abord ce brouillon et tous ses tests avant l'exécution.");
      return;
    }
    const sb = browserSupabase();
    if (!sb) { setRunError("Authentification non configurée."); return; }
    setRunning(true);
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) throw new Error("Reconnecte-toi avant de tester.");
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
      const response = await fetch(`${base}/api/v1/drafts/${editing}/test`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ edit_seq: editSeq }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : `Erreur HTTP ${response.status}`);
      const report = data as DraftRunResult;
      setRunResult(report);
      await refresh();
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Impossible de contacter le sandbox.");
    } finally { setRunning(false); }
  }

  async function submitDraft(draft: Revision) {
    setSubmitError(""); setSubmitNotice("");
    if (!editable(draft) || draft.test_status !== "passed" ||
        (editing === draft.id && !pristine) || running || busy) {
      setSubmitError("Enregistre les modifications et réussis les tests Python avant de soumettre.");
      return;
    }
    const sb = browserSupabase();
    if (!sb) { setSubmitError("Supabase n'est pas configuré."); return; }
    setSubmitBusy(draft.id);
    try {
      const { error: submitErr } = await sb.rpc("submit_revision", {
        p_revision: draft.id, p_expected_edit_seq: draft.edit_seq,
      });
      if (submitErr) throw submitErr;
      setSubmitNotice("Soumission envoyée : un autre relecteur peut maintenant l'examiner.");
      if (editing === draft.id) newDraft();
      await refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Impossible d'envoyer la soumission.");
    } finally { setSubmitBusy(null); }
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
    {submitError && <p className="run-error" role="alert">{submitError}</p>}
    {submitNotice && <p className="success-strip" role="status">{submitNotice}</p>}
    {loading ? <p className="studio-hint">Chargement des brouillons…</p> : drafts.length === 0
      ? <p className="studio-hint">Tu n&apos;as pas encore de brouillon. Crée ta première méthode ci-dessous.</p>
      : <div className="draft-grid">{drafts.map(d =>
        <div key={d.id} className={`draft-card${editing === d.id ? " selected" : ""}`}>
          <span className="draft-meta">{d.implementations?.topics?.title ?? "Concept"} · {d.implementations?.method_type === "base" ? "Base" : "Advanced"}</span>
          <strong>{d.title}</strong>
          <small>{statusName[d.status]} · version {d.edit_seq} · {d.test_status === "passed" ? "Tests Python réussis" : d.test_status === "failed" ? "Tests Python échoués" : "Tests Python non exécutés"}</small>
          {d.review_note && <p className="review-message">Retour : {d.review_note}</p>}
          {editable(d) ? <>
            <button type="button" onClick={() => openDraft(d)} disabled={busy || running || submitBusy !== null}>Ouvrir et modifier →</button>
            {d.test_status === "passed" ? <button type="button" className="draft-submit-btn"
              disabled={busy || running || submitBusy !== null || (editing === d.id && !pristine)}
              onClick={() => void submitDraft(d)}>
              {submitBusy === d.id ? "Envoi…" : "Soumettre à la relecture →"}
            </button> : <span className="studio-muted">Réussis les tests Python avant de soumettre.</span>}
          </> : <span className="studio-muted">Lecture seule · {d.status === "submitted" ? "en attente d'un relecteur" : "version validée"}</span>}
          <RevisionHistory revisionId={d.id}/>
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
          <strong>Exécution Python isolée.</strong> Enregistre puis teste ton code avant de soumettre. La publication exige l&apos;accord d&apos;un autre relecteur. Les soumissions sont verrouillées.
        </p></div>
      </div>
    </div>
    <FunctionTestsEditor entry={entry} onEntry={setEntry}
      parameters={parameters} onParameters={setParameters} returns={returns} onReturns={setReturns}
      tests={testCases} onTests={setTestCases} code={code}
      canRun={pristine && !busy && !running && testCases.length > 0}
      onRun={() => void runTests()} running={running}
      runResult={pristine ? runResult : null} runError={runError}
      runHint={!editing ? "Crée et enregistre un brouillon pour tester Python." :
        !pristine ? "Enregistre les modifications avant de relancer les tests." : "Exécution isolée · NumPy et random disponibles"}/>
    {(role === "reviewer" || role === "owner") && <ReviewerWorkspace userId={userId}/>}
    {role === "owner" && <PublicationManagement/>}
    {role === "owner" && <TeamRoles/>}
  </div>;
}
