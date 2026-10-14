import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(p,"utf8");

test("account page is guarded server-side and reads only authenticated profile",()=>{
  const page=read("src/app/compte/page.tsx");
  assert.match(page,/serverSupabase\(\)/);
  assert.match(page,/\.auth\.getUser\(\)/);
  assert.match(page,/\.from\("profiles"\)/);
  assert.match(page,/\.from\("account_deletion_requests"\)/);
  assert.match(page,/export const dynamic = "force-dynamic"/);
});

test("account changes use Supabase Auth and scoped name RPC; never modify roles",()=>{
  const page=read("src/components/account-client.tsx");
  assert.match(page,/set_my_display_name/);
  assert.match(page,/auth\.updateUser\(\{email:value\}\)/);
  assert.match(page,/auth\.updateUser\(\{password\}\)/);
  assert.match(page,/auth\.signOut\(\{scope\}\)/);
  assert.match(page,/roleLabels/);
  assert.doesNotMatch(page,/\.from\("profiles"\)\.update\(/);
  assert.doesNotMatch(page,/SUPABASE_SERVICE_ROLE_KEY|sb_secret_/);
});

test("deletion is a request and owner account is protected, never deleted by client",()=>{
  const sql=read("../supabase/migrations/009_account_management.sql");
  const client=read("src/components/account-client.tsx");
  assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
  assert.match(sql,/role='owner'/);
  assert.match(sql,/ON DELETE CASCADE/);
  assert.match(sql,/request_my_account_deletion/);
  assert.match(sql,/cancel_my_account_deletion/);
  assert.match(sql,/REVOKE ALL ON public\.account_deletion_requests/);
  assert.match(client,/request_my_account_deletion/);
  assert.match(client,/cancel_my_account_deletion/);
  assert.match(client,/en attente de traitement humain/);
  assert.doesNotMatch(client,/auth\.admin|deleteUser\(/);
  assert.doesNotMatch(sql,/DELETE FROM (?:auth\.users|public\.revisions|public\.implementations)/);
});

test("requested navigation names appear consistently without breaking routes",()=>{
  const header=read("src/components/header.tsx");
  const layout=read("src/app/layout.tsx");
  const studio=read("src/app/studio/page.tsx");
  const library=read("src/app/bibliotheque/page.tsx");
  assert.match(header,/El studio\./);
  assert.match(header,/El biblioteque\./);
  assert.match(layout,/El studio\./);
  assert.match(layout,/El biblioteque\./);
  assert.match(studio,/El studio/);
  assert.match(library,/El biblioteque/);
  assert.match(header,/href="\/studio"/);
  assert.match(header,/href: "\/bibliotheque"/);
  assert.match(header,/href="\/compte"/);
});
