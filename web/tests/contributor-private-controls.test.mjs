import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(p,"utf8");
const initial=read("../supabase/migrations/023_contributor_reviewer_private_content.sql");
const fix=read("../supabase/migrations/024_private_content_security_fix.sql");
const studio=read("src/components/studio-client.tsx");
const chapter=read("src/components/content-management.tsx");

test("creators and reviewers use dedicated self-service RPCs; owner keeps admin RPCs",()=>{
  assert.match(fix,/CREATE OR REPLACE FUNCTION public\.delete_own_private_implementation/);
  assert.match(fix,/CREATE OR REPLACE FUNCTION public\.rename_own_private_chapter/);
  assert.match(fix,/role_name IS NULL OR role_name NOT IN \('contributor','reviewer','owner'\)/);
  assert.match(fix,/actor uuid := \(SELECT auth\.uid\(\)\)/);
  assert.match(fix,/item\.created_by<>actor/);
  assert.match(fix,/chapter\.created_by IS DISTINCT FROM actor/);
  assert.match(fix,/chapter\.state<>'pending'/);
  assert.match(fix,/p_confirmation IS DISTINCT FROM 'SUPPRIMER'/);
  assert.match(studio,/isOwner \? "owner_delete_implementation" : "delete_own_private_implementation"/);
  assert.match(chapter,/role==="owner" \? "owner_rename_module" : "rename_own_private_chapter"/);
});

test("a withdrawn publication is never a deletable private implementation",()=>{
  assert.match(fix,/item\.archived_at IS NOT NULL/);
  assert.match(fix,/item\.published_revision_id IS NOT NULL/);
  assert.match(fix,/status NOT IN \('draft','changes_requested','submitted'\)/);
  assert.match(fix,/created_by<>actor/);
  assert.match(fix,/public\.public_method_runs/);
  assert.match(studio,/\["archived","published"\]\.includes\(other\.status\)/);
  assert.match(studio,/d\.implementations\.published_revision_id === null/);
  assert.match(initial,/SECURITY DEFINER SET search_path = ''/);
});

test("self-service does not allow arbitrary writes, anonymous execution or other-user chapter deletion",()=>{
  for(const fn of ["delete_own_private_implementation","rename_own_private_chapter"]){
    assert.match(fix,new RegExp("REVOKE ALL ON FUNCTION public\\."+fn));
    assert.match(fix,new RegExp("GRANT EXECUTE ON FUNCTION public\\."+fn));
  }
  assert.doesNotMatch(fix,/GRANT (INSERT|DELETE|UPDATE) ON TABLE/);
  assert.match(fix,/chapter\.created_by=actor AND chapter\.state='pending'/);
  assert.match(fix,/NOT EXISTS \(SELECT 1 FROM public\.legacy_lessons/);
  assert.match(fix,/NOT EXISTS \(SELECT 1 FROM public\.implementations WHERE topic_id=chapter\.id\)/);
  assert.match(fix,/target_topic uuid/);
  assert.match(fix,/public\.audit_events/);
});

test("chapter controls are available to both roles while published chapters stay protected",()=>{
  assert.match(studio,/\["contributor","reviewer","owner"\]\.includes\(role\)/);
  assert.match(studio,/<ContentManagement userId=\{userId\} role=\{role\}/);
  assert.match(chapter,/query\.eq\("created_by",userId\)\.eq\("state","pending"\)/);
  assert.match(chapter,/module\.created_by===userId && module\.state==="pending"/);
  assert.match(chapter,/Renommer mes chapitres privés/);
  assert.match(chapter,/originalSlugs\.has\(module\.slug\)/);
  assert.match(studio,/className="draft-card-delete"/);
});
