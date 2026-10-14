import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(p,"utf8");

test("Google login uses Supabase SSR PKCE and retains email/password options",()=>{
 const src=read("src/components/login-form.tsx");
 assert.match(src,/Continuer avec Google/);
 assert.match(src,/signInWithOAuth/);
 assert.match(src,/provider:"google"/);
 assert.match(src,/auth\/callback/);
 assert.match(src,/skipBrowserRedirect:true/);
 assert.match(src,/signInWithPassword/);
 assert.match(src,/signUp/);
 assert.doesNotMatch(src,/GOOGLE_CLIENT_SECRET|SUPABASE_SERVICE_ROLE_KEY/);
});

test("OAuth callback exchanges code, sets cookies and prevents open redirects",()=>{
 const callback=read("src/app/auth/callback/route.ts");
 assert.match(callback,/createServerClient/);
 assert.match(callback,/exchangeCodeForSession\(code\)/);
 assert.match(callback,/response\.cookies\.set/);
 assert.match(callback,/new URL\("\/compte", request\.url\)/);
 assert.match(callback,/new URL\("\/connexion\?oauth_error=1", request\.url\)/);
 assert.doesNotMatch(callback,/searchParams\.get\("next"\)/);
 assert.doesNotMatch(callback,/GOOGLE_CLIENT_SECRET|SUPABASE_SERVICE_ROLE_KEY/);
});

test("Account page surfaces linked providers without private OAuth data",()=>{
 const page=read("src/app/compte/page.tsx");
 assert.match(page,/user\.identities/);
 assert.match(page,/providers/);
});
