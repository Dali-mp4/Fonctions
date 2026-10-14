"use client";
import { useState } from "react";
import { BookOpenText, Code2, Copy, Play, Terminal, Check, ChevronDown } from "lucide-react";
import type { Algorithm } from "@/lib/catalog";
import { ResultDisplay } from "@/components/result-display";

type Response = { value: unknown; steps: string[]; note: string };
const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function initialValue(field: Algorithm["inputs"][number]): string {
  if (field.kind === "matrix" && typeof field.default === "string") return field.default;
  if (field.kind === "records" && Array.isArray(field.default)) return (field.default as string[][]).map(([name,type,val])=>`${name};${type};${val}`).join("\n");
  return String(field.default ?? "");
}
function parseField(field: Algorithm["inputs"][number], raw: string): unknown {
  if (field.kind === "int" || field.kind === "float") {
    if (raw.trim()==="" || !Number.isFinite(Number(raw)) || (field.kind === "int" && !Number.isInteger(Number(raw)))) throw new Error("Valeur numérique invalide : "+field.label);
    return Number(raw);
  }
  if (field.kind === "int_list") {
    const vals=raw.split(",").map(x=>Number(x.trim()));
    if(!raw.trim()||vals.some(x=>!Number.isInteger(x)))throw new Error("Sépare les entiers par des virgules.");return vals;
  }
  if (field.kind === "matrix") {
    const rows=raw.trim().split(/\n/).map(line=>line.trim().split(",").map(x=>Number(x.trim())));
    if(rows.some(row=>row.some(x=>!Number.isInteger(x))))throw new Error("Entre une matrice d'entiers, une ligne par rangée.");return rows;
  }
  if (field.kind === "records") {
    const rows=raw.trim().split(/\n/).map(line=>line.split(";"));
    if(rows.some(row=>row.length!==3))throw new Error("Format : nom;type;valeur — une ligne par champ.");
    return rows.map(([nom,type,valeur])=>({nom:nom.trim(),type:type.trim(),valeur:valeur.trim()}));
  }
  return raw;
}

export function LessonTabs({algorithm:a}:{algorithm:Algorithm}){
 const [tab,setTab]=useState<"essayer"|"comprendre"|"code">("essayer");
 const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(a.inputs.map(f=>[f.name,initialValue(f)])));
 const [result,setResult]=useState<Response|null>(null);const [runSorted,setRunSorted]=useState(false);const [error,setError]=useState("");const [running,setRunning]=useState(false);const [copied,setCopied]=useState("");
 async function run(){setRunning(true);setError("");setResult(null);try{
   const inputs=Object.fromEntries(a.inputs.map(field=>[field.name,parseField(field,values[field.name]??"")]));
   const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
   let response:Response;
   try{const res=await fetch(`${API}/api/v1/algorithms/${encodeURIComponent(a.slug)}/run`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({inputs}),signal:controller.signal});const body=await res.json();if(!res.ok)throw new Error(typeof body.detail==="string"?body.detail:"Valeurs non acceptées.");response=body;}finally{clearTimeout(timer)}
   setRunSorted(a.slug==="tableau-tri");setResult(response);
 }catch(e){setError(e instanceof TypeError?"Le serveur Python ne répond pas. Vérifie que FastAPI est démarré sur le port 8000.":e instanceof Error?e.message:"Erreur inconnue.");}finally{setRunning(false)}}
 async function copy(text:string,key:string){try{await navigator.clipboard.writeText(text);setCopied(key);setTimeout(()=>setCopied(""),1600);}catch{/* Clipboard may be disabled */}}
 return <div className="lesson-tabs"><div className="tab-bar" role="tablist" aria-label="Onglets du module"><button role="tab" aria-selected={tab==="essayer"} className={tab==="essayer"?"selected":""} onClick={()=>setTab("essayer")}><Play size={17}/> Essayer</button><button role="tab" aria-selected={tab==="comprendre"} className={tab==="comprendre"?"selected":""} onClick={()=>setTab("comprendre")}><BookOpenText size={17}/> Comprendre</button><button role="tab" aria-selected={tab==="code"} className={tab==="code"?"selected":""} onClick={()=>setTab("code")}><Code2 size={17}/> Algorithme & Python</button></div>
 {tab==="essayer"&&<section className="tab-body" role="tabpanel"><div className="workspace-grid"><div className="panel"><div className="panel-title"><Terminal size={18}/> Paramètres d&apos;entrée</div><p>{a.slug==="tableau"?"Remplis le tableau et affiche ses valeurs. Le tri est un exercice facultatif.":a.slug==="matrice"?"Remplis la matrice ligne par ligne pour observer ses cases et ses indices.":"Modifie les valeurs pour observer le comportement de la fonction."}</p><form onSubmit={e=>{e.preventDefault();void run();}} className="run-form">{a.inputs.map(f=><label key={f.name}><span>{f.label}</span>{f.kind==="choice"?<select value={values[f.name]} onChange={e=>setValues(v=>({...v,[f.name]:e.target.value}))}>{f.options.map(o=><option key={o}>{o}</option>)}</select>:f.kind==="matrix"||f.kind==="records"||f.kind==="int_list"?<textarea rows={f.kind==="matrix"?4:3} value={values[f.name]} onChange={e=>setValues(v=>({...v,[f.name]:e.target.value}))}/>:<input type={f.kind==="int"||f.kind==="float"?"number":"text"} step={f.kind==="int"?"1":"any"} value={values[f.name]} onChange={e=>setValues(v=>({...v,[f.name]:e.target.value}))}/>}<small>{f.hint || (f.kind==="records"?"Une ligne par champ : nom;type;valeur":"")}</small></label>)}<button className="btn btn-primary run-button" disabled={running}>{running?"Exécution...":"Exécuter l'algorithme"}<Play size={16}/></button></form></div><div className="panel output-panel"><div className="panel-title"><Terminal size={18}/> Résultat de l&apos;exécution</div>{error?<div className="run-error" role="alert">{error}</div>:result?<><div className="result-success"><span>EXÉCUTION RÉUSSIE</span><ResultDisplay slug={a.slug} value={result.value} sorted={runSorted}/></div>{result.note&&<p className="result-note">{result.note}</p>}<details className="trace-details" open><summary>Voir les étapes <ChevronDown size={15}/></summary><ol>{result.steps.map((s,i)=><li key={i}>{s}</li>)}</ol></details></>:<div className="result-idle"><span className="idle-icon"><Play size={23}/></span><strong>Prêt à tester ?</strong><p>Entre tes valeurs et lance l&apos;exécution. Le résultat apparaîtra ici.</p></div>}</div></div></section>}
 {tab==="comprendre"&&<section className="tab-body" role="tabpanel"><div className="explainer"><span className="section-kicker">LE PRINCIPE</span><h2>Comment fonctionne {a.name} ?</h2><p>{a.principle}</p><div className="explain-example"><strong>EXEMPLE</strong><span>{a.example}</span></div>{a.limits&&<div className="explain-note"><strong>À RETENIR</strong><p>{a.limits}</p></div>}</div></section>}
 {tab==="code"&&<section className="tab-body" role="tabpanel"><div className="code-intro"><h2>Du pseudo-code au Python.</h2><p>Explore les étapes et comprends le raisonnement de cette méthode.</p></div><div className="sections-list">{a.code_sections.map((sec,i)=><details className="code-section" key={`${sec.title}-${i}`} open={i===0}><summary><span><small>{String(i+1).padStart(2,"0")}</small> {sec.title}</span><ChevronDown size={20}/></summary><div className="code-columns"><div><div className="snippet-title"><span>ALGORITHME / PSEUDO-CODE</span><button onClick={()=>void copy(sec.pseudocode,`pseudo-${i}`)} aria-label="Copier le pseudo-code">{copied===`pseudo-${i}`?<Check size={16}/>:<Copy size={16}/>}</button></div><pre><code>{sec.pseudocode}</code></pre></div><div><div className="snippet-title"><span>PYTHON</span><button onClick={()=>void copy(sec.python,`python-${i}`)} aria-label="Copier le code Python">{copied===`python-${i}`?<Check size={16}/>:<Copy size={16}/>}</button></div><pre><code>{sec.python}</code></pre></div></div>{sec.note&&<p className="snippet-note">{sec.note}</p>}</details>)}</div></section>}
 </div>
}
