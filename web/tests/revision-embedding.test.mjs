import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const shared = readFileSync("src/lib/revision-select.ts", "utf8");
test("explicitly select revisions implementation foreign key",()=> {
  assert.match(shared,/implementations:implementations!revisions_implementation_id_fkey/);
  assert.match(shared,/test_cases/);
});
for(const component of ["studio-client.tsx","reviewer-workspace.tsx"]){
  test(`${component} uses unambiguous shared selection`,()=>{
    assert.match(readFileSync(`src/components/${component}`,"utf8"),/\.select\(revisionWithImplementationSelect\)/);
  });
}

test("contract persistence requires an owned, editable draft and always invalidates tests",()=> {
  const sql = readFileSync("../supabase/migrations/003_function_test_contract.sql", "utf8");
  assert.match(sql,/created_by=\(SELECT auth\.uid\(\)\)/);
  assert.match(sql,/status IN \('draft','changes_requested'\)/);
  assert.match(sql,/edit_seq=p_expected_edit_seq/);
  assert.match(sql,/test_status='not_run'/);
  assert.match(sql,/p_test_cases jsonb/);
  assert.match(readFileSync("src/components/studio-client.tsx", "utf8"),/save_private_lesson_with_placement/);
  assert.match(readFileSync("../supabase/migrations/026_private_draft_placement.sql", "utf8"),
    /public\\.update_draft_lesson_with_contract\\(/);
  const wrapper = readFileSync("../supabase/migrations/007_unified_lesson_methods.sql", "utf8");
  assert.match(wrapper,/public\.update_draft_with_contract\(/);
  assert.match(wrapper,/public\.validate_lesson_content/);
});
