import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const authConfigured = Boolean(url && key);
export async function serverSupabase() {
  if (!url || !key) return null;
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() { return store.getAll(); },
      setAll(items) {
        try { items.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* RSC cannot mutate cookies; refresh is handled by proxy. */ }
      },
    },
  });
}
