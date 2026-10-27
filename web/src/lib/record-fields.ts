export const RECORD_TYPES = ["chaîne", "entier", "réel", "booléen"] as const;
export type RecordType = (typeof RECORD_TYPES)[number];
export type RecordRow = { id: number; nom: string; type: RecordType; valeur: string };
export type RecordInput = Pick<RecordRow, "nom" | "type" | "valeur">;

function isRecordType(value: unknown): value is RecordType {
  return typeof value === "string" && RECORD_TYPES.some(type => type === value);
}

export function initialRecordRows(defaultValue: unknown): RecordRow[] {
  if (!Array.isArray(defaultValue) || defaultValue.length === 0) {
    return [{ id: 1, nom: "", type: "chaîne", valeur: "" }];
  }
  return defaultValue.map((raw, index) => {
    const values: unknown[] = Array.isArray(raw) ? raw : [];
    return {
      id: index + 1,
      nom: String(values[0] ?? ""),
      type: isRecordType(values[1]) ? values[1] : "chaîne",
      valeur: String(values[2] ?? ""),
    };
  });
}

/** Match the existing Python API: JSON { inputs: { champs: [{nom,type,valeur}] } }.
 * Values stay as strings here because the trusted backend converts them using
 * the selected type and returns the typed Python dictionary.
 */
export function serializeRecordRows(rows: RecordRow[]): RecordInput[] {
  if (!rows.length) throw new Error("Ajoute au moins un champ.");
  const names = new Set<string>();
  return rows.map((row, index) => {
    const nom = row.nom.trim();
    if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(nom)) {
      throw new Error(`Champ ${index + 1} : saisis un nom valide (lettres, chiffres ou _, sans commencer par un chiffre).`);
    }
    if (names.has(nom)) throw new Error(`Le nom de champ « ${nom} » est utilisé plusieurs fois.`);
    names.add(nom);
    if (!isRecordType(row.type)) throw new Error(`Type inconnu pour « ${nom} ».`);
    const trimmed = row.valeur.trim();
    if (row.type === "entier" && (!/^[+-]?\d+$/.test(trimmed) || !Number.isSafeInteger(Number(trimmed)))) {
      throw new Error(`« ${nom} » doit contenir un entier valide.`);
    }
    if (row.type === "réel" && (!trimmed || !Number.isFinite(Number(trimmed.replace(",", "."))))) {
      throw new Error(`« ${nom} » doit contenir un nombre réel valide.`);
    }
    if (row.type === "booléen" && !["Vrai", "Faux"].includes(trimmed)) {
      throw new Error(`« ${nom} » doit être Vrai ou Faux.`);
    }
    return { nom, type: row.type, valeur: row.type === "chaîne" ? row.valeur : trimmed };
  });
}
