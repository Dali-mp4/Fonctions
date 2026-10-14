import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type OAuthReason =
  | "provider_denied"
  | "provider_error"
  | "missing_code"
  | "missing_config"
  | "pkce_missing"
  | "exchange_failed"
  | "unexpected";

/**
 * Redirect with a fixed, non-sensitive reason. Never copy error_description,
 * an authorization code, or user-controlled parameters into the login URL.
 */
function oauthFailure(request: NextRequest, reason: OAuthReason) {
  const target = new URL("/connexion?oauth_error=1", request.url);
  target.searchParams.set("oauth_reason", reason);
  const response = NextResponse.redirect(target, {status:303});
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

/** Google OAuth PKCE code exchange on this application's own origin. */
export async function GET(request: NextRequest) {
  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) return oauthFailure(request,
    providerError === "access_denied" ? "provider_denied" : "provider_error");

  const code = request.nextUrl.searchParams.get("code");
  if (!code || code.length > 4096) return oauthFailure(request, "missing_code");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return oauthFailure(request, "missing_config");

  const response = NextResponse.redirect(new URL("/compte", request.url), {status:303});
  response.headers.set("Cache-Control", "private, no-store");

  const sb = createServerClient(url, key, {
    cookies: {
      getAll() {return request.cookies.getAll();},
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({name,value,options})=>{
          request.cookies.set(name,value);
          response.cookies.set(name,value,options);
        });
      },
    },
  });

  try {
    const {error} = await sb.auth.exchangeCodeForSession(code);
    if (error) {
      const missingVerifier = /verifier|pkce|flow.state/i.test(error.message);
      const reason: OAuthReason = missingVerifier ? "pkce_missing" : "exchange_failed";
      // Log only a fixed failure category and Supabase's short error code.
      // Do not log authorization codes, email addresses, cookies, or tokens.
      console.warn("Google OAuth callback rejected", {
        reason,
        authCode: error.code?.replace(/[^a-z0-9_]/gi, "").slice(0, 60) ?? "unspecified",
      });
      return oauthFailure(request,reason);
    }
    return response;
  } catch {
    console.warn("Google OAuth callback encountered an unexpected failure");
    return oauthFailure(request,"unexpected");
  }
}
