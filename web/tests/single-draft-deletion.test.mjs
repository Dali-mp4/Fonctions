import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(p,"utf8");
const sql=read("../supabase/migrations/014_delete_single_draft_revision.sql");
const studio=read("src/components/studio-client.tsx");

test("single revision purge is strictly owner-only, confirmed, and draft-only",()=>{
  assert.match(sql,/CREATE FUNCTION public\.owner_delete_draft_revision/);
  assert.match(sql,/current_role\(\) <> 'owner'/);
  assert.match(sql,/p_confirmation IS DISTINCT FROM 'SUPPRIMER'/);
  assert.match(sql,/item\.status <> 'draft'/);
  assert.match(sql,/item\.edit_seq IS DISTINCT FROM p_expected_edit_seq/);
  assert.match(sql,/impl\.published_revision_id IS NOT DISTINCT FROM p_revision/);
  assert.match(sql,/id<>p_revision/);
  assert.match(sql,/IF remaining_count=0 THEN/);
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.owner_delete_draft_revision/);
});
test("deletes only the chosen revision and its dependent evidence; not implementation or module",()=>{
  assert.match(sql,/DELETE FROM public\.audit_events WHERE revision_id=p_revision/);
  assert.match(sql,/DELETE FROM public\.draft_test_runs WHERE revision_id=p_revision/);
  assert.match(sql,/DELETE FROM public\.public_method_runs WHERE revision_id=p_revision/);
  assert.match(sql,/DELETE FROM public\.revisions WHERE id=p_revision/);
  assert.doesNotMatch(sql,/DELETE FROM public\.implementations/);
  assert.doesNotMatch(sql,/DELETE FROM public\.topics/);
  assert.match(sql,/draft_revision_deleted/);
});
test("owner sees delete button on redundant drafts only and explicit warning",()=>{
  assert.match(studio,/role === "owner" && d\.status === "draft"/);
  assert.match(studio,/other\.implementations\.id === d\.implementations\.id/);
  assert.match(studio,/rpc\("owner_delete_draft_revision"/);
  assert.match(studio,/confirmation !== "SUPPRIMER"/);
  assert.match(studio,/Supprimer ce brouillon/);
});
