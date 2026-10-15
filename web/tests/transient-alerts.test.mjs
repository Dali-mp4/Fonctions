import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=(p)=>readFileSync(p,"utf8");
const component=read("src/components/transient-alert.tsx");
const css=read("src/app/globals.css");
const components=[
  "studio-client","content-management","publication-management",
  "reviewer-workspace","team-roles","account-client","login-form",
  "community-lesson-tabs","lesson-tabs","revision-history",
];

test("transient messages fade, then unmount, with cleanup and an accessible close button",()=>{
  assert.match(component,/NOTICE_DURATION_MS = 5000/);
  assert.match(component,/ERROR_DURATION_MS = 8500/);
  assert.match(component,/window\.setTimeout\(\(\) => setFading\(true\)/);
  assert.match(component,/window\.setTimeout\(\(\) => setHidden\(true\)/);
  assert.match(component,/window\.clearTimeout\(fade\)/);
  assert.match(component,/window\.clearTimeout\(hide\)/);
  assert.match(component,/key=\{tone \+ ":" \+ message\}/);
  assert.match(component,/role=\{tone === "error" \? "alert" : "status"\}/);
  assert.match(component,/aria-label="Fermer le message"/);
  assert.match(css,/\.transient-alert--fading\{opacity:0/);
  assert.match(css,/prefers-reduced-motion:reduce/);
});

test("all form and workflow feedback uses shared disappearing alerts",()=>{
  for(const path of components) {
    const source=read("src/components/"+path+".tsx");
    assert.match(source,/TransientAlert/,path);
  }
  const studio=read("src/components/studio-client.tsx");
  for(const prop of ["submitError","submitNotice","error","ok"]) {
    assert.match(studio,new RegExp("message=\\{"+prop+"\\}"),prop);
  }
  assert.match(studio,/message=\{listError \?/);
  assert.match(read("src/components/reviewer-workspace.tsx"),/message=\{notice\}/);
  assert.match(read("src/components/publication-management.tsx"),/message=\{notice\}/);
});

test("the supplied logo is installed as the browser tab favicon",()=>{
  const ico=readFileSync("src/app/favicon.ico");
  assert.equal(ico.readUInt16LE(0),0);
  assert.equal(ico.readUInt16LE(2),1);
  assert.ok(ico.readUInt16LE(4)>0);
  assert.ok(ico.length>500);
  const imageOffset=ico.readUInt32LE(18);
  assert.equal(ico.subarray(imageOffset,imageOffset+8).toString("hex"),"89504e470d0a1a0a");
  assert.equal(ico[imageOffset+25],6,"ICO PNG must be RGBA for Next.js image decoding");
});
