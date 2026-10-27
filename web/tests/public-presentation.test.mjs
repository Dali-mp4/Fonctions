import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getSchoolPaths, schoolYearFromLevel } from "../src/lib/school-paths.ts";
const read = p=>readFileSync(p,"utf8");
const seed=JSON.parse(read("src/data/seed-algorithms.json"));

test("school programme cards only appear when approved modules are present",()=>{
 assert.equal(schoolYearFromLevel("Bases · 3ème Info"),3);
 assert.equal(schoolYearFromLevel("4ème Info"),4);
 assert.equal(schoolYearFromLevel("4eme Sciences Informatiques"),4);
 assert.equal(schoolYearFromLevel("Bac Info"),4);
 assert.equal(schoolYearFromLevel("Algorithmique générale"),null);
 const current=getSchoolPaths(seed);
 assert.deepEqual(current.map(x=>x.year),[3]);
 assert.equal(current[0].modules.length,7);
 const future={...seed[0],slug:"nouvelle-notion-4",name:"Nouvelle notion",level:"4ème Info"};
 const expanded=getSchoolPaths([...seed,future]);
 assert.deepEqual(expanded.map(x=>x.year),[3,4]);
 assert.equal(expanded[1].modules[0].slug,"nouvelle-notion-4");
 const page=read("src/app/parcours/page.tsx");
 assert.match(page,/getPublicCatalog/);
 assert.match(page,/getSchoolPaths\(lessons\)/);
 assert.match(page,/paths\.map\(path/);
 assert.match(page,/path\.modules\.map\(module/);
});

test("public presentation includes the user's attribution, without unfinished-release labels",()=>{
 const layout=read("src/app/layout.tsx");
 assert.match(layout,/Algo Fi Jib\./);
 assert.match(layout,/Développé par Med Ali Tej, avec l’aide d’outils d’IA\./);
 const paths=[
  "src/app/layout.tsx","src/app/page.tsx","src/app/parcours/page.tsx",
  "src/components/function-tests-editor.tsx","src/components/library-client.tsx",
  "src/app/bibliotheque/page.tsx",
 ];
 const forbidden=/V2 EN CONSTRUCTION|Version de développement|EN PRÉPARATION|en cours de développement|Phase 3 · Tests isolés|se construira progressivement|au fil du projet|7 modules fondateurs/i;
 for(const path of paths) assert.doesNotMatch(read(path),forbidden,path);
 assert.doesNotMatch(read("../api/app/draft_tests.py"),/Phase 3B/);
 assert.doesNotMatch(read("../api/app/public_method_runs.py"),/Atelier communautaire/);
});

test("homepage and library show the same live count of approved implementations",()=>{
 const home=read("src/app/page.tsx");
 const library=read("src/components/library-client.tsx");
 const catalog=read("src/lib/public-catalog-server.ts");
 assert.match(catalog,/sb\.from\("published_methods"\)/);
 assert.match(catalog,/selectPublishedMethods\(approved\.data\)/);
 assert.match(home,/const \{lessons,methods,connected\} = await getPublicCatalog\(\)/);
 assert.match(home,/String\(methods\.length\)\.padStart\(2,"0"\)/);
 assert.match(home,/implémentations publiées/);
 assert.doesNotMatch(home,/approches Base et Advanced/);
 assert.match(library,/\{lessons\.length\} modules publiés/);
 assert.match(library,/methods\.length/);
 assert.match(library,/implémentation\$\{methods\.length !== 1 \? "s" : ""\} publiée/);
 assert.match(library,/Implémentations temporairement indisponibles/);
 assert.match(home,/connected \?/);
});
