import type { Algorithm } from "@/lib/catalog";

/** These three reviewed Git-backed lessons are METHODS, not chapter cards. */
export const RELOCATED_LEGACY_CHAPTERS = {
  pgcd: "arithmetique",
  ppcm: "arithmetique",
  "som-ch": "chaines",
} as const;

export type RelocatedSlug = keyof typeof RELOCATED_LEGACY_CHAPTERS;
const relocated = new Set<string>(Object.keys(RELOCATED_LEGACY_CHAPTERS));

export function visibleChapterLessons<T extends {slug: string}>(lessons: readonly T[]): T[] {
  return lessons.filter(lesson => !relocated.has(lesson.slug));
}

export function legacyMethodsForChapter(chapter: string, reviewedOriginals: readonly Algorithm[]): Algorithm[] {
  return reviewedOriginals.filter(lesson =>
    RELOCATED_LEGACY_CHAPTERS[lesson.slug as RelocatedSlug] === chapter);
}

export function relocatedLegacyPath(slug: string): string | undefined {
  const chapter = RELOCATED_LEGACY_CHAPTERS[slug as RelocatedSlug];
  return chapter ? `/algorithme/${chapter}?m=${encodeURIComponent(slug)}` : undefined;
}

export function legacySitemapPaths<T extends {slug: string}>(
  publicChapters: readonly T[], reviewedOriginals: readonly Algorithm[],
): string[] {
  return publicChapters.flatMap(chapter =>
    legacyMethodsForChapter(chapter.slug, reviewedOriginals).map(method =>
      `/algorithme/${chapter.slug}?m=${encodeURIComponent(method.slug)}`));
}
