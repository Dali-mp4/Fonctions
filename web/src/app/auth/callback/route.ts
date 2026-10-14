import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/** PKCE code exchange on our own origin; no user-controlled return URL. */
export async function GET(request: NextRequest) {
  const goToLogin = () => NextResponse.redirect(
    new URL("/connexion?oauth_error=1", request.url), {status: 303},
  );
  const code = request.nextUrl.searchParams.get("code");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!code || code.length>4096 || !url || !key ||
      request.nextUrl.searchParams.has("error")) return goToLogin();

  let response = NextResponse.redirect(new URL("/compte", request.url), {status:303});
  const sb = createServerClient(url,key,{
    cookies:{
      getAll(){return request.cookies.getAll();},
      setAll(toSet){
        toSet.forEach(({name,value,options})=>{
          request.cookies.set(name,value);
          response.cookies.set(name,value,options);
        });
      },
    },
  });
  try{
    const {error} = await sb.auth.exchangeCodeForSession(code);
    if(error)return goToLogin();
    response.headers.set("Cache-Control","no-store");
    return response;
  }catch{
    return goToLogin();
  }
}
