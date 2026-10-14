"use client";
import { useState } from "react";
import Link from "next/link";
import { BookOpenText, Code2, Play, ChevronDown, ShieldCheck } from "lucide-react";
import type { MethodRecord } from "@/lib/public-catalog-model";
import { browserSupabase } from "@/lib/supabase-browser";
import { ResultDisplay } from "@/components/result-display";
import { useTranslate } from "@/components/language-provider";

type Param = { name: string; type: string };
type Case = { label?: string; inputs?: Record<string, unknown>; expected?: unknown };
const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function parseInput(raw: string, type: string): unknown {
  if (type === "str") return raw;
  if (type === "bool") return raw === "true";
  const parsed: unknown = JSON.parse(raw);
  if (type === "int" && (!Number.isSafeInteger(parsed) || typeof parsed !== "number"))
    throw new Error("Saisis un entier valide.");
  if (type === "float" && (typeof parsed !== "number" || !Number.isFinite(parsed)))
    throw new Error("Saisis un nombre fini.");
  if (type.startsWith("list[") && !Array.isArray(parsed))
    throw new Error("Saisis un tableau JSON, par exemple [1,2,3].");
  return parsed;
}
const toText = (v: unknown, type: string) => type === "str" ? String(v ?? "") : JSON.stringify(v ?? null);

/** Same three teaching tabs as the seven trusted Base lessons, but a metered,
 * authenticated Modal sandbox executes ONLY the pinned, reviewed source. */
export function CommunityLessonTabs({ method: m }: { method: MethodRecord }) {
  const t=useTranslate();
  const [tab, setTab] = useState<"essayer"|"comprendre"|"code">("essayer");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<unknown>(null);
  const [didRun, setDidRun] = useState(false);
  const [error, setError] = useState("");
  const content = m.lesson_content;
  const schema = m.input_schema as { parameters?: Param[]; returns?: string } | null;
  const params = Array.isArray(schema?.parameters) ? schema.parameters : [];
  const cases = Array.isArray(m.test_cases) ? m.test_cases as Case[] : [];
  const firstInputs = cases[0]?.inputs ?? {};
  const [values, setValues] = useState<Record<string,string>>(() => Object.fromEntries(
    params.map(p => [p.name, toText(firstInputs[p.name], p.type)])));
  const sections = Array.isArray(content?.sections) && content.sections.length ? content.sections : [
    { title: "Algorithme proposé", pseudocode: m.pseudocode, python: m.python_code, note: "" },
  ];

  async function run(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setDidRun(false); setOutput(null);
    let inputs: Record<string,unknown>;
    try {
      inputs = Object.fromEntries(params.map(p => [p.name,parseInput(values[p.name] ?? "",p.type)]));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Entrées invalides"); return;
    }
    const sb = browserSupabase();
    if (!sb) { setError("Connexion non configurée."); return; }
    setRunning(true);
    try {
      const {data:{session}} = await sb.auth.getSession();
      if (!session?.access_token) throw new Error("Connecte-toi pour exécuter cette méthode.");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 55000);
      try {
        const res = await fetch(`${API}/api/v1/methods/${m.id}/run`, {
          method: "POST", signal: controller.signal,
          headers: {"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},
          body: JSON.stringify({inputs}),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : `Erreur HTTP ${res.status}`);
        if (data.status === "error") throw new Error(data.error || "Erreur Python");
        if (data.status !== "ok") throw new Error("Réponse invalide du sandbox");
        setOutput(data.value);setDidRun(true);
      } finally {clearTimeout(timer);}
    } catch(exc) {setError(exc instanceof Error ? exc.message : "Sandbox indisponible");}
    finally {setRunning(false);}
  }

  return <div className="lesson-tabs">
    <div className="tab-bar" role="tablist" aria-label={t("Onglets du module")}>
      <button role="tab" aria-selected={tab==="essayer"} className={tab==="essayer"?"selected":""} onClick={()=>setTab("essayer")}><Play size={17}/> Essayer</button>
      <button role="tab" aria-selected={tab==="comprendre"} className={tab==="comprendre"?"selected":""} onClick={()=>setTab("comprendre")}><BookOpenText size={17}/> Comprendre</button>
      <button role="tab" aria-selected={tab==="code"} className={tab==="code"?"selected":""} onClick={()=>setTab("code")}><Code2 size={17}/> Algorithme & Python</button>
    </div>
    {tab==="essayer" && <section className="tab-body" role="tabpanel">
      <div className="workspace-grid">
        <div className="panel"><div className="panel-title"><Play size={18}/> Tes paramètres</div>
          <p>{t("Modifie librement les valeurs, puis exécute la méthode approuvée dans un sandbox isolé.")}</p>
          <form onSubmit={e=>void run(e)} className="run-form">
            {params.map(p=><label key={p.name}><span>{p.name} · {p.type}</span>
              {p.type === "bool" ? <select value={values[p.name]??"false"} onChange={e=>setValues(v=>({...v,[p.name]:e.target.value}))}>
                <option value="true">{t("Vrai")}</option><option value="false">{t("Faux")}</option>
              </select> : p.type.startsWith("list[") ?
                <textarea rows={3} value={values[p.name]??""} onChange={e=>setValues(v=>({...v,[p.name]:e.target.value}))} placeholder="[1,2,3]"/> :
                <input type={p.type === "str" ? "text" : "number"} step={p.type === "int" ? "1" : "any"}
                  value={values[p.name]??""} onChange={e=>setValues(v=>({...v,[p.name]:e.target.value}))}/>
              }<small>{t(p.type.startsWith("list[") ? "Utilise la notation JSON." : "Saisis ta propre valeur.")}</small>
            </label>)}
            <button className="btn btn-primary run-button" type="submit" disabled={running}>
              {running ? "Exécution isolée…" : "Exécuter la méthode"}<Play size={16}/>
            </button>
          </form>
          <p className="studio-hint">{t("Connexion requise · 2 exécutions/minute et 15/jour par compte · quota global de protection.")} <Link href="/connexion">{t("Se connecter")}</Link></p>
        </div>
        <div className="panel output-panel"><div className="panel-title"><ShieldCheck size={18}/> Résultat réel</div>
          {error ? <div className="run-error" role="alert">{error}</div> : didRun ?
            <div className="result-success"><strong>{t("EXÉCUTION RÉUSSIE")}</strong><ResultDisplay slug={m.topic_slug} value={output}/></div> :
            <div className="result-idle"><span className="idle-icon"><Play size={23}/></span><strong>{t("Prêt à tester ?")}</strong>
              <p>{t("Entre tes valeurs et lance une exécution Python isolée.")}</p></div>}
        </div>
      </div>
    </section>}
    {tab==="comprendre" && <section className="tab-body" role="tabpanel">
      <div className="explainer"><span className="section-kicker">{t("LE PRINCIPE")}</span>
        <h2>{t("Comment fonctionne")} {m.title} ?</h2>
        <p>{content?.principle || m.explanation}</p>
        <div className="explain-example"><strong>{t("EXEMPLE")}</strong><span>{content?.example || (cases[0]?.label ?? "Voir les cas de test")}</span></div>
        {content?.limits && <div className="explain-note"><strong>{t("À RETENIR / LIMITES")}</strong><p>{content.limits}</p></div>}
        <p className="studio-hint">{m.explanation}</p>
      </div>
    </section>}
    {tab==="code" && <section className="tab-body" role="tabpanel">
      <div className="code-intro"><h2>{t("Du pseudo-code au Python.")}</h2><p>{t("Explore les étapes et comprends le raisonnement de cette méthode.")}</p></div>
      <div className="sections-list">{sections.map((sec,i)=><details className="code-section" key={`${sec.title}-${i}`} open={i===0}>
        <summary><span><small>{String(i+1).padStart(2,"0")}</small> {sec.title}</span><ChevronDown size={20}/></summary>
        <div className="code-columns">
          <div><div className="snippet-title"><span>{t("ALGORITHME / PSEUDO-CODE")}</span></div><pre><code>{sec.pseudocode || "Non fourni"}</code></pre></div>
          <div><div className="snippet-title"><span>{t("PYTHON")}</span></div><pre><code>{sec.python || "Non fourni"}</code></pre></div>
        </div>{sec.note && <p className="snippet-note">{sec.note}</p>}
      </details>)}</div>
      <p className="method-security-note"><ShieldCheck size={17}/> {t("Les exécutions se font uniquement dans un sandbox isolé, soumis à des quotas.")}</p>
    </section>}
  </div>;
}
