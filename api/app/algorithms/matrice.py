"""Two-dimensional array initialization and display."""

from .schema import AlgorithmInputError, AlgorithmResult, AlgorithmSpec, CodeSection, InputField
from numpy import array


def remplir_matrice(matrice: list[list[int]], l: int, c: int) -> list[list[int]]:
    """Le nombre de lignes et de colonnes est fourni explicitement."""
    if l <= 0 or c <= 0:
        raise AlgorithmInputError("l et c doivent être strictement positifs.")
    source = array(matrice, dtype=int)
    if source.shape != (l, c):
        raise AlgorithmInputError("La matrice fournie doit avoir l lignes et c colonnes.")
    M = array([[int()] * c] * l)
    for i in range(l):
        for j in range(c):
            M[i, j] = source[i, j]
    return M.tolist()


def execute(matrice: list[list[int]], l: int, c: int) -> AlgorithmResult:
    resultat = remplir_matrice(matrice, l, c)
    steps = []
    for i in range(l):
        for j in range(c):
            if i * c + j < 16:
                steps.append(f"M[{i}, {j}] ← {resultat[i][j]} (ligne {i + 1}, colonne {j + 1})")
    total = l * c
    if total > 16:
        steps.append(f"… {total - 16} cellules supplémentaires non affichées.")
    return AlgorithmResult(resultat, tuple(steps),
        f"Matrice NumPy de {l} ligne(s) et {c} colonne(s).")


SPEC = AlgorithmSpec(
    slug="matrice", name="MATRICE", full_name="Tableau à deux dimensions",
    category="Structures de données", icon="▦",
    summary="Remplir et afficher une matrice d'entiers.",
    principle="Une matrice est organisée en lignes et colonnes. On parcourt ses cellules à l'aide de deux indices.",
    pseudocode="""Procédure REMPLIR(var M : Tableau à 2 dimensions,
                    l, c : Entier)
Début
    Pour i de 0 à l - 1 Faire
        Pour j de 0 à c - 1 Faire
            Lire(M[i, j])
        Fin Pour
    Fin Pour
Fin""",
    inputs=(
        InputField("matrice", "Valeurs de la matrice", "matrix", "1, 2, 3\n4, 5, 6",
                   hint="Une ligne par rangée, avec les entiers séparés par des virgules."),
        InputField("l", "Nombre de lignes (l)", "int", 2, min_value=1, max_value=10,
                   hint="Nombre de lignes de M."),
        InputField("c", "Nombre de colonnes (c)", "int", 3, min_value=1, max_value=10,
                   hint="Nombre de colonnes par ligne."),
    ),
    function=remplir_matrice, execute=execute, example="M = array([[1, 2, 3], [4, 5, 6]]) → 2 lignes × 3 colonnes",
    tags=("matrice", "indices", "tableau"),
    code_sections=(
        CodeSection(
            title="Déclarer la matrice — TDNT et TDOG",
            pseudocode="""TDNT (Tableau de Déclaration des Nouveaux Types)
    Mat = Tableau de 2 Lignes et 3 Colonnes de type Réels

TDOG (Tableau de Déclaration des Objets Globaux)
    Objet       Type / Nature
    M           Mat
    l, c        Entier

Exemple : l ← 2 ; c ← 3""",
            python="""from numpy import array

l = 2
c = 3
M = array([[float()] * c] * l)""",
        ),
        CodeSection(
            title="Remplir manuellement",
            pseudocode="""Procédure REMPLIR(@M : Mat, l, c : Entier)
Début
    Pour i de 0 à l - 1 Faire
        Pour j de 0 à c - 1 Faire
            Lire(M[i, j])
        Fin Pour
    Fin Pour
Fin""",
            python="""def remplir(M, l, c):
    for i in range(l):
        for j in range(c):
            M[i, j] = float(input("Entrer une valeur : "))
    return M""",
        ),
        CodeSection(
            title="Remplir aléatoirement",
            pseudocode="""Procédure REMPLIR_ALEATOIRE(@M : Mat, l, c, mini, maxi : Entier)
Début
    Pour i de 0 à l - 1 Faire
        Pour j de 0 à c - 1 Faire
            M[i, j] ← Aléa(mini, maxi)
        Fin Pour
    Fin Pour
Fin""",
            python="""from random import randint

def remplir_aleatoire(M, l, c, mini, maxi):
    for i in range(l):
        for j in range(c):
            M[i, j] = randint(mini, maxi)
    return M""",
        ),
        CodeSection(
            title="Afficher les cellules",
            pseudocode="""Procédure AFFICHER(M : Mat, l, c : Entier)
Début
    Pour i de 0 à l - 1 Faire
        Pour j de 0 à c - 1 Faire
            Écrire(M[i, j])
        Fin Pour
    Fin Pour
Fin""",
            python="""def afficher(M, l, c):
    for i in range(l):
        for j in range(c):
            print(M[i, j])""",
            note="Le module MATRICE d'origine ne contient pas de tri : nous n'en ajoutons pas.",
        ),
    ),
    limits="Maximum 10 × 10 cellules pour garder l'affichage clair.",
)
