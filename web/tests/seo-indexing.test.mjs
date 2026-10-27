import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SITE_ORIGIN, PUBLIC_PAGES, lessonPath, publicSitemapEntries, seoDescription } from "../src/lib/seo.ts";

const read=(path)=>readFileSync(path,"utf8");
const seed=JSON.parse(read("src/data/seed-algorithms.json"));

test("canonical sitemap has only indexable public pages and built-in lessons",()=>{
  const sitemap=publicSitemapEntries(seed,[]);
  const urls=sitemap.map(row=>row.url);
  assert.deepEqual(urls.slice(0,3),PUBLIC_PAGES.map(p=>SITE_ORIGIN+p));
  assert.equal(urls.length,3+seed.length);
  for(const lesson of seed) assert.ok(urls.includes(SITE_ORIGIN+lessonPath(lesson.slug)));
  assert.ok(urls.every(url=>url.startsWith(SITE_ORIGIN+"/")));
  assert.ok(!urls.some(url=>/\/studio|\/compte|\/connexion|\/auth\//.test(url)));
});

test("approved methods are indexed by their unique canonical URL, never private drafts",()=>{
  const published={id:"5eb33ae3-3d68-4af5-bce0-63e1e3727b72",topic_slug:"tableau",
    reviewed_at:"2026-10-15T09:30:00Z"};
  const notApproved={id:"c66746a9-4c3f-41b6-8f84-de9b358f3510",topic_slug:"draft-secret",
    reviewed_at:"2026-10-15T09:30:00Z"};
  const entries=publicSitemapEntries(seed,[published,notApproved,published]);
  const matching=entries.filter(x=>x.url.includes("?m="));
  assert.equal(matching.length,1);
  assert.equal(matching[0].url,SITE_ORIGIN+"/algorithme/tableau?m="+published.id);
  assert.ok(matching[0].lastModified instanceof Date);
  assert.ok(!entries.some(e=>e.url.includes("draft-secret")||e.url.includes(notApproved.id)));
});

test("chapters added after independent approval appear with their approved methods",()=>{
  const chapter={slug:"chaines",name:"Chaînes de caractères"};
  const method={id:"b58731a8-aa37-409d-806b-ac728248226e",topic_slug:"chaines",
    reviewed_at:"2026-10-15T09:30:00Z"};
  const entries=publicSitemapEntries([...seed,chapter],[method]);
  assert.ok(entries.some(x=>x.url===SITE_ORIGIN+"/algorithme/chaines"));
  assert.ok(entries.some(x=>x.url===SITE_ORIGIN+lessonPath("chaines",method.id)));
  assert.equal(entries.length,3+seed.length+2);
});

test("SEO routes only draw public catalog and never index workspaces",()=>{
  const sitemap=read("src/app/sitemap.ts");
  const robots=read("src/app/robots.ts");
  const server=read("src/lib/public-catalog-server.ts");
  const page=read("src/app/algorithme/[slug]/page.tsx");
  const layout=read("src/app/layout.tsx");
  assert.match(sitemap,/getPublicCatalog\(\)/);
  assert.match(sitemap,/dynamic = "force-dynamic"/);
  assert.match(sitemap,/publicSitemapEntries\(lessons, methods, legacySitemapPaths/);
  assert.match(server,/published_methods/);
  assert.match(server,/persistSession: false/);
  for(const path of ["/studio","/compte","/connexion","/auth/","/methode/"]){
    assert.ok(robots.includes(`"${path}"`),path);
  }
  for(const path of ["studio","compte","connexion"]){
    assert.match(read(`src/app/${path}/page.tsx`),/index: false, follow: false/);
  }
  assert.match(page,/alternates:\{canonical\}/);
  assert.ok(page.includes("if(!a || (m && !selected && !legacy)"));
  assert.match(layout,/GOOGLE_SITE_VERIFICATION/);
  assert.match(layout,/metadataBase: new URL\(SITE_ORIGIN\)/);
  assert.match(read("src/app/bibliotheque/page.tsx"),/canonical: "\/bibliotheque"/);
});

test("description cleans whitespace without leaking huge content",()=>{
  assert.equal(seoDescription("  Cours\n Python  "), "Cours Python");
  assert.ok(seoDescription("Algorithmique ".repeat(30)).length<=160);
  assert.equal(lessonPath("som-ch"),"/algorithme/som-ch");
});

test("Google can read Algo Fi Jib as a distinct site name on the homepage",()=>{
  const homepage=read("src/app/page.tsx");
  const layout=read("src/app/layout.tsx");
  const seo=read("src/lib/seo.ts");
  assert.match(homepage,/"@context": "https:\/\/schema\.org"/);
  assert.match(homepage,/"@type": "WebSite"/);
  assert.match(homepage,/name: "Algo Fi Jib"/);
  assert.match(homepage,/alternateName: \["AlgoFiJib", "algofijib\.vercel\.app"\]/);
  assert.match(homepage,/url: `\$\{SITE_ORIGIN\}\/`/);
  assert.match(homepage,/type="application\/ld\+json"/);
  assert.match(homepage,/JSON\.stringify\(websiteIdentity\)/);
  assert.match(homepage,/title: "Algo Fi Jib — Algorithmique et Python en Tunisie"/);
  assert.match(layout,/siteName: "Algo Fi Jib"/);
  assert.match(layout,/applicationName: "Algo Fi Jib"/);
  assert.match(seo,/SITE_ORIGIN = "https:\/\/algofijib\.vercel\.app"/);
  assert.equal((homepage.match(/type="application\/ld\+json"/g)||[]).length,1);
  assert.doesNotMatch(layout,/type="application\/ld\+json"/);
});
