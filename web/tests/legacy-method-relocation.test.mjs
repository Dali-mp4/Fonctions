import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  visibleChapterLessons, legacyMethodsForChapter, relocatedLegacyPath,
  legacySitemapPaths,
} from "../src/lib/legacy-method-placement.ts";
import { publicSitemapEntries, SITE_ORIGIN } from "../src/lib/seo.ts";

const read=(path)=>readFileSync(path,"utf8");
const originals=JSON.parse(read("src/data/seed-algorithms.json"));
const publishedChapters=[{slug:"arithmetique",title:"Arithmétique et nombres"},
  {slug:"chaines",title:"Chaînes de caractères"},...originals];

test("PGCD, PPCM and SOM_CH are no longer standalone chapter cards",()=>{
  const chapters=visibleChapterLessons(publishedChapters);
  const slugs=chapters.map(x=>x.slug);
  for(const hidden of ["pgcd","ppcm","som-ch"])assert.ok(!slugs.includes(hidden));
  for(const live of ["arithmetique","chaines","tableau","matrice"])
    assert.ok(slugs.includes(live));
  assert.equal(originals.length,7,"Original reviewed source code remains preserved");
});

test("reviewed school methods appear inside the target chapters",()=>{
  assert.deepEqual(legacyMethodsForChapter("arithmetique",originals).map(x=>x.slug),
    ["pgcd","ppcm"]);
  assert.deepEqual(legacyMethodsForChapter("chaines",originals).map(x=>x.slug),["som-ch"]);
  assert.deepEqual(legacyMethodsForChapter("matrice",originals),[]);
  assert.equal(relocatedLegacyPath("pgcd"),"/algorithme/arithmetique?m=pgcd");
  assert.equal(relocatedLegacyPath("ppcm"),"/algorithme/arithmetique?m=ppcm");
  assert.equal(relocatedLegacyPath("som-ch"),"/algorithme/chaines?m=som-ch");
  assert.equal(relocatedLegacyPath("matrice"),undefined);
});

test("the new method routes are indexable; old chapters are absent from the sitemap",()=>{
  const chapters=visibleChapterLessons(publishedChapters);
  const methods=legacySitemapPaths(chapters,originals);
  assert.deepEqual(methods,[
    "/algorithme/arithmetique?m=pgcd",
    "/algorithme/arithmetique?m=ppcm",
    "/algorithme/chaines?m=som-ch",
  ]);
  const urls=publicSitemapEntries(chapters,[],methods).map(x=>x.url);
  for(const m of methods)assert.ok(urls.includes(SITE_ORIGIN+m));
  for(const slug of ["pgcd","ppcm","som-ch"])
    assert.ok(!urls.includes(SITE_ORIGIN+"/algorithme/"+slug));
});

test("runtime execution remains on reviewed built-in API, not unapproved contributor code",()=>{
  const page=read("src/app/algorithme/[slug]/page.tsx");
  const server=read("src/lib/public-catalog-server.ts");
  const library=read("src/components/library-client.tsx");
  const sql=read("../supabase/migrations/025_regroup_pgcd_ppcm_som_ch.sql");
  assert.match(page,/permanentRedirect/);
  assert.match(page,/legacyMethodsForChapter/);
  assert.match(page,/algorithm=\{legacySelected\?\?a\}/);
  assert.match(page,/LegacyLessonNeverExpectedHere|LessonTabs/);
  assert.match(server,/visibleChapterLessons\(mergeOriginalLessons/);
  assert.match(library,/legacyMethodsForChapter\(a.slug,algorithms\)/);
  assert.match(sql,/UPDATE public\.implementations SET topic_id=strings WHERE topic_id=old_som/);
  assert.match(sql,/som_published<>1/);
  assert.match(sql,/FROM public\.published_methods/);
  assert.doesNotMatch(sql,/DELETE FROM public\.(?:revisions|implementations)/);
  assert.doesNotMatch(sql,/UPDATE public\.revisions/);
  assert.match(read("../api/app/main.py"),/"pgcd": \{"a", "b"\}/);
  assert.match(read("../api/app/main.py"),/"ppcm": \{"a", "b"\}/);
  assert.match(read("../api/app/main.py"),/"som-ch": \{"a"\}/);
});
