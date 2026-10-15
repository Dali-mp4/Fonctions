import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(p,"utf8");
const sql=read("../supabase/migrations/015_owner_rename_module.sql");
const ui=read("src/components/content-management.tsx");
const studio=read("src/components/studio-client.tsx");

test("module rename is owner-only with optimistic concurrency and input constraints",()=>{
  assert.match(sql,/CREATE FUNCTION public\.owner_rename_module\(/);
  assert.match(sql,/public\.current_role\(\) <> 'owner'/);
  assert.match(sql,/char_length\(trimmed_title\) NOT BETWEEN 3 AND 100/);
  assert.match(sql,/chapter\.title IS DISTINCT FROM p_expected_title/);
  assert.match(sql,/SELECT \* INTO chapter FROM public\.topics WHERE id=p_topic FOR UPDATE/);
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.owner_rename_module\(uuid,text,text\) FROM PUBLIC,anon/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.owner_rename_module\(uuid,text,text\) TO authenticated/);
});
test("rename cannot affect original Git-backed modules, slugs, or review status",()=>{
  assert.match(sql,/chapter\.slug IN \('pgcd','ppcm','verif','som-ch','tableau','matrice','enregistrement'\)/);
  assert.match(sql,/public\.legacy_lessons/);
  assert.match(sql,/UPDATE public\.topics SET title=trimmed_title WHERE id=p_topic/);
  assert.doesNotMatch(sql,/UPDATE public\.revisions|UPDATE public\.implementations|SET slug=/);
  assert.match(sql,/module_renamed/);
});
test("El studio lets the owner rename selected chapters and refreshes the catalog",()=>{
  assert.match(ui,/onRenamed/);
  assert.match(ui,/owner_rename_module/);
  assert.match(ui,/p_expected_title:module.title/);
  assert.match(ui,/canRename/);
  assert.match(ui,/Enregistrer le nom/);
  assert.match(ui,/useEffect\(\(\)=>\{setRenameTitle\(module\?\.title\?\?""\);\}/);
  assert.match(studio,/onRenamed=\{\(\)=>\{void refresh\(\);\}\}/);
});
