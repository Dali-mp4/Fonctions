"use client";

import { Plus, Trash2 } from "lucide-react";
import type { RecordRow, RecordType } from "@/lib/record-fields";
import styles from "./records-editor.module.css";

const choices: { value: RecordType; label: string }[] = [
  { value: "chaîne", label: "Chaîne de caractères" },
  { value: "entier", label: "Entier" },
  { value: "réel", label: "Réel" },
  { value: "booléen", label: "Booléen" },
];

export function RecordsEditor({ label, rows, onChange, nextId, disabled }: {
  label: string;
  rows: RecordRow[];
  onChange: (rows: RecordRow[]) => void;
  nextId: () => number;
  disabled?: boolean;
}) {
  function update(id: number, change: Partial<RecordRow>) {
    onChange(rows.map(row => row.id === id ? { ...row, ...change } : row));
  }
  function changeType(row: RecordRow, type: RecordType) {
    // Avoid leaving an invalid text value in a boolean dropdown.
    const valeur = type === "booléen"
      ? (row.valeur === "Faux" ? "Faux" : "Vrai")
      : row.type === "booléen" ? "" : row.valeur;
    update(row.id, { type, valeur });
  }
  return <fieldset className={styles.editor} disabled={disabled}>
    <legend>{label}</legend>
    <p className={styles.hint}>Renseigne chaque champ ci-dessous. Le format JSON est créé automatiquement lors de l&apos;exécution.</p>
    <div className={styles.rows}>
      {rows.map((row, index) => <div className={styles.row} key={row.id}>
        <div className={styles.rowHeader}>
          <strong>Champ {index + 1}</strong>
          <button type="button" className={styles.remove} disabled={rows.length <= 1}
            onClick={() => onChange(rows.filter(item => item.id !== row.id))}
            aria-label={`Supprimer le champ ${index + 1}`}>
            <Trash2 size={14}/> Supprimer
          </button>
        </div>
        <div className={styles.fields}>
          <label>
            <span>Nom du champ</span>
            <input type="text" value={row.nom} required
              placeholder="ex. nom"
              onChange={event => update(row.id, { nom: event.target.value })}/>
          </label>
          <label>
            <span>Type de donnée</span>
            <select value={row.type}
              onChange={event => changeType(row, event.target.value as RecordType)}>
              {choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
            </select>
          </label>
          <label className={styles.valueField}>
            <span>Valeur</span>
            {row.type === "booléen"
              ? <select value={row.valeur} onChange={event => update(row.id, { valeur: event.target.value })}>
                <option value="Vrai">Vrai</option>
                <option value="Faux">Faux</option>
              </select>
              : <input type={row.type === "entier" || row.type === "réel" ? "number" : "text"}
                step={row.type === "entier" ? "1" : "any"} required={row.type !== "chaîne"}
                value={row.valeur}
                placeholder={row.type === "entier" ? "ex. 17" : row.type === "réel" ? "ex. 3.5" : "ex. 3mor"}
                onChange={event => update(row.id, { valeur: event.target.value })}/>}
          </label>
        </div>
      </div>)}
    </div>
    <button type="button" className={styles.add}
      onClick={() => onChange([...rows, { id: nextId(), nom: "", type: "chaîne", valeur: "" }])}>
      <Plus size={16}/> Ajouter un champ
    </button>
  </fieldset>;
}
