"use client";
import { TransientAlert } from "@/components/transient-alert";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  FileCode2, FolderOpen, LockKeyhole, Plus, RefreshCw,
  Save, ShieldCheck, TerminalSquare, Trash2,
} from "lucide-react";
import { algorithms } from "@/lib/catalog";
import { browserSupabase } from "@/lib/supabase-browser";
import { revisionWithImplementationSelect } from "@/lib/revision-select";
import { FunctionTestsEditor } from "@/components/function-tests-editor";
import { type EditableTest, type FunctionSchema, type Parameter, type ValueType,
  testsFromDatabase, validateTestCases } from "@/lib/test-contract";
import { ReviewerWorkspace } from "@/components/reviewer-workspace";
import { PublicationManagement } from "@/components/publication-management";
import type { DraftRunResult } from "@/lib/draft-runner";
import { TeamRoles } from "@/components/team-roles";
import { ContentManagement } from "@/components/content-management";
import { chaptersForStudioRevisions, selectStudioRevisions } from "@/lib/studio-revision-visibility";
import { type LessonContent, type LessonSection, makeLessonContent, validateLessonContent } from "@/lib/lesson-content";

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
  lesson_content: LessonContent | null;
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
  const [chapterFilter, setChapterFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editSeq, setEditSeq] = useState(1);
  const [topic, setTopic] = useState("arithmetique");
  const [allTopics, setAllTopics] = useState<{slug:string;title:string;state:string}[]>(algorithms.map(a=>({slug:a.slug,title:a.name,state:"published"})));
  const [creatingChapter,setCreatingChapter] = useState(false);
  const [chapterSlug,setChapterSlug] = useState("");
  const [chapterTitle,setChapterTitle] = useState("");
  const [chapterCategory,setChapterCategory] = useState("Algorithmique");
  const [chapterLevel,setChapterLevel] = useState("3ème Info");
  const [chapterSummary,setChapterSummary] = useState("");
  const [method, setMethod] = useState<"base" | "advanced">("advanced");
  const [title, setTitle] = useState("");
  const [explanation, setExplanation] = useState("");
  const [principle, setPrinciple] = useState("");
  const [example, setExample] = useState("");
  const [limits, setLimits] = useState("");
  const [sectionTitle, setSectionTitle] = useState("Fonction principale");
  const [extraSections, setExtraSections] = useState<LessonSection[]>([]);
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
  const [savedPlacement, setSavedPlacement] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<DraftRunResult | null>(null);
  const [runError, setRunError] = useState("");
  const [running, setRunning] = useState(false);
  const [submitBusy, setSubmitBusy] = useState<string | null>(null);
  const [resumeBusy, setResumeBusy] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState<string | null>(null);
  const [deleteImplementationBusy, setDeleteImplementationBusy] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [submitNotice, setSubmitNotice] = useState("");

  function contentSignature(values: {
    title: string; explanation: string; pseudocode: string; code: string;
    entry: string; parameters: Parameter[]; returns: ValueType; tests: EditableTest[]; lesson: LessonContent;
  }) {
    const check = validateTestCases(values.entry, values.code,
      { parameters: values.parameters, returns: values.returns }, values.tests);
    return JSON.stringify({ title: values.title.trim(), explanation: values.explanation.trim(),
      pseudocode: values.pseudocode, code: values.code, entry: values.entry,
      parameters: values.parameters, returns: values.returns, cases: check.testCases, lesson: values.lesson });
  }
  const lesson = makeLessonContent(principle, example, limits, sectionTitle, pseudocode, code, extraSections);
  const signature = contentSignature({ title, explanation, pseudocode, code, entry, parameters, returns, tests: testCases, lesson });
  const placementSignature = `${topic}:${method}`;
  const pristine = Boolean(editing && savedSignature === signature && savedPlacement === placementSignature);

  const refresh = useCallback(async () => {
    const sb = browserSupabase();
    if (!sb) { setListError("Supabase n'est pas configuré."); setLoading(false); return; }
    setLoading(true);
    const {data:rows,error:te}=await sb.from("topics").select("slug,title,state").order("title").limit(200);
    if(!te && rows) setAllTopics(rows);
    const { data, error: queryError } = await sb.from("revisions")
      .select(revisionWithImplementationSelect)
      .eq("created_by", userId).order("updated_at", { ascending: false }).limit(500);
    if (queryError) setListError(queryError.message);
    else { setDrafts((data ?? []) as unknown as Revision[]); setListError(""); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  function newDraft() {
    setEditing(null); setEditSeq(1); setTopic("arithmetique"); setMethod("advanced");
    setCreatingChapter(false);setChapterSlug("");setChapterTitle("");setChapterSummary("");
    setTitle(""); setExplanation(""); setPseudocode(""); setCode(sample);
    setPrinciple(""); setExample(""); setLimits("");
    setSectionTitle("Fonction principale"); setExtraSections([]);
    setEntry("pgcd"); setParameters(initialParameters.map(p => ({...p})));
    setReturns("int"); setTestCases(initialTests.map(t => ({...t})));
    setError(""); setOk(""); setSavedSignature(null); setSavedPlacement(null); setRunResult(null); setRunError("");
  }

  function openDraft(draft: Revision) {
    if (!editable(draft)) return;
    setEditing(draft.id); setEditSeq(draft.edit_seq);
    setTopic(draft.implementations.topics.slug);setCreatingChapter(false);
    setMethod(draft.implementations.method_type);
    setSavedPlacement(`${draft.implementations.topics.slug}:${draft.implementations.method_type}`);
    setTitle(draft.title); setExplanation(draft.explanation);
    setPseudocode(draft.pseudocode); setCode(draft.python_code);
    const teaching = draft.lesson_content;
    setPrinciple(teaching?.principle || draft.explanation);
    setExample(teaching?.example || "Exemple à renseigner");
    setLimits(teaching?.limits || "");
    setSectionTitle(teaching?.sections?.[0]?.title || "Fonction principale");
    setExtraSections(teaching?.sections?.slice(1) || []);
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
      tests: restoredTests, lesson: makeLessonContent(
        teaching?.principle || draft.explanation, teaching?.example || "Exemple à renseigner",
        teaching?.limits || "", teaching?.sections?.[0]?.title || "Fonction principale",
        draft.pseudocode, draft.python_code, teaching?.sections?.slice(1) || [],
      ) }));
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
    const pedagogicalErrors = validateLessonContent(lesson);
    if(pedagogicalErrors.length){setError(pedagogicalErrors.join(" "));return;}
    const schema: FunctionSchema = { parameters, returns };
    const preflight = validateTestCases(entry, code, schema, testCases);
    const badCases = preflight.cases.filter(t => !t.ok);
    if (preflight.errors.length || badCases.length) {
      setError([...preflight.errors, ...badCases.map(t => `${t.label} : ${t.message}`)].join(" "));
      return;
    }
    if (!editing && creatingChapter &&
      (!/^[a-z][a-z0-9-]{2,39}$/.test(chapterSlug) ||
       chapterTitle.trim().length < 4 || chapterCategory.trim().length < 3 ||
       chapterLevel.trim().length < 3 || chapterSummary.trim().length < 20)) {
      setError("Complète les champs du nouveau chapitre : identifiant, nom, catégorie, niveau et résumé (20 caractères minimum).");
      return;
    }
    const sb = browserSupabase();
    if (!sb) { setError("Supabase n'est pas configuré."); return; }
    setBusy(true);
    try {
      if (editing) {
        const { data, error: saveError } = await sb.rpc("save_private_lesson_with_placement", {
          p_revision: editing, p_expected_edit_seq: editSeq,
          p_topic_slug: topic, p_method_type: method,
          p_title: title.trim(), p_explanation: explanation.trim(),
          p_pseudocode: pseudocode, p_python_code: code,
          p_entry_function: entry, p_input_schema: schema, p_test_cases: preflight.testCases, p_lesson_content: lesson,
        });
        if (saveError) throw saveError;
        setEditSeq(Number(data.edit_seq));
        setOk(data.forked
          ? "Brouillon déplacé vers une nouvelle implémentation privée. L'ancienne publication et son historique sont conservés. Relance les tests."
          : data.placement_changed
          ? "Concept et type enregistrés. Relance les tests avant la relecture."
          : "Brouillon mis à jour. Les éventuels anciens tests ont été annulés.");
      } else if (creatingChapter) {
        const {data,error:saveError}=await sb.rpc("create_chapter_lesson",{
          p_slug:chapterSlug.trim(),p_chapter_title:chapterTitle.trim(),
          p_category:chapterCategory.trim(),p_school_level:chapterLevel.trim(),
          p_summary:chapterSummary.trim(),
          p_title:title.trim(),p_explanation:explanation.trim(),
          p_pseudocode:pseudocode,p_python_code:code,p_entry_function:entry,
          p_input_schema:schema,p_test_cases:preflight.testCases,p_lesson_content:lesson,
        });
        if(saveError) throw saveError;
        setEditing(String(data));setEditSeq(1);setTopic(chapterSlug.trim());
        setMethod("base");setSavedPlacement(`${chapterSlug.trim()}:base`);setCreatingChapter(false);
        setOk("Chapitre proposé avec son premier brouillon. Relecture nécessaire avant publication.");
      } else {
        const { data, error: saveError } = await sb.rpc("create_draft_lesson_with_contract", {
          p_topic_slug: topic, p_method_type: method,
          p_title: title.trim(), p_explanation: explanation.trim(),
          p_pseudocode: pseudocode, p_python_code: code,
          p_entry_function: entry, p_input_schema: schema, p_test_cases: preflight.testCases, p_lesson_content: lesson,
        });
        if (saveError) throw saveError;
        setEditing(String(data)); setEditSeq(1);
        setOk("Brouillon privé créé. Aucun code n'a été exécuté ni publié.");
      }
      setSavedSignature(signature); setSavedPlacement(creatingChapter ? `${chapterSlug.trim()}:base` : placementSignature); setRunResult(null); setRunError("");
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

  async function deleteImplementation(draft: Revision) {
    const isOwner = role === "owner";
    if (!isOwner && !(["contributor","reviewer"].includes(role) &&
        draft.created_by === userId &&
        ["draft","changes_requested","submitted"].includes(draft.status) &&
        draft.implementations.published_revision_id === null &&
        !drafts.some(other => other.implementations.id === draft.implementations.id &&
          ["archived","published"].includes(other.status)))) return;
    if (deleteImplementationBusy !== null) return;
    const implementationId = draft.implementations.id;
    const confirmation = window.prompt(
      "SUPPRESSION DÉFINITIVE : " + draft.title + "\n" +
      (isOwner
        ? "Cette action supprime TOUTE l'implémentation (versions, tests, publications et historique).\n"
        : "Cette action supprime définitivement ta méthode privée, ses tests et sa soumission éventuelle.\n") +
      (isOwner
        ? "Si c'est la dernière implémentation d'un chapitre ajouté, le chapitre sera supprimé aussi.\n"
        : "Si tu as créé le chapitre et qu'il devient vide, il sera aussi supprimé.\n") +
      "Les 7 chapitres fondateurs sont conservés.\n\n" +
      "Saisis SUPPRIMER pour confirmer :"
    );
    if (confirmation !== "SUPPRIMER") return;
    const sb = browserSupabase();
    if (!sb) { setSubmitError("Supabase non configuré."); return; }
    setDeleteImplementationBusy(implementationId);
    setSubmitError(""); setSubmitNotice(""); setError(""); setOk("");
    try {
      const { data, error: rpcError } = await sb.rpc(
        isOwner ? "owner_delete_implementation" : "delete_own_private_implementation",
        { p_implementation: implementationId, p_confirmation: "SUPPRIMER" },
      );
      if (rpcError) throw rpcError;
      if (editing && drafts.some(r => r.id === editing && r.implementations.id === implementationId)) {
        newDraft();
      }
      await refresh();
      setSubmitNotice(data?.chapter_deleted
        ? "Implémentation et son chapitre désormais vide supprimés définitivement."
        : "Implémentation et toutes ses versions supprimées définitivement. Le chapitre est conservé.");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "La suppression a échoué.");
    } finally { setDeleteImplementationBusy(null); }
  }

  async function deleteDraftRevision(draft: Revision) {
    if (role !== "owner" || draft.status !== "draft" ||
        !drafts.some(other => other.id !== draft.id &&
          other.implementations.id === draft.implementations.id)) return;
    const confirmation = window.prompt(
      "Supprimer définitivement ce brouillon (version " + draft.edit_seq + ") : " +
      draft.title + "\\n" +
      "Les tests et l'historique de CE brouillon seront supprimés. " +
      "Les autres versions, notamment la version publiée, seront conservées.\\n" +
      "Saisis SUPPRIMER pour confirmer :"
    );
    if (confirmation !== "SUPPRIMER") return;
    const sb = browserSupabase();
    if (!sb) { setSubmitError("Supabase non configuré."); return; }
    setDeleteBusy(draft.id); setSubmitError(""); setSubmitNotice(""); setError(""); setOk("");
    try {
      const { error: rpcError } = await sb.rpc("owner_delete_draft_revision", {
        p_revision: draft.id, p_expected_edit_seq: draft.edit_seq,
        p_confirmation: "SUPPRIMER",
      });
      if (rpcError) throw rpcError;
      if (editing === draft.id) newDraft();
      await refresh();
      setSubmitNotice("Brouillon supprimé. Les autres versions de l'implémentation ont été conservées.");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Impossible de supprimer le brouillon.");
    } finally { setDeleteBusy(null); }
  }

  async function retractSubmission(draft: Revision) {
    if (draft.status !== "submitted" || draft.created_by !== userId) return;
    if (!window.confirm("Retirer cette soumission de la file de relecture pour la modifier ? Les tests devront être relancés et une nouvelle soumission sera nécessaire.")) return;
    const sb = browserSupabase();
    if (!sb) { setSubmitError("Supabase non configuré."); return; }
    setResumeBusy(draft.id); setSubmitError(""); setSubmitNotice(""); setError(""); setOk("");
    try {
      const { error: rpcError } = await sb.rpc("retract_submitted_revision", {
        p_revision: draft.id, p_expected_edit_seq: draft.edit_seq,
      });
      if (rpcError) throw rpcError;
      const { data: updated, error: fetchError } = await sb.from("revisions")
        .select(revisionWithImplementationSelect).eq("id", draft.id).single();
      if (fetchError || !updated) throw fetchError ?? new Error("Recharge El studio pour ouvrir le brouillon.");
      await refresh();
      openDraft(updated as unknown as Revision);
      setOk("Soumission retirée. Le brouillon est de nouveau modifiable ; enregistre, teste et soumets à nouveau.");
      document.getElementById("draft-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Impossible de retirer la soumission. Actualise El studio.");
    } finally { setResumeBusy(null); }
  }

  async function resumeArchived(draft: Revision) {
    if (draft.status !== "archived" || draft.created_by !== userId ||
        draft.implementations.published_revision_id !== null || resumeBusy !== null) return;
    // An earlier "Reprendre" may already have created a replacement version.
    // Never attempt to duplicate it; reuse an editable copy or retract a pending submission.
    const existing = drafts.find(r => r.id !== draft.id &&
      r.implementations.id === draft.implementations.id &&
      (editable(r) || r.status === "submitted"));
    if (existing?.status === "submitted") {
      await retractSubmission(existing);
      return;
    }
    if (existing && editable(existing)) {
      openDraft(existing);
      setSubmitError("");
      setOk("Une version privée existe déjà : elle est ouverte dans l'éditeur.");
      document.getElementById("draft-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const sb = browserSupabase();
    if (!sb) { setSubmitError("Supabase non configuré."); return; }
    setResumeBusy(draft.id); setSubmitError(""); setSubmitNotice(""); setError(""); setOk("");
    try {
      const { data: newId, error: rpcError } = await sb.rpc("reopen_archived_revision_as_draft", {
        p_revision: draft.id,
      });
      if (rpcError) {
        if (rpcError.message?.includes("already exists")) {
          await refresh();
          throw new Error("Une autre version existe déjà. Actualise El studio pour ouvrir la version en cours.");
        }
        throw rpcError;
      }
      if (typeof newId !== "string") throw new Error("Le nouveau brouillon est introuvable.");
      const { data: newDraft, error: fetchError } = await sb.from("revisions")
        .select(revisionWithImplementationSelect).eq("id", newId).single();
      if (fetchError || !newDraft) throw fetchError ?? new Error("Recharge El studio pour ouvrir le brouillon.");
      await refresh();
      openDraft(newDraft as unknown as Revision);
      setOk("Copie privée créée depuis la version retirée. Modifie-la, enregistre et relance les tests Python avant de soumettre.");
      document.getElementById("draft-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Impossible de reprendre cette publication.");
    } finally { setResumeBusy(null); }
  }

  const { privateRevisions, publishedRevisions } = selectStudioRevisions(drafts);
  const chapterOptions = chaptersForStudioRevisions([...privateRevisions, ...publishedRevisions]);
  const byChapter = (r: Revision) =>
    chapterFilter === "all" || r.implementations.topics.slug === chapterFilter;
  const privateFiltered = privateRevisions.filter(byChapter);
  const publishedFiltered = publishedRevisions.filter(byChapter);

  function renderChapterGroups(rows: Revision[]) {
    return <div className="studio-chapter-groups">{Array.from(new Set(rows.map(d =>
          d.implementations.topics.slug))).sort((a,b)=>{
            const aa=rows.find(d=>d.implementations.topics.slug===a)?.implementations.topics.title??a;
            const bb=rows.find(d=>d.implementations.topics.slug===b)?.implementations.topics.title??b;
            return aa.localeCompare(bb,"fr");
          }).map(chapterSlug=><section key={chapterSlug} className="studio-chapter-group">
            <h3>{rows.find(d=>d.implementations.topics.slug===chapterSlug)?.implementations.topics.title??chapterSlug}
              <small>{rows.filter(d=>d.implementations.topics.slug===chapterSlug).length} méthode(s)</small>
            </h3>
            <div className="draft-grid">{rows.filter(d=>d.implementations.topics.slug===chapterSlug).map(d => {
        return <div key={d.id} className={`draft-card${editing === d.id ? " selected" : ""}`}>
          {(role === "owner" || (["contributor","reviewer"].includes(role) &&
            d.created_by === userId &&
            ["draft","changes_requested","submitted"].includes(d.status) &&
            d.implementations.published_revision_id === null &&
            !drafts.some(other => other.implementations.id === d.implementations.id &&
              ["archived","published"].includes(other.status)))) &&
            <button type="button" className="draft-card-delete"
            aria-label={`Supprimer définitivement l'implémentation : ${d.title}`}
            title="Supprimer l'implémentation et toutes ses versions"
            disabled={busy || running || submitBusy !== null || resumeBusy !== null ||
              deleteBusy !== null || deleteImplementationBusy !== null}
            onClick={() => void deleteImplementation(d)}>
            <Trash2 size={17} aria-hidden="true"/>
          </button>}
          <span className="draft-meta">{d.implementations?.topics?.title ?? "Concept"} · {d.implementations?.method_type === "base" ? "Base" : "Advanced"}</span>
          <strong>{d.title}</strong>
          <small>{statusName[d.status]} · {d.test_status === "passed" ? "Tests Python réussis" : d.test_status === "failed" ? "Tests Python échoués" : "Tests Python non exécutés"}</small>
          {d.review_note && <p className="review-message">Retour : {d.review_note}</p>}
          {editable(d) ? <>
            <button type="button" onClick={() => openDraft(d)} disabled={busy || running || submitBusy !== null}>Ouvrir et modifier →</button>
            {d.test_status === "passed" ? <button type="button" className="draft-submit-btn"
              disabled={busy || running || submitBusy !== null || (editing === d.id && !pristine)}
              onClick={() => void submitDraft(d)}>
              {submitBusy === d.id ? "Envoi…" : "Soumettre à la relecture →"}
            </button> : <span className="studio-muted">Réussis les tests Python avant de soumettre.</span>}
            {role === "owner" && d.status === "draft" &&
              drafts.some(other => other.id !== d.id &&
                other.implementations.id === d.implementations.id) && <button
                type="button" className="btn btn-muted"
                disabled={busy || running || submitBusy !== null || deleteBusy !== null || resumeBusy !== null}
                onClick={() => void deleteDraftRevision(d)}>
                <Trash2 size={14}/> {deleteBusy === d.id ? "Suppression…" : "Supprimer ce brouillon"}
              </button>}
          </> : d.status === "submitted" ? <>
            <span className="studio-muted">En attente d'un relecteur. Tu peux retirer ta soumission pour corriger le contenu.</span>
            <button type="button" disabled={busy || running || submitBusy !== null || resumeBusy !== null}
              onClick={() => void retractSubmission(d)}>
              {resumeBusy === d.id ? "Retrait…" : "Retirer la soumission pour modifier →"}
            </button>
          </> : <span className="studio-muted">Lecture seule · version validée</span>}
          
        </div>;
      })}</div></section>)}</div>;
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
    <TransientAlert message={listError ? `${listError}. Vérifie que les migrations Supabase ont été appliquées.` : ""} tone="error"/>
    <TransientAlert message={submitError} tone="error"/>
    <TransientAlert message={submitNotice} tone="success"/>
    <div className="studio-implementation-filter">
      <label htmlFor="studio-chapter-filter">Filtrer par chapitre</label>
      <select id="studio-chapter-filter" value={chapterFilter} onChange={e => setChapterFilter(e.target.value)}>
        <option value="all">Tous les chapitres</option>
        {chapterOptions.map(ch => <option key={ch.slug} value={ch.slug}>{ch.title}</option>)}
      </select>
    </div>
    {loading ? <p className="studio-hint">Chargement des implémentations…</p> : <>
      <section className="studio-private-implementations" aria-label="Implémentations privées">
        <h3 className="studio-implementation-heading">Mes implémentations privées <small>{privateFiltered.length}</small></h3>
        {privateFiltered.length ? renderChapterGroups(privateFiltered) :
          <p className="studio-hint">{privateRevisions.length
            ? "Aucune implémentation privée dans ce chapitre."
            : "Aucun brouillon privé pour le moment. Crée ta première méthode ci-dessous."}</p>}
      </section>
      <details className="studio-published-disclosure">
        <summary>Afficher les implémentations déjà publiées <span>{publishedFiltered.length}</span></summary>
        <div className="studio-published-content">
          {publishedFiltered.length ? renderChapterGroups(publishedFiltered) :
            <p className="studio-hint">Aucune implémentation publiée pour ce chapitre.</p>}
        </div>
      </details>
    </>}

    <div className="studio-layout" id="draft-editor">
      <div className="studio-form">
        <h2><FileCode2 size={22}/>{editing ? "Modifier le brouillon" : "Nouvelle implémentation"}</h2>
        <p className="studio-hint">{editing ? "Tu peux enregistrer plusieurs fois, sans créer de doublon." : "Choisis un concept et rédige ta méthode."}</p>
        <label>Concept<select value={topic} disabled={busy || creatingChapter} onChange={e=>setTopic(e.target.value)}>
          {allTopics.map(t=><option key={t.slug} value={t.slug}>{t.title}{t.state==="pending"?" · En attente de validation":""}</option>)}
        </select></label>
        {!editing && <label className="review-approval-check">
          <input type="checkbox" checked={creatingChapter} disabled={busy}
            onChange={e=>{setCreatingChapter(e.target.checked);if(e.target.checked)setMethod("base");}}/>
          Proposer un nouveau concept / chapitre
        </label>}
        {!editing && creatingChapter && <section className="studio-lesson-fields" aria-label="Nouveau chapitre">
          <h3>Nouveau chapitre</h3>
          <p>Ce chapitre reste privé jusqu'à l'approbation de sa première méthode par un autre relecteur.</p>
          <label>Identifiant URL<input maxLength={40} value={chapterSlug}
            onChange={e=>setChapterSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,""))}
            placeholder="ex. recherche-dichotomique"/></label>
          <label>Nom<input maxLength={100} value={chapterTitle} onChange={e=>setChapterTitle(e.target.value)}/></label>
          <label>Catégorie<input maxLength={80} value={chapterCategory} onChange={e=>setChapterCategory(e.target.value)}/></label>
          <label>Niveau scolaire<input maxLength={80} value={chapterLevel} onChange={e=>setChapterLevel(e.target.value)}/></label>
          <label>Présentation<textarea rows={3} maxLength={500} value={chapterSummary}
            onChange={e=>setChapterSummary(e.target.value)} placeholder="Explique le chapitre en au moins 20 caractères."/></label>
        </section>}
        <label>Type<select value={method} disabled={busy || creatingChapter} onChange={e => setMethod(e.target.value as "base" | "advanced")}>
          <option value="base">Base — méthode progressive</option><option value="advanced">Advanced — autre méthode</option>
        </select></label>
        {editing && <p className="studio-hint">Tu peux changer le concept ou le type de ce brouillon privé. Si cette méthode a déjà été publiée puis retirée, l'ancienne version approuvée restera dans son chapitre d'origine. Enregistre, reteste et soumets à nouveau.</p>}
        <label>Titre<input maxLength={160} placeholder="Ex. PGCD avec Euclide" value={title} onChange={e => setTitle(e.target.value)}/></label>
        <label>Explication<textarea rows={5} maxLength={20000} placeholder="Explique la méthode aux élèves…" value={explanation} onChange={e => setExplanation(e.target.value)}/></label>
        <section className="studio-lesson-fields" aria-label="Présentation pédagogique">
          <h3>Présentation de la méthode</h3>
          <p>Toutes les méthodes utilisent la même présentation : principe, exemple, limites et sections de pseudo-code / Python.</p>
          <label>Le principe<textarea rows={4} maxLength={5000} value={principle} onChange={e=>setPrinciple(e.target.value)} placeholder="Explique les étapes et l'idée de cette méthode…"/></label>
          <label>Exemple expliqué<input maxLength={1000} value={example} onChange={e=>setExample(e.target.value)} placeholder="Ex. PGCD(24,18) = 6"/></label>
          <label>À retenir / limites<textarea rows={3} maxLength={2000} value={limits} onChange={e=>setLimits(e.target.value)} placeholder="Cas limites, préconditions, complexité…"/></label>
          <label>Titre de la section principale<input maxLength={160} value={sectionTitle} onChange={e=>setSectionTitle(e.target.value)} placeholder="Fonction principale"/></label>
          <label>Pseudo-code principal<textarea rows={5} maxLength={10000} placeholder="Version algorithmique pour la classe…" value={pseudocode} onChange={e => setPseudocode(e.target.value)}/></label>
          <p>Le Python principal est le code de l&apos;éditeur à droite, qui sera testé par le sandbox.</p>
          {extraSections.map((sec,i)=><div className="studio-lesson-extra" key={i}>
            <h4>Section {i+2}</h4>
            <label>Titre<input maxLength={160} value={sec.title} onChange={e=>setExtraSections(old=>old.map((x,j)=>j===i?{...x,title:e.target.value}:x))}/></label>
            <label>Pseudo-code<textarea rows={4} maxLength={10000} value={sec.pseudocode} onChange={e=>setExtraSections(old=>old.map((x,j)=>j===i?{...x,pseudocode:e.target.value}:x))}/></label>
            <label>Extrait Python<textarea rows={4} maxLength={15000} value={sec.python} onChange={e=>setExtraSections(old=>old.map((x,j)=>j===i?{...x,python:e.target.value}:x))}/></label>
            <label>Note<textarea rows={2} maxLength={1500} value={sec.note} onChange={e=>setExtraSections(old=>old.map((x,j)=>j===i?{...x,note:e.target.value}:x))}/></label>
            <button type="button" className="btn btn-muted" onClick={()=>setExtraSections(old=>old.filter((_,j)=>j!==i))}>Retirer cette section</button>
          </div>)}
          <button type="button" className="btn btn-muted" disabled={extraSections.length>=7} onClick={()=>setExtraSections(old=>[...old,{title:"",pseudocode:"",python:"",note:""}])}>Ajouter une section (TDNT, TDOG, algorithme…)</button>
        </section>
        <button className="btn btn-primary" onClick={() => void save()} disabled={busy}><Save size={17}/>{busy ? "Enregistrement…" : editing ? "Enregistrer les changements" : "Créer le brouillon"}</button>
        <TransientAlert message={error} tone="error"/>
        <TransientAlert message={ok} tone="success"/>
      </div>
      <div className="studio-editor">
        <div className="editor-toolbar"><span><TerminalSquare size={17}/> Code Python</span><span className="tiny-tag">TABLEAUX NUMPY PRÉPARÉS</span></div>
        <p className="studio-hint">Écris uniquement l'algorithme étudié. Le sandbox prépare les tableaux et matrices NumPy, vérifie n / l / c et formate les résultats.
          Tu n'as pas besoin d'écrire <code>array(...)</code>, <code>dtype</code> ou <code>.tolist()</code> dans ta fonction.</p>
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
    {role === "owner" && <PublicationManagement userId={userId} onResumeArchived={(r) => void resumeArchived(r)} resumingId={resumeBusy}/>}
    {["contributor","reviewer","owner"].includes(role) &&
      <ContentManagement userId={userId} role={role} onRenamed={()=>{void refresh();}}/>}
    {role === "owner" && <TeamRoles/>}
  </div>;
}
