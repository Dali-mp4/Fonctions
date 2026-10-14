"""Tableau: classroom-style declaration, filling and display; sorting is optional."""

from .schema import AlgorithmInputError, AlgorithmResult, AlgorithmSpec, CodeSection, InputField


def tri(tableau: list[int], ordre: str = "Croissant") -> list[int]:
    """Tri par sélection décroissant, avec inversion finale pour le croissant."""
    t = tableau.copy()
    n = len(t)
    for i in range(n - 1):
        p = i
        for j in range(i + 1, n):
            if t[j] > t[p]:
                p = j
        if p != i:
            t[i], t[p] = t[p], t[i]
    if ordre == "Croissant":
        return t[::-1]
    if ordre == "Décroissant":
        return t
    raise AlgorithmInputError("L'ordre de tri doit être croissant ou décroissant.")


def afficher_tableau(tableau: list[int]) -> list[int]:
    """Return a copy of the filled array without modifying its order."""
    if not tableau:
        raise AlgorithmInputError("Le tableau doit contenir au moins une valeur.")
    return tableau.copy()


def execute(tableau: list[int], ordre: str = "Aucun") -> AlgorithmResult:
    """Display the original array, or run the optional selection-sort exercise."""
    initial = afficher_tableau(tableau)
    n = len(initial)
    steps = [f"Déclaration : tableau T de {n} éléments (indices de 0 à {n - 1})."]
    for i, value in enumerate(initial[:12]):
        steps.append(f"Remplissage : T[{i}] ← {value}")
    if n > 12:
        steps.append(f"… {n - 12} autres éléments remplis, non détaillés.")

    if ordre == "Aucun":
        steps.append("Affichage : lire T de l'indice 0 au dernier, sans changer l'ordre.")
        return AlgorithmResult(initial, tuple(steps),
                               f"Tableau affiché : {n} élément(s), indices de 0 à {n - 1}. Aucun tri appliqué.")

    if ordre not in ("Croissant", "Décroissant"):
        raise AlgorithmInputError("Choisis Aucun, Croissant ou Décroissant.")

    steps.append(f"Exercice facultatif : tri par sélection ({ordre.lower()}).")
    t = initial.copy()
    for i in range(n - 1):
        p = i
        for j in range(i + 1, n):
            if t[j] > t[p]:
                p = j
        t[i], t[p] = t[p], t[i]
        if i < 8:
            steps.append(f"Tri, passage {i + 1} : {t}")
    if n - 1 > 8:
        steps.append("… autres passages du tri non détaillés.")
    if ordre == "Croissant":
        steps.append("Inversion du résultat décroissant pour obtenir l'ordre croissant.")
    result = tri(initial, ordre)
    steps.append("Affichage du tableau trié.")
    return AlgorithmResult(result, tuple(steps),
                           f"Tri facultatif ({ordre.lower()}) appliqué. Le tableau initial n'est pas modifié.")


SPEC = AlgorithmSpec(
    slug="tableau", name="TABLEAU", full_name="Déclarer, remplir et afficher un tableau",
    category="Structures de données", icon="📊",
    summary="Comprendre la déclaration, le remplissage et l’affichage d’un tableau.",
    principle="Un tableau contient plusieurs valeurs du même type, accessibles par leur indice. On le déclare, on remplit ses cases, puis on les affiche dans l’ordre. ",
    pseudocode="""Procédure REMPLIR(@T : Tab, n : Entier)
Début
    Pour i de 0 à n - 1 Faire
        Lire(T[i])
    Fin Pour
Fin

Procédure AFFICHER(T : Tab, n : Entier)
Début
    Pour i de 0 à n - 1 Faire
        Écrire(T[i])
    Fin Pour
Fin""",
    inputs=(InputField("tableau", "Éléments du tableau", "int_list", "8, 3, 11, 2, 5",
                        hint="Séparer les entiers par des virgules."),
),
    function=afficher_tableau, execute=execute, example="T = [8, 3, 11, 2, 5] ; T[0] = 8 ; n = 5",
    tags=("tableau", "déclaration", "remplissage", "affichage"),
    code_sections=(
        CodeSection(
            title="Déclarer le tableau — TDNT et TDOG",
            pseudocode="""TDNT (Tableau de Déclaration des Nouveaux Types)
    Tab = Tableau de 5 Réels

TDOG (Tableau de Déclaration des Objets Globaux)
    Objet       Type / Nature
    T           Tab
    n           Entier

Exemple : n ← 5""",
            python="""from numpy import array

n = 5
T = array([float()] * n)""",
        ),
        CodeSection(
            title="Remplir manuellement",
            pseudocode="""Procédure REMPLIR(@T : Tab, n : Entier)
Début
    Pour i de 0 à n - 1 Faire
        Lire(T[i])
    Fin Pour
Fin""",
            python="""def remplir(T, n):
    for i in range(n):
        T[i] = float(input("Entrer T[" + str(i) + "] : "))
    return T""",
            note="T et n sont ceux déclarés dans la première étape.",
        ),
        CodeSection(
            title="Remplir aléatoirement",
            pseudocode="""Procédure REMPLIR_ALEATOIRE(@T : Tab, n, mini, maxi : Entier)
Début
    Pour i de 0 à n - 1 Faire
        T[i] ← Aléa(mini, maxi)
    Fin Pour
Fin""",
            python="""from random import randint

def remplir_aleatoire(T, n, mini, maxi):
    for i in range(n):
        T[i] = randint(mini, maxi)
    return T""",
        ),
        CodeSection(
            title="Afficher les éléments",
            pseudocode="""Procédure AFFICHER(T : Tab, n : Entier)
Début
    Pour i de 0 à n - 1 Faire
        Écrire(T[i])
    Fin Pour
Fin""",
            python="""def afficher(T, n):
    for i in range(n):
        print(T[i])""",
        ),
    ),
    limits="Maximum 40 entiers pour garder un atelier facile à lire.",
)
