/** Public-facing catalog mapping. No secrets or private revisions here. */
export type MethodRecord = {
  id: string;
  implementation_id: string;
  topic_slug: string;
  topic_title: string;
  category: string;
  school_level: string;
  method_type: "base" | "advanced";
  title: string;
  explanation: string;
  pseudocode: string;
  python_code: string;
  entry_function: string | null;
  input_schema: unknown;
  test_cases: unknown;
  reviewed_at: string;
  lesson_content: { principle: string; example: string; limits: string; sections: {title:string;pseudocode:string;python:string;note:string}[] } | null;
};

export type LegacyRow<T> = { slug: string; payload: T; source_credit: string };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Never trust arbitrary DB rows as public educational cards. */
export function selectPublishedMethods(rows: unknown): MethodRecord[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter((x): x is MethodRecord => {
    if (!x || typeof x !== "object") return false;
    const r = x as Record<string, unknown>;
    return typeof r.id === "string" && uuidPattern.test(r.id) &&
      typeof r.topic_slug === "string" && /^[a-z0-9-]{2,64}$/.test(r.topic_slug) &&
      typeof r.topic_title === "string" && typeof r.category === "string" &&
      (r.method_type === "base" || r.method_type === "advanced") &&
      typeof r.title === "string" && typeof r.explanation === "string" &&
      typeof r.pseudocode === "string" && typeof r.python_code === "string" &&
      typeof r.reviewed_at === "string";
  });
}

export function mergeOriginalLessons<T extends { slug: string; method: string; code_sections: unknown; inputs: unknown }>(
  originals: T[], rows: unknown,
): T[] {
  const fromDb = new Map<string, T>();
  if (Array.isArray(rows)) for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const l = r.payload;
    if (typeof r.slug !== "string" || !l || typeof l !== "object") continue;
    const candidate = l as T;
    if (candidate.slug !== r.slug || candidate.method !== "base" ||
        !Array.isArray(candidate.code_sections) || !Array.isArray(candidate.inputs)) continue;
    fromDb.set(r.slug, candidate);
  }
  // The fixed seven stay available even if Supabase is down or a DB row is missing.
  // Unknown DB slugs cannot turn a public lesson into an executable built-in.
  return originals.map(lesson => fromDb.get(lesson.slug) ?? lesson);
}
