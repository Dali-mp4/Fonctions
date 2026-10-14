/** The public pedagogical structure shared by original and contributor methods. */
export type LessonSection = { title: string; pseudocode: string; python: string; note: string };
export type LessonContent = { principle: string; example: string; limits: string; sections: LessonSection[] };

export function makeLessonContent(
  principle: string, example: string, limits: string,
  sectionTitle: string, pseudocode: string, python: string, extra: LessonSection[],
): LessonContent {
  return { principle: principle.trim(), example: example.trim(), limits: limits.trim(),
    sections: [{ title: sectionTitle.trim(), pseudocode, python, note: "" }, ...extra],
  };
}

export function validateLessonContent(c: LessonContent): string[] {
  const errors: string[] = [];
  if(c.principle.length<15 || c.principle.length>5000) errors.push("Principe : 15 à 5 000 caractères.");
  if(c.example.length<3 || c.example.length>1000) errors.push("Exemple : 3 à 1 000 caractères.");
  if(c.limits.length>2000) errors.push("Limites : 2 000 caractères maximum.");
  if(c.sections.length<1 || c.sections.length>8) errors.push("Entre 1 et 8 sections pédagogiques.");
  c.sections.forEach((s,i)=>{
    if(s.title.trim().length<3 || s.title.length>160 ||
      s.pseudocode.length>10000 || s.python.length>15000 || s.note.length>1500 ||
      !(s.pseudocode.trim() || s.python.trim()))
      errors.push(`Section ${i+1} : titre valide et pseudo-code ou Python obligatoire.`);
  });
  if(JSON.stringify(c).length>40000) errors.push("La fiche pédagogique est trop longue.");
  return errors;
}
