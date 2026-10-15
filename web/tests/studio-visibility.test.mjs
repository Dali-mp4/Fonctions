import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require=createRequire(import.meta.url);
const ts=require("typescript");
const src=readFileSync("src/lib/studio-revision-visibility.ts","utf8");
const compiled=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={};
runInNewContext(compiled,{exports:mod,Set,Map});
const {selectStudioRevisions,chaptersForStudioRevisions}=mod;
const rev=(id,impl,status,date,chapter="tableau",published=null)=>({
  id,status,updated_at:date,
  implementations:{id:impl,published_revision_id:published,topics:{slug:chapter,title:chapter.toUpperCase()}}
});

test("only current private versions are visible per implementation",()=>{
  const versions=[
    rev("old","a","archived","2026-05-01"),
    rev("pub","a","published","2026-06-01","tableau","pub"),
    rev("pending","a","submitted","2026-08-01","tableau","pub"),
    rev("draft","a","draft","2026-09-01","tableau","pub"),
    rev("old2","b","draft","2026-06-01","matrice"),
    rev("new2","b","changes_requested","2026-10-01","matrice"),
  ];
  const r=selectStudioRevisions(versions);
  assert.equal(r.privateRevisions.map(x=>x.id).join(","),"new2,draft");
  assert.equal(r.publishedRevisions.length,0);
});

test("published implementation is shown only once, in collapsed category",()=>{
  const rows=[
    rev("archived","a","archived","2026-09-01","tri"),
    rev("published","a","published","2026-07-01","tri","published"),
    rev("superseded","b","published","2026-01-01","tableau","active"),
    rev("active","b","published","2026-10-01","tableau","active"),
    rev("withdrawn","c","archived","2026-11-01","matrice"),
  ];
  const r=selectStudioRevisions(rows);
  assert.equal(r.privateRevisions.length,0);
  assert.equal(r.publishedRevisions.map(x=>x.id).join(","),"active,published");
  assert.equal(chaptersForStudioRevisions(r.publishedRevisions).length,2);
});

test("superseded revisions are hidden even if still in database",()=>{
  const r=selectStudioRevisions([
    rev("archived","m","archived","2026-10-15"),
    rev("draft","m","draft","2026-10-14"),
    rev("olderSubmitted","m","submitted","2026-08-03"),
  ]);
  assert.equal(r.privateRevisions.length,1);
  assert.equal(r.privateRevisions[0].id,"draft");
});

test("studio filters both categories by chapter and hides history cards",()=>{
  const s=readFileSync("src/components/studio-client.tsx","utf8");
  assert.match(s,/selectStudioRevisions\(drafts\)/);
  assert.match(s,/id="studio-chapter-filter"/);
  assert.match(s,/privateRevisions\.filter\(byChapter\)/);
  assert.match(s,/publishedRevisions\.filter\(byChapter\)/);
  assert.match(s,/<details className="studio-published-disclosure">/);
  assert.match(s,/renderChapterGroups\(privateFiltered\)/);
  assert.match(s,/renderChapterGroups\(publishedFiltered\)/);
  assert.doesNotMatch(s,/RevisionHistory|version \{d\.edit_seq\}/);
  assert.match(s,/owner_delete_implementation/);
  assert.match(s,/retract_submitted_revision/);
});
