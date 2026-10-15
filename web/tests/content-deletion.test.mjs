import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(p,"utf8");
const oldSql=read("../supabase/migrations/013_owner_content_deletion.sql");
const sql=read("../supabase/migrations/016_auto_delete_empty_chapter.sql");
const ui=read("src/components/content-management.tsx");
const studio=read("src/components/studio-client.tsx");
const css=read("src/app/globals.css");

test("owner-only API retains explicit typed deletion confirmation",()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.owner_delete_implementation/);
  assert.match(sql,/public\.current_role\(\) <> 'owner'/);
  assert.match(sql,/p_confirmation IS DISTINCT FROM 'SUPPRIMER'/);
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.owner_delete_implementation\(uuid,text\) FROM PUBLIC,anon/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.owner_delete_implementation\(uuid,text\) TO authenticated/);
  assert.match(oldSql,/REVOKE ALL ON FUNCTION public\._owner_purge_implementation_rows\(uuid\) FROM PUBLIC,anon,authenticated/);
});

test("purging last implementation also deletes its custom chapter but not original ones",()=>{
  assert.match(sql,/SELECT \* INTO chapter FROM public\.topics WHERE id=target_topic FOR UPDATE/);
  assert.match(sql,/public\._owner_purge_implementation_rows\(p_implementation\)/);
  assert.match(sql,/chapter\.slug NOT IN \('pgcd','ppcm','verif','som-ch','tableau','matrice','enregistrement'\)/);
  assert.match(sql,/NOT EXISTS \(SELECT 1 FROM public\.legacy_lessons/);
  assert.match(sql,/NOT EXISTS \(SELECT 1 FROM public\.implementations WHERE topic_id=chapter\.id\)/);
  assert.match(sql,/DELETE FROM public\.topics WHERE id=chapter\.id/);
  assert.match(sql,/chapter_deleted/);
  assert.match(sql,/implementation_deleted/);
  assert.match(sql,/module_deleted/);
});

test("owner deletion control is on each implementation card, not a bottom selector",()=>{
  assert.match(studio,/className="draft-card-delete"/);
  assert.match(studio,/aria-label=\{\`Supprimer définitivement l'implémentation/);
  assert.match(studio,/role === "owner" && <button/);
  assert.match(studio,/owner_delete_implementation/);
  assert.match(studio,/confirmation !== "SUPPRIMER"/);
  assert.match(studio,/data\?\.chapter_deleted/);
  assert.match(studio,/Supprimer ce brouillon/); // granular draft removal remains available
  assert.match(css,/\.draft-card-delete/);
  assert.doesNotMatch(ui,/owner_delete_module|owner_delete_implementation/);
  assert.match(ui,/owner_rename_module/);
  assert.match(ui,/Renommer un chapitre/);
  assert.match(studio,/<ContentManagement onRenamed=/);
});
