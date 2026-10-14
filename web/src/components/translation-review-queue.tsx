"use client";
import { useCallback, useEffect, useState } from "react";
import { Languages, RefreshCw, ShieldCheck, WandSparkles } from "lucide-react";
import { browserSupabase } from "@/lib/supabase-browser";
import { useLocale } from "@/components/language-provider";
import { sourceTeachingText, validateTranslation, type TranslationText } from "@/lib/revision-translation";
import type { MethodRecord } from "@/lib/public-catalog-model";

type Row={
 revision_id:string;locale:"en"|"ar";status:"queued"|"pending"|"approved";
 content:TranslationText|null;updated_at:string;
};
type Copy={
 heading:string;description:string;refresh:string;empty:string;generate:string;
 approve:string;pending:string;queued:string;original:string;translation:string;
 note:string;fail:string;approved:string;fields:Record<string,string>;
};
const strings:Record<"fr"|"en"|"ar",Copy>={
 fr:{heading:"Traductions à vérifier",description:"L'original français reste publié. Les traductions ne deviennent visibles qu'après validation indépendante.",refresh:"Actualiser",empty:"Aucune traduction en attente.",generate:"Générer avec l'IA",approve:"Valider cette langue",pending:"À relire",queued:"En attente de génération",original:"Français original",translation:"Traduction modifiable",note:"Les noms des modules, le Python et le pseudo-code ne sont jamais traduits.",fail:"La traduction a échoué. Réessaie ou vérifie la configuration du serveur.",approved:"Traduction validée.",fields:{topic_summary:"Résumé du chapitre",explanation:"Description",principle:"Principe",example:"Exemple",limits:"Limites",title:"Titre de la section",note:"Note pédagogique"}},
 en:{heading:"Translations to review",description:"French stays published. Translations appear only after an independent reviewer approves them.",refresh:"Refresh",empty:"No translations pending.",generate:"Generate with AI",approve:"Approve this language",pending:"Needs review",queued:"Awaiting generation",original:"Original French",translation:"Editable translation",note:"Module names, Python, and pseudocode are never translated.",fail:"Translation failed. Retry or check server settings.",approved:"Translation approved.",fields:{topic_summary:"Chapter summary",explanation:"Description",principle:"Principle",example:"Example",limits:"Limits",title:"Section title",note:"Teaching note"}},
 ar:{heading:"مراجعة الترجمات",description:"النسخة الفرنسية تبقى منشورة. الترجمة ما تظهرش كان بعد ما يوافق عليها مراجع مستقل.",refresh:"جدّد",empty:"ما فمّاش ترجمات تستنّى المراجعة.",generate:"ترجم بالذكاء الاصطناعي",approve:"وافق على الترجمة",pending:"تستنّى المراجعة",queued:"تستنّى الترجمة",original:"الفرنسية الأصلية",translation:"الترجمة تنجّم تعدّلها",note:"أسامي الموديولات وكود Python والـ pseudo-code يبقاو كيف ما هما.",fail:"الترجمة ما نجحتش. عاود جرّب أو ثبّت إعدادات السيرفر.",approved:"تمّت الموافقة على الترجمة.",fields:{topic_summary:"ملخّص الدرس",explanation:"الوصف",principle:"الفكرة",example:"مثال",limits:"الحدود",title:"عنوان الجزء",note:"ملاحظة الشرح"}}
};
const mainFields=["topic_summary","explanation","principle","example","limits"] as const;
const rowKey=(r:Row)=>r.revision_id+":"+r.locale;

export function TranslationReviewQueue(){
 const locale=useLocale(),copy=strings[locale];
 const [rows,setRows]=useState<Row[]>([]);
 const [methods,setMethods]=useState<Record<string,MethodRecord>>({});
 const [drafts,setDrafts]=useState<Record<string,TranslationText>>({});
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState("");
 const [message,setMessage]=useState(""),[error,setError]=useState("");
 const refresh=useCallback(async()=>{
  const sb=browserSupabase();if(!sb)return;
  setLoading(true);
  const {data,error:e}=await sb.from("revision_translations")
   .select("revision_id,locale,status,content,updated_at")
   .in("status",["queued","pending"]).order("updated_at",{ascending:false}).limit(100);
  if(e){setError(e.message);setLoading(false);return;}
  const available=(data??[]) as Row[];
  const ids=[...new Set(available.map(x=>x.revision_id))];
  const result=ids.length
   ? await sb.from("published_methods").select("*").in("id",ids)
   : {data:[],error:null};
  if(result.error){setError(result.error.message);setLoading(false);return;}
  const lookup=Object.fromEntries(((result.data??[]) as MethodRecord[]).map(m=>[m.id,m]));
  const visible=available.filter(r=>Boolean(lookup[r.revision_id]));
  setRows(visible);setMethods(lookup);
  setDrafts(Object.fromEntries(visible.filter(r=>r.status==="pending"&&r.content)
   .map(r=>[rowKey(r),r.content as TranslationText])));
  setLoading(false);
 },[]);
 useEffect(()=>{void refresh();},[refresh]);

 async function generate(r:Row){
  const key=rowKey(r);setBusy(key);setError("");setMessage("");
  try{
   const response=await fetch("/api/translations/generate",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({revision_id:r.revision_id,locale:r.locale}),
   });
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||copy.fail);
   setMessage(copy.pending);
   await refresh();
  }catch(e){setError(e instanceof Error?e.message:copy.fail);}
  finally{setBusy("");}
 }
 async function approve(r:Row,m:MethodRecord){
  const key=rowKey(r),content=drafts[key];
  if(!validateTranslation(m,content)){
   setError("Translation must keep all numbers, technical identifiers and section count unchanged.");
   return;
  }
  const sb=browserSupabase();if(!sb)return;
  setBusy(key);setError("");setMessage("");
  const {error:e}=await sb.rpc("approve_reviewed_translation",{
   p_revision:r.revision_id,p_locale:r.locale,p_content:content,
  });
  if(e)setError(e.message);else{setMessage(copy.approved);await refresh();}
  setBusy("");
 }
 function editField(r:Row,key:typeof mainFields[number],value:string){
  const id=rowKey(r);
  setDrafts(old=>({...old,[id]:{...old[id],[key]:value}}));
 }
 function editSection(r:Row,index:number,key:"title"|"note",value:string){
  const id=rowKey(r);
  setDrafts(old=>({...old,[id]:{
   ...old[id],sections:old[id].sections.map((s,i)=>i===index?{...s,[key]:value}:s),
  }}));
 }
 return <section className="workspace-section translation-review" aria-labelledby="translation-review-title">
  <div className="studio-panel-head">
   <h2 id="translation-review-title"><Languages size={21}/>{copy.heading}</h2>
   <button type="button" className="btn btn-muted" disabled={loading||Boolean(busy)}
    onClick={()=>void refresh()}><RefreshCw size={15}/>{copy.refresh}</button>
  </div>
  <p className="studio-hint">{copy.description} {copy.note}</p>
  {error&&<p className="run-error" role="alert">{error}</p>}
  {message&&<p className="success-strip" role="status">{message}</p>}
  {loading?<p className="studio-hint">…</p>:!rows.length?<p className="studio-empty">{copy.empty}</p>:
   <div className="review-grid">{rows.map(r=>{
    const m=methods[r.revision_id],key=rowKey(r),original=sourceTeachingText(m);
    const draft=drafts[key];
    return <article className="review-card translation-card" key={key}>
     <div className="translation-head">
      <div><h3>{m.topic_title} · {m.title}</h3><small>{r.locale==="en"?"English":"تونسي"} · {r.status==="queued"?copy.queued:copy.pending}</small></div>
      {r.status==="queued"&&<button className="btn btn-muted" type="button" disabled={Boolean(busy)}
       onClick={()=>void generate(r)}><WandSparkles size={15}/>{busy===key?"…":copy.generate}</button>}
     </div>
     {r.status==="pending"&&draft&&<>
      {mainFields.map(field=><div className="translation-pair" key={field}>
       <strong>{copy.fields[field]}</strong>
       <div className="translation-columns">
        <label><span>{copy.original}</span><div className="translation-source">{original[field]||"—"}</div></label>
        <label><span>{copy.translation}</span><textarea dir={r.locale==="ar"?"rtl":"ltr"} rows={Math.max(2,Math.min(6,(draft[field].length/75)|0))}
         value={draft[field]} maxLength={field==="explanation"?20000:field==="principle"?5000:field==="example"?1000:field==="limits"?2000:500}
         onChange={e=>editField(r,field,e.target.value)}/></label>
       </div>
      </div>)}
      {original.sections.map((sec,i)=><div className="translation-pair" key={i}>
       <strong>{copy.fields.title} {i+1}</strong>
       <div className="translation-columns">
        <label><span>{copy.original}</span><div className="translation-source">{sec.title}</div></label>
        <label><span>{copy.translation}</span><input dir={r.locale==="ar"?"rtl":"ltr"} value={draft.sections[i]?.title??""}
         maxLength={160} onChange={e=>editSection(r,i,"title",e.target.value)}/></label>
       </div>
       <strong>{copy.fields.note}</strong>
       <div className="translation-columns">
        <label><span>{copy.original}</span><div className="translation-source">{sec.note||"—"}</div></label>
        <label><span>{copy.translation}</span><textarea dir={r.locale==="ar"?"rtl":"ltr"} rows={2}
         value={draft.sections[i]?.note??""} maxLength={1500}
         onChange={e=>editSection(r,i,"note",e.target.value)}/></label>
       </div>
      </div>)}
      <button className="btn btn-primary" disabled={Boolean(busy)||!validateTranslation(m,draft)}
       onClick={()=>void approve(r,m)}><ShieldCheck size={16}/>{busy===key?"…":copy.approve}</button>
     </>}
    </article>;
   })}</div>}
 </section>;
}
