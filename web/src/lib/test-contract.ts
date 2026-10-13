// Shared client-side preflight. This checks JSON shape ONLY: it never executes Python
// and never grants submission or publication privileges.
export const valueTypes = ["int", "float", "str", "bool", "list[int]", "list[list[int]]"] as const;
export type ValueType = (typeof valueTypes)[number];
export type Parameter = { name: string; type: ValueType };
export type FunctionSchema = { parameters: Parameter[]; returns: ValueType };
export type EditableTest = { id: string; label: string; inputsText: string; expectedText: string };
export type TestCase = { label: string; inputs: Record<string, unknown>; expected: unknown };
export type PreflightResult = { index: number; label: string; ok: boolean; message: string };
export type PreflightReport = { errors: string[]; cases: PreflightResult[]; testCases: TestCase[] };

const identifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const isInteger = (value: unknown): boolean => typeof value === "number" && Number.isSafeInteger(value);
const isType = (type: string): type is ValueType => valueTypes.some(t => t === type);
export function matchesType(value: unknown, type: ValueType): boolean {
  if (type === "int") return isInteger(value);
  if (type === "float") return typeof value === "number" && Number.isFinite(value);
  if (type === "str") return typeof value === "string";
  if (type === "bool") return typeof value === "boolean";
  if (type === "list[int]") return Array.isArray(value) && value.every(isInteger);
  return Array.isArray(value) && value.every(row => Array.isArray(row) && row.every(isInteger));
}
export function checkFunctionDefinition(entry: string, code: string, schema: FunctionSchema): string[] {
  const errors: string[] = [];
  if (!identifier.test(entry) || entry.length > 64) errors.push("Nom de fonction invalide (lettres, chiffres et _ uniquement).");
  if (schema.parameters.length > 8) errors.push("Maximum 8 paramètres.");
  const seen = new Set<string>();
  schema.parameters.forEach((p, i) => {
    if (!identifier.test(p.name) || p.name.length > 64) errors.push(`Paramètre ${i + 1} : nom invalide.`);
    if (seen.has(p.name)) errors.push(`Paramètre en double : ${p.name}.`);
    if (!isType(p.type)) errors.push(`Type non pris en charge : ${p.type}.`);
    seen.add(p.name);
  });
  if (!isType(schema.returns)) errors.push("Type de retour invalide.");
  if (identifier.test(entry) && !new RegExp(`(?:^|\\n)[ \\t]*def[ \\t]+${entry}[ \\t]*\\(`).test(code))
    errors.push(`La fonction def ${entry}(...) n'a pas été trouvée dans le code.`);
  return errors;
}
export function validateTestCases(entry: string, code: string, schema: FunctionSchema, cases: EditableTest[]): PreflightReport {
  const errors = checkFunctionDefinition(entry, code, schema);
  if (cases.length > 20) errors.push("Maximum 20 cas de test.");
  const parsed: TestCase[] = [];
  const results = cases.map((test, index): PreflightResult => {
    const label = test.label.trim() || `Test ${index + 1}`;
    if (label.length > 100) return { index, label, ok: false, message: "Libellé trop long (100 max)." };
    let inputs: unknown; let expected: unknown;
    try { inputs = JSON.parse(test.inputsText); } catch { return { index, label, ok: false, message: "Entrées : JSON invalide." }; }
    try { expected = JSON.parse(test.expectedText); } catch { return { index, label, ok: false, message: "Résultat attendu : JSON invalide." }; }
    if (!inputs || typeof inputs !== "object" || Array.isArray(inputs))
      return { index, label, ok: false, message: 'Les entrées doivent être un objet JSON, ex. {"a":24,"b":18}.' };
    const values = inputs as Record<string, unknown>;
    if (Object.keys(values).length !== schema.parameters.length)
      return { index, label, ok: false, message: "Le nombre de paramètres ne correspond pas à la définition." };
    for (const param of schema.parameters) {
      if (!Object.prototype.hasOwnProperty.call(values, param.name) || !matchesType(values[param.name], param.type))
        return { index, label, ok: false, message: `Entrée ${param.name} : valeur attendue de type ${param.type}.` };
    }
    if (!matchesType(expected, schema.returns))
      return { index, label, ok: false, message: `Résultat attendu : valeur de type ${schema.returns} requise.` };
    parsed.push({ label, inputs: values, expected });
    return { index, label, ok: true, message: "Format correct — Python non exécuté." };
  });
  return { errors, cases: results, testCases: parsed };
}
export function testsFromDatabase(value: unknown): EditableTest[] {
  if (!Array.isArray(value)) return [];
  return value.filter(t => t && typeof t === "object" && !Array.isArray(t))
    .map((t, i) => ({
      id: `restored-${i}`, label: typeof t.label === "string" ? t.label : `Test ${i + 1}`,
      inputsText: JSON.stringify(t.inputs ?? {}, null, 2), expectedText: JSON.stringify(t.expected ?? null),
    }));
}
