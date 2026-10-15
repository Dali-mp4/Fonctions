import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(path,"utf8");
const sql = read("../supabase/migrations/011_reopen_withdrawn_publications.sql");
const studio = read("src/components/studio-client.tsx");
const pub = read("src/components/publication-management.tsx");

test("only the author can resume a withdrawn approved archive",()=>{
  for (const rule of ["source_revision.created_by <> actor","parent_impl.created_by <> actor",
    "source_revision.status <> 'archived'","parent_impl.published_revision_id IS NOT NULL",
    "parent_impl.archived_at IS NULL","status IN ('draft','changes_requested','submitted')"]) {
    assert.ok(sql.includes(rule), rule);
  }
  assert.match(sql,/SECURITY DEFINER/);
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.reopen_archived_revision_as_draft\(uuid\) FROM PUBLIC,anon/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.reopen_archived_revision_as_draft\(uuid\) TO authenticated/);
});

test("reopened draft copies teaching contents but cannot inherit verified test evidence",()=>{
  for(const field of ["source_revision.python_code","source_revision.test_cases",
    "source_revision.lesson_content","source_archived_revision"])assert.ok(sql.includes(field));
  assert.match(sql,/'draft', 'not_run', '\{\}'::jsonb, 1, NULL, NULL, NULL, NULL/);
  assert.doesNotMatch(sql,/UPDATE public\.revisions SET status='draft'/);
});

test("UI starts a new version instead of unlocking the archived publication",()=>{
  assert.match(studio,/r\.status === "draft" \|\| r\.status === "changes_requested"/);
  assert.match(studio,/reopen_archived_revision_as_draft/);
  assert.match(studio,/openDraft\(newDraft as unknown as Revision\)/);
  assert.match(studio,/Reprendre en brouillon/);
  assert.match(pub,/r\.created_by===userId/);
  assert.match(pub,/Reprendre en brouillon/);
});

test("an already submitted replacement can be retracted and opened for editing", () => {
  const migration=read("../supabase/migrations/012_retract_submitted_revision.sql");
  assert.match(migration,/item\.created_by <> actor/);
  assert.match(migration,/item\.status <> 'submitted'/);
  assert.match(migration,/item\.edit_seq <> p_expected_edit_seq/);
  assert.match(migration,/test_status='not_run', test_evidence='\{\}'::jsonb/);
  assert.match(migration,/edit_seq=edit_seq\+1/);
  assert.match(migration,/submitted_at=NULL/);
  assert.match(migration,/submission_retracted/);
  assert.match(migration,/REVOKE ALL ON FUNCTION public\.retract_submitted_revision\(uuid,integer\) FROM PUBLIC,anon/);
  assert.match(studio,/rpc\("retract_submitted_revision"/);
  assert.match(studio,/Retirer la soumission pour modifier/);
  assert.match(studio,/openDraft\(updated as unknown as Revision\)/);
  assert.match(studio,/existing\?\.status === "submitted"/);
});
