import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(p,"utf8");
const sql=read("../supabase/migrations/013_owner_content_deletion.sql");
const ui=read("src/components/content-management.tsx");
const studio=read("src/components/studio-client.tsx");

test("deletion is owner-only and requires exact confirmation on both RPCs",()=>{
  for(const fn of ["owner_delete_implementation","owner_delete_module"])
    assert.match(sql,new RegExp("CREATE FUNCTION public\\."+fn));
  assert.equal((sql.match(/public\.current_role\(\) <> 'owner'/g)??[]).length,3);
  assert.equal((sql.match(/p_confirmation IS DISTINCT FROM 'SUPPRIMER'/g)??[]).length,2);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.owner_delete_module\(uuid,text\) TO authenticated/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.owner_delete_implementation\(uuid,text\) TO authenticated/);
  assert.match(sql,/REVOKE ALL ON FUNCTION public\._owner_purge_implementation_rows\(uuid\) FROM PUBLIC,anon,authenticated/);
});

test("deletion handles FK children and blocks removal of seven builtins",()=>{
  for(const child of ["audit_events","draft_test_runs","public_method_runs","revisions","implementations"])
    assert.match(sql,new RegExp("DELETE FROM public\\."+child));
  assert.match(sql,/UPDATE public\.implementations SET published_revision_id=NULL/);
  assert.match(sql,/item\.slug IN \('pgcd','ppcm','verif','som-ch','tableau','matrice','enregistrement'\)/);
  assert.match(sql,/public\.legacy_lessons/);
  assert.match(sql,/implementation_deleted/);
  assert.match(sql,/module_deleted/);
});

test("owner UI has distinct irreversible actions and refreshes studio",()=>{
  assert.match(ui,/owner_delete_module/);
  assert.match(ui,/owner_delete_implementation/);
  assert.match(ui,/window\.prompt/);
  assert.match(ui,/confirmed!=="SUPPRIMER"/);
  assert.match(ui,/originalSlugs\.has\(module\.slug\)/);
  assert.match(studio,/ContentManagement/);
  assert.match(studio,/onDeleted=\{\(\)=>\{/);
});
