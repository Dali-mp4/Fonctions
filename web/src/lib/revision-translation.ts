import type { MethodRecord } from "./public-catalog-model";

export type TranslationLocale = "en" | "ar";
export type TranslationText = {
  topic_summary: string;
  explanation: string;
  principle: string;
  example: string;
  limits: string;
  sections: { title: string; note: string }[];
};
export type ApprovedTranslation = {
  revision_id: string;
  locale: TranslationLocale;
  status: "approved";
  content: TranslationText;
};

const fields = ["topic_summary","explanation","principle","example","limits"] as const;
const sourceNumbers = (s:string) => (s.match(/\d+(?:[.,]\d+)*/g) ?? []).sort();
const sourceIdentifiers = (s:string) => (s.match(/\b[A-Z][A-Z0-9_]{2,}\b/g) ?? []).sort();
const same = (a:string[],b:string[]) => JSON.stringify(a)===JSON.stringify(b);
const typed = (value:unknown,max:number) => typeof value==="string" && value.length<=max;
const sourceField = (m:MethodRecord,key:typeof fields[number]):string => {
  if(key==="topic_summary")return m.topic_summary??"";
  if(key==="explanation")return m.explanation;
  return m.lesson_content?.[key]??"";
};

/** Accept only translated prose. Code, runtime contracts and module names never enter the payload. */
export function sourceTeachingText(m:MethodRecord):TranslationText {
  return {
    topic_summary:m.topic_summary??"",
    explanation:m.explanation,
    principle:m.lesson_content?.principle??m.explanation,
    example:m.lesson_content?.example??"",
    limits:m.lesson_content?.limits??"",
    sections:(m.lesson_content?.sections??[]).map(s=>({title:s.title,note:s.note})),
  };
}

/** Refuse changed examples, numbers, function tokens, or section count. */
export function validateTranslation(m:MethodRecord,raw:unknown):raw is TranslationText {
  if(!raw || typeof raw!=="object" || Array.isArray(raw))return false;
  const data=raw as Record<string,unknown>;
  if(Object.keys(data).sort().join(",") !== [...fields,"sections"].sort().join(","))return false;
  if(!typed(data.topic_summary,500)||!typed(data.explanation,20000)||
     !typed(data.principle,5000)||!typed(data.example,1000)||!typed(data.limits,2000))return false;
  const source=sourceTeachingText(m);
  if(JSON.stringify(data).length>30000)return false;
  for(const key of fields){
    const target=data[key] as string;
    const original=source[key];
    if(original.trim()&&!target.trim())return false;
    if(!same(sourceNumbers(original),sourceNumbers(target)))return false;
    if(!same(sourceIdentifiers(original),sourceIdentifiers(target)))return false;
  }
  if(!Array.isArray(data.sections)||data.sections.length!==source.sections.length)return false;
  for(let i=0;i<source.sections.length;i++){
    const row=data.sections[i];
    if(!row || typeof row!=="object"||Array.isArray(row))return false;
    if(Object.keys(row).sort().join(",")!=="note,title")return false;
    if(!typed(row.title,160)||!typed(row.note,1500))return false;
    if(!row.title.trim()||(source.sections[i].note.trim()&&!row.note.trim()))return false;
    for(const k of ["title","note"] as const){
      if(!same(sourceNumbers(source.sections[i][k]),sourceNumbers(row[k])) ||
         !same(sourceIdentifiers(source.sections[i][k]),sourceIdentifiers(row[k])))return false;
    }
  }
  return true;
}

/** Localize only approved explanatory text; never touch code, input schemas or names. */
export function localizePublishedMethods(
 methods:MethodRecord[], translations:ApprovedTranslation[],locale:TranslationLocale
):MethodRecord[] {
 const rows=new Map(translations.filter(t=>t.status==="approved"&&t.locale===locale)
  .map(t=>[t.revision_id,t.content]));
 return methods.map(m=>{
  const content=rows.get(m.id);
  if(!content || !validateTranslation(m,content))return m;
  return {
   ...m,topic_summary:content.topic_summary||m.topic_summary,
   explanation:content.explanation,
   translation_locale:locale,
   lesson_content:m.lesson_content?{
    ...m.lesson_content,principle:content.principle,example:content.example,limits:content.limits,
    sections:m.lesson_content.sections.map((s,i)=>({
      ...s,title:content.sections[i].title,note:content.sections[i].note,
    })),
   }:m.lesson_content,
  };
 });
}
