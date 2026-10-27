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

/**
 * Total public implementations = reviewed built-in algorithms (including ones
 * regrouped as methods) + independently approved Supabase implementations.
 * A method's Base/Advanced type does not affect whether it counts.
 */
export function countPublicImplementations(
  reviewedOriginals: readonly {slug: string}[],
  approvedMethods: readonly {implementation_id: string; topic_slug: string}[],
  chapterSlug?: string,
): number {
  const originals = reviewedOriginals.filter(original =>
    !chapterSlug ||
      (RELOCATED_LEGACY_CHAPTERS[original.slug as RelocatedSlug] ?? original.slug) === chapterSlug
  );
  const approved = approvedMethods.filter(method => !chapterSlug || method.topic_slug === chapterSlug);
  return new Set(originals.map(original => original.slug)).size
    + new Set(approved.map(method => method.implementation_id)).size;
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

const destinationFallbacks: Algorithm[] = [
  { slug:"arithmetique", name:"Arithmétique et nombres", title:"Arithmétique et nombres",
    category:"Algorithmique", level:"3ème Info", method:"base", collection:"general",
    icon:"🔢", summary:"PGCD, PPCM, primalité et autres algorithmes sur les nombres.",
    principle:"Explore les méthodes de calcul sur les nombres.", example:"",
    limits:"", tags:["arithmetique","pgcd","ppcm","nombres"], inputs:[], code_sections:[] },
  { slug:"chaines", name:"Chaînes de caractères", title:"Chaînes de caractères",
    category:"Algorithmique", level:"3ème Info", method:"base", collection:"general",
    icon:"🔤", summary:"Somme des chiffres, chaînes et vérifications.",
    principle:"Explore les méthodes de traitement des chaînes.", example:"",
    limits:"", tags:["chaines","som-ch","vérifications"], inputs:[], code_sections:[] },
];

/** Reviewed Git-backed methods keep the destination chapter discoverable even offline. */
export function ensureLegacyMethodChapters(lessons: readonly Algorithm[]): Algorithm[] {
  const existing = new Set(lessons.map(chapter => chapter.slug));
  return [...lessons, ...destinationFallbacks.filter(chapter => !existing.has(chapter.slug))];
}
