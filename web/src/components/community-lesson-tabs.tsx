"use client";
import { useState } from "react";
import { BookOpenText, Code2, Play, ChevronDown, CheckCircle2, ShieldCheck } from "lucide-react";
import type { MethodRecord } from "@/lib/public-catalog-model";

type Case = { label?: string; inputs?: unknown; expected?: unknown };
const objectValue = (x: unknown) => x && typeof x === "object" && !Array.isArray(x);

/** Same three pedagogical tabs as the original Fonctions lessons.
 * Contributed Python is ALWAYS text, never evaluated in the public browser/API. */
export function CommunityLessonTabs({ method: m }: { method: MethodRecord }) {
  const [tab, setTab] = useState<"essayer"|"comprendre"|"code">("essayer");
  const [caseNumber, setCaseNumber] = useState(0);
  const content = m.lesson_content;
  const cases: Case[] = Array.isArray(m.test_cases) ? m.test_cases.filter(objectValue) as Case[] : [];
  const sections = Array.isArray(content?.sections) && content.sections.length ? content.sections : [
    { title: "Algorithme proposé", pseudocode: m.pseudocode, python: m.python_code, note: "" },
  ];
  const sample = cases[caseNumber];
  return <div className="lesson-tabs">
    <div className="tab-bar" role="tablist" aria-label="Onglets du module">
      <button role="tab" aria-selected={tab==="essayer"} className={tab==="essayer"?"selected":""} onClick={()=>setTab("essayer")}><Play size={17}/> Essayer</button>
      <button role="tab" aria-selected={tab==="comprendre"} className={tab==="comprendre"?"selected":""} onClick={()=>setTab("comprendre")}><BookOpenText size={17}/> Comprendre</button>
      <button role="tab" aria-selected={tab==="code"} className={tab==="code"?"selected":""} onClick={()=>setTab("code")}><Code2 size={17}/> Algorithme & Python</button>
    </div>
    {tab==="essayer" && <section className="tab-body" role="tabpanel">
      <div className="workspace-grid">
        <div className="panel"><div className="panel-title"><Play size={18}/> Exemples validés</div>
          <p>Retrouve les exemples fournis par le contributeur et examinés pendant la relecture.</p>
          <label className="method-example-select">Choisir un cas de test
            <select value={caseNumber} onChange={e=>setCaseNumber(Number(e.target.value))}>
              {cases.map((tc,i)=><option key={i} value={i}>{tc.label || `Exemple ${i+1}`}</option>)}
            </select>
          </label>
          <p className="studio-hint">Cette méthode est approuvée, mais le lancement de code communautaire sur des valeurs libres n&apos;est pas encore activé publiquement.</p>
        </div>
        <div className="panel output-panel"><div className="panel-title"><CheckCircle2 size={18}/> Exemple de résultat attendu</div>
          {sample ? <div className="method-example-output">
            <strong>{sample.label || `Exemple ${caseNumber+1}`}</strong>
            <span>Entrées</span><pre>{JSON.stringify(sample.inputs,null,2)}</pre>
            <span>Résultat attendu</span><pre>{JSON.stringify(sample.expected,null,2)}</pre>
            <small>Il s&apos;agit d&apos;un exemple enregistré, et non d&apos;une nouvelle exécution.</small>
          </div> : <p>Aucun exemple enregistré.</p>}
        </div>
      </div>
    </section>}
    {tab==="comprendre" && <section className="tab-body" role="tabpanel">
      <div className="explainer"><span className="section-kicker">LE PRINCIPE</span>
        <h2>Comment fonctionne {m.title} ?</h2>
        <p>{content?.principle || m.explanation}</p>
        <div className="explain-example"><strong>EXEMPLE</strong><span>{content?.example || (cases[0]?.label ?? "Voir les cas de test")}</span></div>
        {content?.limits && <div className="explain-note"><strong>À RETENIR / LIMITES</strong><p>{content.limits}</p></div>}
        <p className="studio-hint">{m.explanation}</p>
      </div>
    </section>}
    {tab==="code" && <section className="tab-body" role="tabpanel">
      <div className="code-intro"><h2>Du pseudo-code au Python.</h2>
        <p>Cette méthode a été soumise, testée en sandbox puis approuvée par un relecteur indépendant. Les extraits sont présentés pour apprendre.</p></div>
      <div className="sections-list">{sections.map((sec,i)=><details className="code-section" key={`${sec.title}-${i}`} open={i===0}>
        <summary><span><small>{String(i+1).padStart(2,"0")}</small> {sec.title}</span><ChevronDown size={20}/></summary>
        <div className="code-columns">
          <div><div className="snippet-title"><span>ALGORITHME / PSEUDO-CODE</span></div><pre><code>{sec.pseudocode || "Non fourni"}</code></pre></div>
          <div><div className="snippet-title"><span>PYTHON APPROUVÉ</span></div><pre><code>{sec.python || "Non fourni"}</code></pre></div>
        </div>{sec.note && <p className="snippet-note">{sec.note}</p>}
      </details>)}</div>
      <p className="method-security-note"><ShieldCheck size={17}/> Le code est affiché uniquement. L&apos;API publique continue d&apos;exécuter exclusivement les sept moteurs scolaires éprouvés.</p>
    </section>}
  </div>;
}
