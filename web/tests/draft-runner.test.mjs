import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const file = (path) => readFileSync(resolve(root, path), "utf8");

test("draft test requests contain only a saved revision and version, not submitted Python", () => {
  const studio = file("web/src/components/studio-client.tsx");
  assert.match(studio, /\/api\/v1\/drafts\/\$\{editing\}\/test/);
  assert.match(studio, /body: JSON\.stringify\(\{ edit_seq: editSeq \}\)/);
  assert.match(studio, /Authorization: `Bearer \$\{session\.access_token\}`/);
  assert.match(studio, /savedSignature === signature/);
  assert.doesNotMatch(studio, /body: JSON\.stringify\(\{\s*code/);
});

test("the UI keeps JSON format checks and Python runtime reports separate", () => {
  const editor = file("web/src/components/function-tests-editor.tsx");
  assert.match(editor, /Vérifier le format des tests/);
  assert.match(editor, /Exécuter les tests Python/);
  assert.match(editor, /runResult\.results\.map/);
});

test("Phase 3C shows real elapsed seconds and measured server timings", () => {
  const editor = file("web/src/components/function-tests-editor.tsx");
  const model = file("web/src/lib/draft-runner.ts");
  assert.match(editor, /performance\.now\(\)/);
  assert.match(editor, /python-run-progress/);
  assert.match(editor, /timings_ms\.total/);
  assert.match(model, /modal_phases/);
});

test("server credentials and sandbox code aren't in frontend env samples", () => {
  const env = file("web/.env.example");
  assert.doesNotMatch(env, /SERVICE_ROLE_KEY|MODAL_TOKEN_SECRET|SUPABASE_SECRET_KEY/);
  const source = file("api/app/draft_tests.py");
  assert.match(source, /p_run_id.*run_id/);
  assert.match(source, /SUPABASE_SERVICE_ROLE_KEY/);
});
