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

test("self-service deletion uses protected RPC and preserves contribution references",()=>{
 const sql=read("../supabase/migrations/010_self_service_account_deletion.sql");
 const ui=read("src/components/account-client.tsx");
 assert.match(sql,/CREATE FUNCTION public\.delete_my_account\(p_confirm_email text\)/);
 assert.match(sql,/target_uid uuid := \(SELECT auth\.uid\(\)\)/);
 assert.match(sql,/confirmed_user\.email IS DISTINCT FROM p_confirm_email/);
 assert.match(sql,/account_role='owner'/);
 assert.match(sql,/last_sign_in_at < now\(\)-interval '15 minutes'/);
 assert.match(sql,/DROP CONSTRAINT IF EXISTS profiles_id_fkey/);
 assert.match(sql,/INSERT INTO public\.profiles\(id,display_name,role,is_deleted,created_at\)/);
 for(const table of ["topics","implementations","revisions","draft_test_runs","public_method_runs","audit_events"]){
   assert.match(sql,new RegExp("UPDATE public\\."+table+" SET "));
 }
 assert.match(sql,/DELETE FROM auth\.users WHERE id=target_uid/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.delete_my_account\(text\) FROM PUBLIC,anon/);
 assert.doesNotMatch(sql,/DELETE FROM public\.(revisions|implementations|topics|draft_test_runs)/);
 assert.match(ui,/delete_my_account/);
 assert.match(ui,/p_confirm_email:props\.email/);
 assert.match(ui,/deletionEmail\.trim\(\) !== props\.email/);
 assert.doesNotMatch(ui,/auth\.admin|deleteUser\(/);
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
