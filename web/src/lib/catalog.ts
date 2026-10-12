import seed from "@/data/seed-algorithms.json";

export type InputField = {
  name: string;
  label: string;
  kind: string;
  default: string | number | number[][] | string[][];
  options: string[];
  min_value: number | null;
  max_value: number | null;
  hint: string;
};
export type CodeSection = { title: string; pseudocode: string; python: string; note: string };
export type Algorithm = {
  slug: string;
  name: string;
  title: string;
  category: string;
  level: string;
  method: "base" | "advanced";
  collection: string;
  icon: string;
  summary: string;
  principle: string;
  example: string;
  limits: string;
  tags: string[];
  inputs: InputField[];
  code_sections: CodeSection[];
};

// Snapshot of seven pre-reviewed Fonctions lessons. Future published revisions
// will be retrieved from the API/DB; no draft content belongs in public data.
export const algorithms = seed as unknown as Algorithm[];
export const bySlug = (slug: string): Algorithm | undefined => algorithms.find((a) => a.slug === slug);
export const categories = Array.from(new Set(algorithms.map((a) => a.category)));
