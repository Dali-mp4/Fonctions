/** Classroom-friendly rendering for array and matrix results.
 * Numeric indices intentionally start at 0, just like T[i] and M[i, j].
 */

type Props = { slug: string; value: unknown; sorted?: boolean };

function isNumberList(value: unknown): value is number[] {
  return Array.isArray(value) && value.length > 0 && value.every(
    (item) => typeof item === "number" && Number.isFinite(item)
  );
}

function isNumberMatrix(value: unknown): value is number[][] {
  return Array.isArray(value) && value.length > 0 && isNumberList(value[0]) &&
    value.every((row) => isNumberList(row) && row.length === value[0].length);
}

function NumericGrid({ rows, name, oneDimensional, sorted = false }: {
  rows: number[][];
  name: string;
  oneDimensional: boolean;
  sorted?: boolean;
}) {
  const columnCount = rows[0].length;
  const description = oneDimensional
    ? `Tableau ${name} : ${columnCount} éléments, numérotés de 0 à ${columnCount - 1}.`
    : `Matrice ${name} : ${rows.length} lignes et ${columnCount} colonnes.`;
  return (
    <div className="data-result">
      <div className="data-result-heading">
        <strong>{oneDimensional ? (sorted ? "Tableau trié" : "Tableau affiché") : "Matrice affichée"}</strong>
        <span>{oneDimensional ? `${columnCount} éléments` : `${rows.length} lignes × ${columnCount} colonnes`}</span>
      </div>
      <div className="data-grid-scroll" role="region" aria-label={description} tabIndex={0}>
        <table className="data-grid">
          <caption>{description} Les indices commencent à 0.</caption>
          <thead>
            <tr>
              <th scope="col">{oneDimensional ? "Indice i" : "Ligne / Col."}</th>
              {rows[0].map((_, j) => <th scope="col" key={`col-${j}`}>
                {oneDimensional ? j : `Col. ${j}`}
              </th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => <tr key={`row-${i}`}>
              <th scope="row">{oneDimensional ? "Valeur T[i]" : `Ligne ${i}`}</th>
              {row.map((value, j) => <td key={`cell-${i}-${j}`} title={oneDimensional ? `T[${j}]` : `M[${i}, ${j}]`}>
                {value}
              </td>)}
            </tr>)}
          </tbody>
        </table>
      </div>
      <p className="data-legend">{oneDimensional
        ? "Chaque colonne correspond à une case du tableau : T[0], T[1], T[2], etc."
        : "Chaque case M[i, j] est repérée par sa ligne i et sa colonne j."}</p>
    </div>
  );
}

export function ResultDisplay({ slug, value, sorted = false }: Props) {
  if ((slug === "tableau" || slug === "tableau-tri") && isNumberList(value)) {
    return <NumericGrid rows={[value]} name="T" oneDimensional sorted={sorted} />;
  }
  if (slug === "matrice" && isNumberMatrix(value)) {
    return <NumericGrid rows={value} name="M" oneDimensional={false} />;
  }
  return <strong className="result-plain">{typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}</strong>;
}
