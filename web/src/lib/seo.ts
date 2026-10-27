/** Canonical origin and public-only URLs. Never derive SEO URLs from a preview deployment. */
export const SITE_ORIGIN = "https://algofijib.vercel.app";
export const PUBLIC_PAGES = ["/", "/bibliotheque", "/parcours"] as const;

export function lessonPath(slug: string, methodId?: string): string {
  const path = `/algorithme/${encodeURIComponent(slug)}`;
  return methodId ? `${path}?m=${encodeURIComponent(methodId)}` : path;
}

export type PublicLessonRef = { slug: string };
export type ApprovedMethodRef = { id: string; topic_slug: string; reviewed_at: string };

/** Input methods must come from getPublicCatalog() (anonymous approved-method view). */
export function publicSitemapEntries(
  lessons: readonly PublicLessonRef[], approvedMethods: readonly ApprovedMethodRef[],
  trustedLegacyPaths: readonly string[] = [],
) {
  const allowed = new Set(lessons.map(lesson => lesson.slug));
  const entries = [
    { url: SITE_ORIGIN + "/", changeFrequency: "weekly" as const, priority: 1 },
    { url: SITE_ORIGIN + "/bibliotheque", changeFrequency: "weekly" as const, priority: 0.9 },
    { url: SITE_ORIGIN + "/parcours", changeFrequency: "monthly" as const, priority: 0.8 },
    ...trustedLegacyPaths.map(path => ({
      url: SITE_ORIGIN + path, changeFrequency: "monthly" as const, priority: 0.7,
    })),
    ...lessons.map(lesson => ({
      url: SITE_ORIGIN + lessonPath(lesson.slug),
      changeFrequency: "weekly" as const, priority: 0.8,
    })),
    ...approvedMethods.filter(m => allowed.has(m.topic_slug)).map(m => ({
      url: SITE_ORIGIN + lessonPath(m.topic_slug, m.id),
      changeFrequency: "monthly" as const, priority: 0.7,
      ...(Number.isFinite(Date.parse(m.reviewed_at))
        ? { lastModified: new Date(m.reviewed_at) } : {}),
    })),
  ];
  return [...new Map(entries.map(entry => [entry.url, entry])).values()];
}

export function seoDescription(text: string, limit = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= limit ? clean : clean.slice(0, limit - 1).replace(/\s+\S*$/, "") + "…";
}
