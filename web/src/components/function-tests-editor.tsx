"use client";
import { useTranslate, useLocale } from "@/components/language-provider";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, FlaskConical, LockKeyhole, Plus, Trash2, PlayCircle } from "lucide-react";
import type { DraftRunResult } from "@/lib/draft-runner";
import {
  type EditableTest, type Parameter, type ValueType, valueTypes, validateTestCases,
} from "@/lib/test-contract";

const descriptions: Record<ValueType, string> = {
  int: "Entier", float: "Nombre", str: "Texte", bool: "Booléen",
  "list[int]": "Tableau d'entiers", "list[list[int]]": "Matrice d'entiers",
};
let localId = 0;
const newId = () => `test-${++localId}`;

export function FunctionTestsEditor({ entry, onEntry, parameters, onParameters, returns, onReturns,
  tests, onTests, code, canRun, onRun, running, runResult, runError, runHint }: {
    entry: string; onEntry: (entry: string) => void;
    parameters: Parameter[]; onParameters: (parameters: Parameter[]) => void;
    returns: ValueType; onReturns: (type: ValueType) => void;
    tests: EditableTest[]; onTests: (tests: EditableTest[]) => void; code: string;
    canRun: boolean; onRun: () => void; running: boolean;
    runResult: DraftRunResult | null; runError: string; runHint: string;
  }) {
  const t=useTranslate();
  const locale=useLocale();
  const translateValueType=(value:ValueType)=>t(descriptions[value]);
  const [showReport, setShowReport] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const began = performance.now();
    setElapsedSeconds(0);
    const interval = window.setInterval(
      () => setElapsedSeconds(Math.floor((performance.now() - began) / 1000)), 1000,
    );
    return () => window.clearInterval(interval);
  }, [running]);
  const report = useMemo(() => validateTestCases(entry, code, { parameters, returns }, tests), [entry, code, parameters, returns, tests]);
  const successful = report.cases.filter(c => c.ok).length;
  function setParameter(index: number, prop: keyof Parameter, value: string) {
    onParameters(parameters.map((p, i) => i === index ? { ...p, [prop]: value } as Parameter : p));
    setShowReport(false);
  }
  function changeTest(index: number, prop: keyof EditableTest, value: string) {
    onTests(tests.map((t, i) => i === index ? { ...t, [prop]: value } : t));
    setShowReport(false);
  }
  return <section className="test-workspace" aria-labelledby="tests-title">
    <div className="studio-panel-head">
      <h2 id="tests-title"><FlaskConical size={21}/> {t("Définition et cas de test")}</h2>
      <span className="test-pill">{t("TESTS PYTHON ISOLÉS")}</span>
    </div>
    <p className="studio-hint">{t("Déclare le nom de la fonction, les paramètres et le résultat attendu. Les valeurs sont enregistrées avec ton brouillon. Cette vérification contrôle")} <strong>{t("le format")}</strong>{t(", pas le résultat du code Python.")}</p>

    <div className="test-definition">
      <div className="test-definition-head">
        <label>Nom de la fonction Python
          <input spellCheck={false} placeholder={t("pgcd")} maxLength={64} value={entry} onChange={e => { onEntry(e.target.value); setShowReport(false); }}/>
        </label>
        <label>Type de retour
          <select value={returns} onChange={e => { onReturns(e.target.value as ValueType); setShowReport(false); }}>
            {valueTypes.map(t => <option key={t} value={t}>{translateValueType(t)} ({t})</option>)}
          </select>
        </label>
      </div>
      <div className="test-list-title"><strong>Paramètres ({parameters.length}/8)</strong>
        <button type="button" className="btn btn-muted" disabled={parameters.length >= 8} onClick={() => { onParameters([...parameters, { name: "", type: "int" }]); setShowReport(false); }}><Plus size={14}/> {t("Ajouter un paramètre")}</button>
      </div>
      {parameters.length === 0 && <p className="studio-hint">{t("Cette fonction ne reçoit aucun argument.")}</p>}
      {parameters.map((p, index) => <div className="test-param-row" key={index}>
        <span className="test-index">{index + 1}</span>
        <input aria-label={`Nom du paramètre ${index + 1}`} maxLength={64} value={p.name} placeholder={t("ex. a")} spellCheck={false} onChange={e => setParameter(index, "name", e.target.value)}/>
        <select aria-label={`Type du paramètre ${index + 1}`} value={p.type} onChange={e => setParameter(index, "type", e.target.value)}>
          {valueTypes.map(t => <option key={t} value={t}>{descriptions[t]}</option>)}
        </select>
        <button type="button" className="test-remove" aria-label={`Supprimer le paramètre ${index + 1}`} onClick={() => { onParameters(parameters.filter((_, i) => i !== index)); setShowReport(false); }}><Trash2 size={16}/></button>
      </div>)}
    </div>

    <div className="test-list-title test-list-spaced"><strong>Exemples à tester ({tests.length}/20)</strong>
      <button type="button" className="btn btn-muted" disabled={tests.length >= 20} onClick={() => {
        onTests([...tests, { id: newId(), label: `Test ${tests.length + 1}`, inputsText: "{}", expectedText: "0" }]);
        setShowReport(false);
      }}><Plus size={14}/> {t("Ajouter un test")}</button>
    </div>
    {tests.length === 0 && <p className="studio-hint">{t("Aucun test défini. Ajoute des exemples avant de soumettre ta méthode à la vérification Python (prochaine étape).")}</p>}
    <div className="test-case-grid">
      {tests.map((tc, index) => <article className="test-case" key={tc.id}>
        <div className="test-case-head"><span>Cas {index + 1}</span><button type="button" className="test-remove" aria-label={`Supprimer le test ${index + 1}`} onClick={() => { onTests(tests.filter((_, i) => i !== index)); setShowReport(false); }}><Trash2 size={16}/></button></div>
        <label>{t("Nom du test")}<input maxLength={100} value={tc.label} onChange={e => changeTest(index, "label", e.target.value)} placeholder={t("Ex. PGCD(24,18)")}/></label>
        <label>{t("Entrées (objet JSON)")}<textarea rows={3} spellCheck={false} value={tc.inputsText} onChange={e => changeTest(index, "inputsText", e.target.value)} placeholder='{"a":24,"b":18}'/></label>
        <label>{t("Résultat attendu (JSON)")}<textarea rows={2} spellCheck={false} value={tc.expectedText} onChange={e => changeTest(index, "expectedText", e.target.value)} placeholder="6"/></label>
        <p className="test-example">{t("Tableau :")} <code>[1,2,3]</code> {t("· Matrice :")} <code>[[1,2],[3,4]]</code></p>
      </article>)}
    </div>
    <div className="test-report-action">
      <button type="button" className="btn btn-primary" onClick={() => setShowReport(true)}><FlaskConical size={16}/> {t("Vérifier le format des tests")}</button>
      <button type="button" className="btn btn-muted" onClick={onRun} disabled={!canRun}>
        {running ? <FlaskConical size={16}/> : <PlayCircle size={16}/>}
        {running ? "Exécution isolée en cours…" : "Exécuter les tests Python"}
      </button>
      <span className="test-execution-note"><LockKeyhole size={15}/> {runHint}</span>
    </div>
    {running && <div className="python-run-progress" role="status" aria-label={t("Exécution Python sécurisée en cours")}>
      <span className="python-run-spinner" aria-hidden="true"/>
      <div><strong>{t("Exécution dans un sandbox sécurisé…")}</strong>
        <p>{t("Chaque lancement prépare un environnement isolé. Patiente pendant la vérification des tests.")}</p>
        {elapsedSeconds >= 20 && <p>{t("La préparation du sandbox peut prendre plusieurs secondes.")}</p>}
      </div>
      <strong className="python-run-elapsed" aria-hidden="true">{elapsedSeconds} s</strong>
    </div>}
    {runError && <div className="run-error" role="alert">{runError}</div>}
    {runResult && <section className="python-test-results" aria-live="polite">
      <h3>Résultats réels du sandbox {runResult.status === "passed" ? "— Tous les tests réussis" :
        runResult.status === "failed" ? "— Certains tests ont échoué" : "— Erreur d'exécution"}</h3>
      {runResult.error && <p className="preflight-bad">{runResult.error}</p>}
      {(typeof runResult.timings_ms?.total === "number" || typeof runResult.timings_ms?.sandbox === "number") && <div className="python-run-timings">
        {typeof runResult.timings_ms?.total === "number" &&
          <span>{t("Durée serveur :")} <strong>{(runResult.timings_ms.total / 1000).toFixed(1)} s</strong></span>}
        {typeof runResult.timings_ms.sandbox === "number" &&
          <span>{t("Sandbox :")} <strong>{(runResult.timings_ms.sandbox / 1000).toFixed(1)} s</strong></span>}
        {typeof runResult.timings_ms.modal_phases?.create === "number" &&
          <span>{t("Démarrage Modal :")} <strong>{(runResult.timings_ms.modal_phases.create / 1000).toFixed(1)} s</strong></span>}
        {typeof runResult.timings_ms.modal_phases?.execute === "number" &&
          <span>{t("Python :")} <strong>{(runResult.timings_ms.modal_phases.execute / 1000).toFixed(1)} s</strong></span>}
      </div>}
      <p className="studio-hint">{runResult.results.filter(r => r.passed).length}/{runResult.case_count} tests réussis. Résultats liés au brouillon enregistré, pas aux modifications non sauvegardées.</p>
      {runResult.results.map((item, i) => <div key={`${i}-${item.label}`} className="python-test-row">
        {item.passed ? <CheckCircle2 size={17} className="python-test-ok"/> : <AlertCircle size={17} className="python-test-fail"/>}
        <div><strong>{item.label}</strong><small>{item.error ? item.error :
          `Attendu : ${JSON.stringify(item.expected)} · Obtenu : ${JSON.stringify(item.actual)}`}</small></div>
      </div>)}
    </section>}
    {showReport && <div className="preflight-report" aria-live="polite">
      <h3>{t("Résultat de la vérification du format")}</h3>
      {report.errors.map((e, i) => <p key={`definition-${i}`} className="preflight-bad"><AlertCircle size={16}/> {e}</p>)}
      {report.cases.map(r => <p key={r.index} className={r.ok ? "preflight-good" : "preflight-bad"}>
        {r.ok ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} <strong>{r.label} :</strong> {r.message}
      </p>)}
      <p className="preflight-summary">{successful}/{tests.length} cas au format correct. <strong>{t("Aucun test Python n'a été exécuté et aucun cas n'est certifié réussi.")}</strong></p>
    </div>}
  </section>;
}
