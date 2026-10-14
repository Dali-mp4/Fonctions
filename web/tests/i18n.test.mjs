import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseLocale,tr,locales } from "../src/lib/translations.ts";
import { localizeLesson,isTranslatedLesson } from "../src/lib/lesson-translations.ts";

const read=p=>readFileSync(p,"utf8");
const originals=JSON.parse(read("src/data/seed-algorithms.json"));

test("French is the default with strict allowed locales",()=>{
 assert.deepEqual(locales,["fr","en","ar"]);
 for(const x of [undefined,null,"ru","fr_FR","../../en","","FR"])assert.equal(parseLocale(x),"fr");
 assert.equal(parseLocale("en"),"en");assert.equal(parseLocale("ar"),"ar");
 assert.equal(tr("fr","Mon compte"),"Mon compte");
 assert.equal(tr("en","Mon compte"),"My account");
 assert.equal(tr("ar","Mon compte"),"حسابي");
 assert.equal(tr("en","untranslated new label"),"untranslated new label");
});

test("all seven lessons have translated teaching prose, never modified code or runtime inputs",()=>{
 for(const locale of ["en","ar"]){
   for(const original of originals){
     const localized=localizeLesson(original,locale);
     assert.ok(isTranslatedLesson(original,locale),original.slug);
     assert.notEqual(localized.summary,original.summary);
     assert.notEqual(localized.principle,original.principle);
     assert.equal(localized.slug,original.slug);
     assert.equal(localized.method,original.method);
     assert.equal(localized.code_sections.length,original.code_sections.length);
     assert.equal(localized.inputs.length,original.inputs.length);
     for(let i=0;i<original.code_sections.length;i++){
       assert.equal(localized.code_sections[i].python,original.code_sections[i].python);
       assert.equal(localized.code_sections[i].pseudocode,original.code_sections[i].pseudocode);
     }
     for(let i=0;i<original.inputs.length;i++){
       assert.equal(localized.inputs[i].name,original.inputs[i].name);
       assert.equal(localized.inputs[i].kind,original.inputs[i].kind);
       assert.deepEqual(localized.inputs[i].default,original.inputs[i].default);
     }
   }
 }
 const submitted={...originals[0],slug:"other-approved",summary:"Authored text"};
 assert.deepEqual(localizeLesson(submitted,"en"),submitted);
 assert.deepEqual(localizeLesson(originals[0],"fr"),originals[0]);
});

test("locale persisted through cookie and RTL affects html but not code direction",()=>{
 const provider=read("src/components/language-provider.tsx");
 const layout=read("src/app/layout.tsx");
 const server=read("src/lib/server-locale.ts");
 const css=read("src/app/globals.css");
 assert.match(provider,/afj_locale=/);assert.match(provider,/Max-Age=31536000/);
 assert.match(provider,/window\.location\.reload\(\)/);
 assert.match(provider,/<option value="fr">Français<\/option>/);
 assert.match(provider,/<option value="en">English<\/option>/);
 assert.match(provider,/<option value="ar">العربية<\/option>/);
 assert.match(layout,/lang=\{locale\}/);
 assert.match(layout,/dir=\{locale==="ar"\?"rtl":"ltr"\}/);
 assert.match(layout,/LanguageProvider locale=\{locale\}/);
 assert.match(server,/cookies\(\)/);
 assert.match(css,/\[dir="rtl"\] pre/);
 assert.match(css,/direction:ltr/);
});

test("author-created modules remain in original published language absent reviewed translations",()=>{
 const detail=read("src/app/algorithme/[slug]/page.tsx");
 assert.match(detail,/!builtIn \|\| selected/);
 assert.match(detail,/Contenu pédagogique dans sa langue de publication/);
 assert.match(detail,/CommunityLessonTabs/);
 const lib=read("src/components/library-client.tsx");
 assert.match(lib,/localizeLesson\(a,locale\)/);
});

test("TABLEAU sorting remains a Base method with independently localized titles and unchanged source",()=>{
 const original={...originals.find(x=>x.slug==="tableau"),slug:"tableau-tri"};
 for(const locale of ["en","ar"]){
  const translated=localizeLesson(original,locale);
  assert.notEqual(translated.title,original.title);
  assert.equal(translated.slug,"tableau-tri");
  assert.deepEqual(translated.code_sections.map(s=>s.python),original.code_sections.map(s=>s.python));
 }
 assert.match(read("src/components/lesson-tabs.tsx"),/Le pseudo-code et les résultats du moteur/);
});
