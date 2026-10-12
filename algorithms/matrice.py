"""Two-dimensional array initialization and display."""

from .schema import AlgorithmInputError, AlgorithmResult, AlgorithmSpec, CodeSection, InputField


def remplir_matrice(matrice: list[list[int]]) -> list[list[int]]:
    """Construire une matrice rectangulaire à partir de ses valeurs."""
    if not matrice or not matrice[0]:
        raise AlgorithmInputError("La matrice doit contenir au moins une ligne et une colonne.")
    largeur = len(matrice[0])
    if any(len(ligne) != largeur for ligne in matrice):
        raise AlgorithmInputError("Toutes les lignes doivent avoir le même nombre de colonnes.")
    resultat = [[0] * largeur for _ in range(len(matrice))]
    for i in range(len(matrice)):
        for j in range(largeur):
            resultat[i][j] = matrice[i][j]
    return resultat


def execute(matrice: list[list[int]]) -> AlgorithmResult:
    resultat = remplir_matrice(matrice)
    steps = []
    for i, ligne in enumerate(resultat):
        for j, valeur in enumerate(ligne):
            if len(steps) < 16:
                steps.append(f"M[{i}, {j}] ← {valeur} (ligne {i + 1}, colonne {j + 1})")
    total = len(resultat) * len(resultat[0])
    if total > 16:
        steps.append(f"… {total - 16} cellules supplémentaires non affichées.")
    return AlgorithmResult(resultat, tuple(steps),
                           f"Matrice de {len(resultat)} ligne(s) et {len(resultat[0])} colonne(s).")


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
    inputs=(InputField("matrice", "Valeurs de la matrice", "matrix", "1, 2, 3\n4, 5, 6",
                        hint="Une ligne par rangée, avec les entiers séparés par des virgules."),),
    function=remplir_matrice, execute=execute, example="[[1, 2, 3], [4, 5, 6]] → 2 lignes × 3 colonnes",
    tags=("matrice", "indices", "tableau"),
    code_sections=(
        CodeSection(
            title="Déclarer la matrice — TDNT et TDOG",
            pseudocode="""TDNT (Tableau de Déclaration des Nouveaux Types)
    Mat = Tableau de 2 Lignes et 3 Colonnes de Réels

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
