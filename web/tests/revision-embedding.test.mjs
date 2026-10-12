import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const get = (path) => readFileSync(resolve(root, path), "utf8");

test("the revision embed names the revision-to-implementation foreign key", () => {
  const sql = get("supabase/migrations/001_initial_schema.sql");
  const query = get("web/src/lib/revision-select.ts");
  assert.match(sql, /implementation_id uuid NOT NULL REFERENCES public\.implementations\(id\)/);
  assert.match(sql, /FOREIGN KEY \(published_revision_id\) REFERENCES public\.revisions\(id\)/);
  assert.match(query, /implementations:implementations!revisions_implementation_id_fkey\(method_type,topics\(slug,title\)\)/);
});

for (const component of ["studio-client.tsx", "reviewer-workspace.tsx"]) {
  test(component + " uses the same unambiguous relationship", () => {
    const source = get("web/src/components/" + component);
    assert.match(source, /import \{ revisionWithImplementationSelect \} from "@\/lib\/revision-select"/);
    assert.match(source, /\.select\(revisionWithImplementationSelect\)/);
    assert.doesNotMatch(source, /implementations\(method_type,topics\(slug,title\)\)/);
  });
}
