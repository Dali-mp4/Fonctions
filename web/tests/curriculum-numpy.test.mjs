import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read=(p)=>readFileSync(p,"utf8");
const group=read("../supabase/migrations/017_group_3eme_algorithms.sql");
const numpy=read("../supabase/migrations/018_numpy_tri_drafts.sql");
const studio=read("src/components/studio-client.tsx");
const lessons=JSON.parse(read("src/data/seed-algorithms.json"));

function jsonBetween(src,marker){
  const from="$"+marker+"$";
  const first=src.indexOf(from);
  assert.ok(first>=0,marker+" starts");
  const end=src.indexOf(from,first+from.length);
  assert.ok(end>first,marker+" ends");
  return JSON.parse(src.slice(first+from.length,end));
}

test("school algorithms are grouped by chapter rather than each implementation being a chapter",()=>{
  const moves=jsonBetween(group,"moves");
  const move=(slug)=>moves.find(r=>r.src===slug)?.dst;
  for(const s of ["compter-voyelles","occurrences-caractere","palindrome-chaine"])
    assert.equal(move(s),"chaines");
  for(const s of ["maximum-tableau","recherche-sequentielle","recherche-dichotomique"])
    assert.equal(move(s),"tableau");
  assert.equal(move("matrice-diagonale"),"matrice");
  assert.equal(move("tri-selection"),"tri");
  assert.equal(move("tri-bulles"),"tri");
  assert.match(studio,/studio-chapter-groups/);
  assert.match(studio,/studio-chapter-group/);
});

test("all four sorting draft methods are NumPy with 2D indexing for matrices",()=>{
  const changes=jsonBetween(numpy,"edits");
  const matrix=jsonBetween(numpy,"matrixsorts");
  const old=changes.filter(x=>["tri_selection","tri_bulles"].includes(x.entry));
  assert.equal(old.length,2);
  assert.deepEqual(matrix.map(x=>x.entry).sort(),["tri_bulles_matrice","tri_selection_matrice"]);
  for(const rec of [...old,...matrix]){
    assert.match(rec.code,/from numpy import array/);
    assert.match(rec.code,/\.tolist\(\)/);
    assert.doesNotMatch(rec.code,/\.sort\(|sorted\(/);
  }
  for(const rec of matrix){
    assert.match(rec.code,/M\[.*?,.*?\]/);
    assert.equal(rec.tests.length,3);
    assert.ok(rec.tests.some(x=>Array.isArray(x.expected)&&x.expected.length===0));
  }
});

test("NumPy rewrites invalidate old sandbox evidence and do not edit approved versions",()=>{
  assert.match(numpy,/test_status='not_run',test_evidence='\{\}'::jsonb/);
  assert.match(numpy,/status IN \('draft','submitted','changes_requested'\)/);
  assert.match(numpy,/status='published'/);
  assert.match(numpy,/requires_new_review/);
  assert.match(numpy,/curriculum_numpy_updated/);
});

test("the former TABLEAU selection-sort route and lesson were removed",()=>{
  assert.equal(lessons.length,7);
  assert.equal(existsSync("src/lib/tableau-tri.ts"),false);
  assert.doesNotMatch(read("src/app/algorithme/[slug]/page.tsx"),/tableau-tri/);
  assert.doesNotMatch(read("../api/app/main.py"),/tableau-tri/);
  for(const slug of ["matrice","tableau"]){
    const s=lessons.find(x=>x.slug===slug);
    assert.match(s.example,/array\(/);
    assert.match(s.code_sections[0].python,/from numpy import array/);
  }
});
