import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const file = (path) => readFileSync(path, "utf8");
const sql = file("../supabase/migrations/005_review_publication_workflow.sql");

test("verified sandbox evidence and exact version required for submission and approval", () => {
  assert.match(sql, /CREATE FUNCTION public.submit_revision\(p_revision uuid, p_expected_edit_seq integer\)/);
  assert.match(sql, /draft\.edit_seq <> p_expected_edit_seq/);
  assert.match(sql, /revision_has_verified_tests\(p_revision,p_expected_edit_seq\)/);
  assert.match(sql, /t\.status = 'passed'/);
  assert.match(sql, /t\.evidence = r\.test_evidence/);
  assert.match(sql, /DROP FUNCTION IF EXISTS public.submit_revision\(uuid\)/);
  assert.match(sql, /DROP FUNCTION IF EXISTS public.approve_revision\(uuid\)/);
});
test("reviews cannot self-approve and changes invalidate prior certification", () => {
  assert.match(sql, /item\.created_by=\(SELECT auth\.uid\(\)\)/);
  assert.match(sql, /test_status='not_run', test_evidence='\{\}'::jsonb/);
  assert.match(sql, /status='changes_requested'/);
  assert.match(sql, /p_note text/);
  assert.match(sql, /length\(btrim\(coalesce\(p_note,''\)\)\) NOT BETWEEN 10 AND 2000/);
});
test("owner-only withdrawal and restoration preserve audit trail", () => {
  assert.match(sql, /FUNCTION public.withdraw_published_revision/);
  assert.match(sql, /FUNCTION public.restore_published_revision/);
  assert.match(sql, /current_role\(\) <> 'owner'/);
  assert.match(sql, /item\.reviewer_id=item\.created_by/);
  assert.match(sql, /publication_withdrawn/);
  assert.match(sql, /publication_restored/);
  assert.match(sql, /REVOKE INSERT,UPDATE,DELETE ON public.profiles/);
});
test("contributors submit saved revisions, reviewer confirms, owner can roll back", () => {
  const studio = file("src/components/studio-client.tsx");
  const reviewer = file("src/components/reviewer-workspace.tsx");
  const pub = file("src/components/publication-management.tsx");
  const timeline = file("src/components/revision-history.tsx");
  assert.match(studio, /submit_revision/);
  assert.match(studio, /p_expected_edit_seq: draft.edit_seq/);
  assert.match(studio, /d.test_status === "passed"/);
  assert.match(reviewer, /request_revision_changes/);
  assert.match(reviewer, /approve_revision/);
  assert.match(reviewer, /r.created_by===userId/);
  assert.match(reviewer, /checkedById/);
  assert.match(pub, /withdraw_published_revision/);
  assert.match(pub, /restore_published_revision/);
  assert.match(timeline, /get_revision_history/);
});
