import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { makeLessonContent, validateLessonContent } from "../src/lib/lesson-content.ts";
const read = p => readFileSync(p,"utf8");

test("original seven remain unchanged and are grouped into their school concepts", () => {
  const originals=JSON.parse(read("src/data/seed-algorithms.json"));
  assert.equal(originals.length,7);
  assert.equal(new Set(originals.map(x=>x.slug)).size,7);
  const lib=read("src/components/library-client.tsx");
  assert.match(lib,/filtered\.map\(a=><AlgorithmCard/);
  assert.doesNotMatch(lib,/filteredMethods\.map/);
  assert.match(lib,/counts\[a\.slug\]/);
  assert.match(read("src/app/algorithme/[slug]/page.tsx"),/CommunityLessonTabs/);
  assert.match(read("src/app/algorithme/[slug]/page.tsx"),/LessonTabs algorithm=\{a\}/);
});
test("same three tabs in community method experience, never execute contributor Python publicly",()=>{
  const s=read("src/components/community-lesson-tabs.tsx");
  for(const label of ["Essayer", "Comprendre", "Algorithme & Python"])assert.ok(s.includes(label));
  assert.doesNotMatch(s,/eval\(|new Function\(|\/api\/v1\/algorithms\/\$\{/);
  assert.match(s,/nouvelle exécution/);
  assert.match(read("src/app/methode/[id]/page.tsx"),/redirect\(`/);
  assert.match(read("src/app/methode/[id]/page.tsx"),/if\(!method\) notFound\(\)/);
});
test("a contributor can create a multi-section teaching lesson",()=>{
  const good=makeLessonContent("Euclide utilise la division entière pour calculer le PGCD.","PGCD(24, 18) = 6","Entrées entières positives.","Fonction PGCD","Retourner 6","def pgcd(a,b): return 6",[]);
  assert.deepEqual(validateLessonContent(good),[]);
  assert.equal(good.sections[0].python,"def pgcd(a,b): return 6");
  assert.ok(validateLessonContent({...good,principle:"a"}).length);
  assert.ok(validateLessonContent({...good,sections:[]}).length);
});
test("migration 007 preserves migration 006 and adds versioned content with review gates",()=>{
  const sql=read("../supabase/migrations/007_unified_lesson_methods.sql");
  assert.match(sql,/ADD COLUMN lesson_content jsonb/);
  assert.match(sql,/create_draft_lesson_with_contract/);
  assert.match(sql,/update_draft_lesson_with_contract/);
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.submit_revision/);
  assert.match(sql,/public\.revision_has_verified_tests/);
  assert.match(sql,/security_invoker=true/);
  assert.match(sql,/r\.id=i\.published_revision_id/);
  assert.match(sql,/r\.reviewer_id <> r\.created_by/);
  assert.match(sql,/p_lesson_content->'sections'->0->>'python' IS DISTINCT FROM p_python_code/);
  assert.match(sql,/IS DISTINCT FROM draft.python_code/);
  assert.doesNotMatch(sql,/GRANT (?:INSERT|UPDATE|DELETE) ON public\.published_methods/);
  const studio=read("src/components/studio-client.tsx");
  assert.match(studio,/p_lesson_content: lesson/);
  assert.match(studio,/makeLessonContent\(/);
  assert.match(read("src/components/reviewer-workspace.tsx"),/review-lesson-preview/);
});
