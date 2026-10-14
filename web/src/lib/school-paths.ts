import type { Algorithm } from "@/lib/catalog";

/** Group published content by the school year claimed in each module's level. */
export function schoolYearFromLevel(level: string): 3|4|null {
  const normalized = level.toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"");
  if (/\b3\s*(?:eme|e)\b/.test(normalized)) return 3;
  if (/\b4\s*(?:eme|e)\b/.test(normalized) || /\bbac\s*info\b/.test(normalized)) return 4;
  return null;
}
export function getSchoolPaths(lessons: Algorithm[]) {
  return ([3,4] as const).map(year=>({
    year,
    modules: lessons.filter(lesson=>schoolYearFromLevel(lesson.level)===year)
      .sort((a,b)=>a.name.localeCompare(b.name,"fr")),
  })).filter(path=>path.modules.length>0);
}
