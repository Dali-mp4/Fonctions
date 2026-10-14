import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
 sourceTeachingText,validateTranslation,localizePublishedMethods,
} from "../src/lib/revision-translation.ts";

const read=p=>readFileSync(p,"utf8");
const method={
 id:"f0000000-0000-4000-8000-000000000001",
 implementation_id:"f0000000-0000-4000-8000-000000000002",
 topic_slug:"pgcd",topic_title:"PGCD",topic_summary:"Un module avec PGCD(48, 18).",
 category:"Mathématiques",school_level:"3ème Info",method_type:"base",
 title:"PGCD avec Euclide",explanation:"Comprendre PGCD(48, 18) = 6.",pseudocode:"PGCD(48,18)",
 python_code:"def pgcd(a,b): return 6",entry_function:"pgcd",
 input_schema:{parameters:[{name:"a",type:"int"}]},test_cases:[{inputs:{a:48}}],
 reviewed_at:"2026-10-14T10:00:00Z",
 lesson_content:{principle:"PGCD(48, 18) = 6.",example:"PGCD(48, 18) = 6.",
  limits:"2 nombres strictement positifs.",sections:[
   {title:"Étape 1",note:"PGCD(48, 18)",python:"return 6",pseudocode:"Lire a et b"},
  ]},
};
const translated={
 topic_summary:"A module with PGCD(48, 18).",
 explanation:"Understand PGCD(48, 18) = 6.",
 principle:"PGCD(48, 18) = 6.",
 example:"PGCD(48, 18) = 6.",
 limits:"2 strictly positive numbers.",
 sections:[{title:"Step 1",note:"PGCD(48, 18)"}],
};

test("reviewed prose can be translated, but module names and code are immutable",()=>{
 assert.deepEqual(sourceTeachingText(method).sections,[{title:"Étape 1",note:"PGCD(48, 18)"}]);
 assert.equal(validateTranslation(method,translated),true);
 const [localized]=localizePublishedMethods([method],[{
  revision_id:method.id,locale:"en",status:"approved",content:translated,
 }],"en");
 assert.equal(localized.topic_title,method.topic_title);
 assert.equal(localized.title,method.title);
 assert.equal(localized.pseudocode,method.pseudocode);
 assert.equal(localized.python_code,method.python_code);
 assert.deepEqual(localized.input_schema,method.input_schema);
 assert.deepEqual(localized.test_cases,method.test_cases);
 assert.equal(localized.lesson_content.sections[0].pseudocode,method.lesson_content.sections[0].pseudocode);
 assert.equal(localized.lesson_content.sections[0].python,method.lesson_content.sections[0].python);
 assert.equal(localized.lesson_content.sections[0].title,"Step 1");
 assert.equal(localized.translation_locale,"en");
 assert.equal(method.translation_locale,undefined);
});
test("fallback when untranslated or mismatched locale",()=>{
 assert.equal(localizePublishedMethods([method],[],"ar")[0],method);
 assert.equal(localizePublishedMethods([method],[{revision_id:method.id,locale:"en",status:"approved",content:translated}],"ar")[0],method);
 assert.equal(localizePublishedMethods([method],[{revision_id:"f0000000-0000-4000-8000-000000000009",locale:"en",status:"approved",content:translated}],"en")[0],method);
});
test("AI translations with changed math, identifiers or injected executable content are rejected",()=>{
 assert.equal(validateTranslation(method,{...translated,example:"PGCD(48, 18) = 7."}),false);
 assert.equal(validateTranslation(method,{...translated,principle:"GCD(48, 18) = 6."}),false);
 assert.equal(validateTranslation(method,{...translated,sections:[]}),false);
 assert.equal(validateTranslation(method,{...translated,python_code:"return 0"}),false);
 assert.equal(validateTranslation(method,{...translated,sections:[{...translated.sections[0],python:"return 0"}]}),false);
 assert.equal(validateTranslation(method,{...translated,sections:[{title:"Step 2",note:"PGCD(48, 18)"}]}),false);
 assert.equal(validateTranslation(method,{...translated,limits:""}),false);
});
test("publication review remains distinct, access is restricted to approved translations",()=>{
 const migration=read("../supabase/migrations/011_reviewed_ai_translations.sql");
 const api=read("src/app/api/translations/generate/route.ts");
 const studio=read("src/components/studio-client.tsx");
 const review=read("src/components/reviewer-workspace.tsx");
 const catalog=read("src/lib/public-catalog-server.ts");
 const detail=read("src/app/algorithme/[slug]/page.tsx");
 assert.match(migration,/ENABLE ROW LEVEL SECURITY/);
 assert.match(migration,/status='approved'/);
 assert.match(migration,/published_revision_id=r.id/);
 assert.match(migration,/created_by=\(SELECT auth.uid\(\)\)/);
 assert.match(migration,/status='pending'/);
 assert.match(migration,/ON CONFLICT \(revision_id,locale\) DO NOTHING/);
 assert.match(api,/sb.auth.getUser\(\)/);
 assert.match(api,/current_role/);
 assert.match(api,/OPENAI_API_KEY/);
 assert.doesNotMatch(api,/NEXT_PUBLIC_OPENAI/);
 assert.match(api,/validateTranslation\(original,translation\)/);
 assert.match(studio,/TranslationReviewQueue/);
 assert.match(review,/\/api\/translations\/generate/);
 assert.match(catalog,/\.eq\("status","approved"\)/);
 assert.match(detail,/selected\?\.translation_locale!==locale/);
});
