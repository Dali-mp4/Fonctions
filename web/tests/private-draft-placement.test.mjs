import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = file => readFileSync(file, "utf8");
const sql = read("../supabase/migrations/026_private_draft_placement.sql");
const studio = read("src/components/studio-client.tsx");

test("authors can update the chapter and type of an editable private draft", () => {
  assert.match(sql, /CREATE FUNCTION public\.save_private_lesson_with_placement/);
  assert.match(sql, /source\.created_by IS DISTINCT FROM actor/);
  assert.match(sql, /original\.created_by IS DISTINCT FROM actor/);
  assert.match(sql, /source\.status NOT IN \('draft','changes_requested'\)/);
  assert.match(sql, /p_expected_edit_seq/);
  assert.match(sql, /p_method_type NOT IN \('base','advanced'\)/);
  assert.match(sql, /destination\.state='pending' AND destination\.created_by=actor/);
  assert.match(sql, /UPDATE public\.implementations SET topic_id=destination\.id,method_type=p_method_type/);
  assert.match(sql, /public\.update_draft_lesson_with_contract/);
});

test("reclassifying a withdrawn publication forks only its draft", () => {
  assert.match(sql, /approved_history := original\.archived_at IS NOT NULL/);
  assert.match(sql, /r\.status IN \('published','archived'\)/);
  assert.match(sql, /INSERT INTO public\.implementations\(topic_id,method_type,created_by\)/);
  assert.match(sql, /UPDATE public\.revisions SET implementation_id=target_implementation/);
  assert.match(sql, /WHERE id=source\.id AND implementation_id=original\.id/);
  assert.match(sql, /IF placement_changed AND original\.published_revision_id IS NOT NULL/);
  assert.match(sql, /next_seq:=public\.update_draft_lesson_with_contract/);
  assert.doesNotMatch(sql, /UPDATE public\.revisions SET status='published'/);
  assert.doesNotMatch(sql, /DELETE FROM public\.revisions/);
  assert.match(sql, /forked_from_approved_history/);
});

test("database mutation is authenticated, revokes public access, and audits placement", () => {
  assert.match(sql, /SECURITY DEFINER SET search_path = ''/);
  assert.match(sql, /actor_role IS NULL/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.save_private_lesson_with_placement/);
  assert.match(sql, /FROM PUBLIC,anon/);
  assert.match(sql, /TO authenticated/);
  assert.match(sql, /private_implementation_reclassified/);
  assert.match(sql, /'edit_seq',next_seq/);
});

test("Studio exposes placement for drafts and requires save before Python tests", () => {
  assert.match(studio, /save_private_lesson_with_placement/);
  assert.match(studio, /p_topic_slug: topic, p_method_type: method/);
  assert.match(studio, /setSavedPlacement/);
  assert.match(studio, /savedPlacement === placementSignature/);
  assert.match(studio, /setSavedPlacement\(\x60\$\{draft\.implementations\.topics\.slug\}:\$\{draft\.implementations\.method_type\}\x60\)/);
  assert.match(studio, /<label>Concept<select value=\{topic\} disabled=\{busy \|\| creatingChapter\}/);
  assert.match(studio, /<label>Type<select value=\{method\} disabled=\{busy \|\| creatingChapter\}/);
  assert.match(studio, /data\.forked/);
  assert.match(studio, /data\.placement_changed/);
  assert.match(studio, /Relance les tests/);
  assert.match(studio, /canRun=\{pristine/);
});
