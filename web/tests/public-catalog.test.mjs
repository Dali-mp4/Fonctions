import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mergeOriginalLessons, selectPublishedMethods, withApprovedChapters } from "../src/lib/public-catalog-model.ts";
const read=(p)=>readFileSync(p,"utf8");
const seed=JSON.parse(read("src/data/seed-algorithms.json"));

test("seven teaching modules preserve full TDNT/TDOG and classroom Python",()=>{
  assert.equal(seed.length,7);
  const merged=mergeOriginalLessons(seed,[]);
  assert.deepEqual(merged,seed);
  const row={slug:"pgcd",payload:{...seed.find(x=>x.slug==="pgcd"),title:"DB version"}};
  const updated=mergeOriginalLessons(seed,[row,{slug:"new-unreviewed",payload:{...seed[0],slug:"new-unreviewed"}}]);
  assert.equal(updated.length,7);
  assert.equal(updated.find(x=>x.slug==="pgcd").title,"DB version");
  assert.ok(seed.some(x=>x.code_sections.some(sec=>sec.pseudocode.includes("TDNT"))));
});
test("published model refuses private/malformed rows",()=>{
  assert.deepEqual(selectPublishedMethods(null),[]);
  assert.deepEqual(selectPublishedMethods([{id:"not-uuid",title:"Draft",topic_slug:"pgcd"}]),[]);
  assert.equal(selectPublishedMethods([{id:"5eb33ae3-3d68-4af5-bce0-63e1e3727b72",topic_slug:"pgcd",topic_title:"PGCD",category:"Mathématiques",method_type:"advanced",title:"Euclide",explanation:"Explanation",pseudocode:"algo",python_code:"code",reviewed_at:"2026-10-14T00:00:00Z"}]).length,1);
});
test("SQL catalog is anonymous read-only and maps only approved, independently-reviewed active revisions",()=>{
  const sql=read("../supabase/migrations/006_published_catalog.sql");
  assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
  assert.match(sql,/FOR SELECT TO anon, authenticated/);
  assert.match(sql,/security_invoker = true/);
  assert.match(sql,/r\.id = i\.published_revision_id/);
  assert.match(sql,/r\.status = 'published'/);
  assert.match(sql,/r\.test_status = 'passed'/);
  assert.match(sql,/r\.reviewer_id <> r\.created_by/);
  assert.match(sql,/GRANT SELECT ON public\.published_methods TO anon, authenticated/);
  assert.doesNotMatch(sql,/GRANT (?:INSERT|UPDATE|DELETE) ON public\.(?:published_methods|legacy_lessons) TO anon/);
  assert.equal((sql.match(/\$afjlesson\$/g)||[]).length,14);
});
test("public route never runs contributed Python and withdrawn methods 404",()=>{
  const detail=read("src/app/methode/[id]/page.tsx");
  const server=read("src/lib/public-catalog-server.ts");
  const algo=read("src/app/algorithme/[slug]/page.tsx");
  assert.match(detail,/if\(!method\) notFound\(\)/);
  assert.doesNotMatch(detail,/\/api\/v1\/algorithms\/.*\/run/);
  assert.match(server,/published_methods/);
  assert.match(server,/persistSession: false/);
  assert.match(server,/cache: "no-store"/);
  assert.match(algo,/LessonTabs algorithm=\{a\}/);
});


test("new concept appears only after its active approved method is in public view",()=>{
 const base=seed;
 const entry={id:"5eb33ae3-3d68-4af5-bce0-63e1e3727b72",
 topic_slug:"recherche-binaire",topic_title:"Recherche binaire",category:"Algorithmique",
 school_level:"3ème Info",method_type:"base",title:"Recherche dichotomique",
 explanation:"Rechercher dans un tableau trié.",pseudocode:"rechercher",
 python_code:"def recherche(t,x): return False",reviewed_at:"2026-10-14T00:00:00Z",
 topic_summary:"Chercher un élément par division successive.",lesson_content:null};
 const methods=selectPublishedMethods([entry]);
 const catalog=withApprovedChapters(base,methods);
 assert.equal(catalog.length,8);
 assert.equal(catalog.at(-1).slug,"recherche-binaire");
 assert.deepEqual(withApprovedChapters(base,[]),base);
});
