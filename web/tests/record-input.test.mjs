import { test } from "node:test";
import assert from "node:assert/strict";
import { initialRecordRows, serializeRecordRows } from "../src/lib/record-fields.ts";

test("default Enregistrement example becomes structured JSON fields", () => {
  const rows = initialRecordRows([["nom", "chaîne", "3mor"], ["age", "entier", "17"], ["admis", "booléen", "Vrai"]]);
  assert.deepEqual(serializeRecordRows(rows), [
    { nom: "nom", type: "chaîne", valeur: "3mor" },
    { nom: "age", type: "entier", valeur: "17" },
    { nom: "admis", type: "booléen", valeur: "Vrai" },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify({ inputs: { champs: serializeRecordRows(rows) } })).inputs.champs[2],
    { nom: "admis", type: "booléen", valeur: "Vrai" });
});

test("custom fields preserve labels and text", () => {
  assert.deepEqual(serializeRecordRows([
    { id: 7, nom: "prenom", type: "chaîne", valeur: "Ali" },
    { id: 8, nom: "moyenne", type: "réel", valeur: "14,5" },
  ]), [
    { nom: "prenom", type: "chaîne", valeur: "Ali" },
    { nom: "moyenne", type: "réel", valeur: "14,5" },
  ]);
});

test("empty records, duplicates and bad values are rejected before API call", () => {
  assert.throws(() => serializeRecordRows([]), /au moins un/);
  assert.throws(() => serializeRecordRows([{ id: 1, nom: "1age", type: "entier", valeur: "17" }]), /nom valide/);
  assert.throws(() => serializeRecordRows([
    { id: 1, nom: "age", type: "entier", valeur: "17" },
    { id: 2, nom: "age", type: "entier", valeur: "18" },
  ]), /plusieurs fois/);
  assert.throws(() => serializeRecordRows([{ id: 1, nom: "age", type: "entier", valeur: "abc" }]), /entier valide/);
  assert.throws(() => serializeRecordRows([{ id: 1, nom: "admis", type: "booléen", valeur: "oui" }]), /Vrai ou Faux/);
});
