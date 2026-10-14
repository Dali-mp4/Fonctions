import "server-only";
import { createClient } from "@supabase/supabase-js";
import { algorithms, type Algorithm } from "@/lib/catalog";
import { mergeOriginalLessons, selectPublishedMethods, type MethodRecord } from "@/lib/public-catalog-model";

export type PublicCatalog = {
  lessons: Algorithm[];
  methods: MethodRecord[];
  connected: boolean;
};

/** Anonymous on purpose: logged-in reviewers must never leak their private rows into SSR. */
export async function getPublicCatalog(): Promise<PublicCatalog> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { lessons: algorithms, methods: [], connected: false };
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  try {
    const [legacy, approved] = await Promise.all([
      sb.from("legacy_lessons").select("slug,payload,source_credit").order("slug").limit(20),
      sb.from("published_methods").select("*").order("reviewed_at", { ascending: false }).limit(200),
    ]);
    if (legacy.error || approved.error) {
      // No fallback to privileged cookies, browser RPCs, or draft tables.
      return { lessons: algorithms, methods: [], connected: false };
    }
    return {
      lessons: mergeOriginalLessons(algorithms, legacy.data) as Algorithm[],
      methods: selectPublishedMethods(approved.data),
      connected: true,
    };
  } catch {
    return { lessons: algorithms, methods: [], connected: false };
  }
}

export async function getPublicMethod(id: string): Promise<MethodRecord | undefined> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return undefined;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return undefined;
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  try {
    const { data, error } = await sb.from("published_methods")
      .select("*").eq("id", id).maybeSingle();
    if (error || !data) return undefined;
    return selectPublishedMethods([data])[0];
  } catch { return undefined; }
}
