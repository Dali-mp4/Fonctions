"""Selection sort, preserving the descending-first strategy from the project."""

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


def execute(tableau: list[int], ordre: str) -> AlgorithmResult:
    if not tableau:
        raise AlgorithmInputError("Le tableau doit contenir au moins une valeur.")
    t = tableau.copy()
    steps = ["Tableau initial : " + str(t)]
    for i in range(len(t) - 1):
        p = i
        for j in range(i + 1, len(t)):
            if t[j] > t[p]:
                p = j
        t[i], t[p] = t[p], t[i]
        if i < 12:
            steps.append(f"Passage {i + 1} : maximum placé en position {i + 1} → {t}")
    if len(t) - 1 > 12:
        steps.append("… autres passages non affichés.")
    if ordre == "Croissant":
        steps.append("Inversion du résultat pour obtenir l'ordre croissant.")
    result = tri(tableau, ordre)
    steps.append("Résultat : " + str(result))
    return AlgorithmResult(result, tuple(steps), "Tri par sélection ; la liste de départ n'est pas modifiée.")


SPEC = AlgorithmSpec(
    slug="tableau", name="TABLEAU", full_name="Tableau et tri par sélection",
    category="Structures de données", icon="📊",
    summary="Remplir un tableau puis le trier par sélection.",
    principle="À chaque passage, placer le maximum à sa position. Le tri d'origine est décroissant ; l'ordre croissant s'obtient par inversion.",
    pseudocode="""Fonction TRI(T : Tableau d'Entier, n : Entier) : Tableau
Début
    Pour i de 0 à n - 2 Faire
        p ← i
        Pour j de i + 1 à n - 1 Faire
            Si T[j] > T[p] Alors
                p ← j
            Fin Si
        Fin Pour
        Si p ≠ i Alors
            aux ← T[i]
            T[i] ← T[p]
            T[p] ← aux
        Fin Si
    Fin Pour
    Retourner T
Fin
// Ordre décroissant ; inverser le tableau pour l'ordre croissant.""",
    inputs=(InputField("tableau", "Éléments du tableau", "int_list", "8, 3, 11, 2, 5",
                        hint="Séparer les entiers par des virgules."),
            InputField("ordre", "Ordre de tri", "choice", "Croissant", options=("Croissant", "Décroissant"))),
    function=tri, execute=execute, example="[8, 3, 11, 2, 5] → [2, 3, 5, 8, 11]",
    tags=("tableau", "tri", "sélection"),
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
        CodeSection(
            title="Trier le tableau (tri par sélection)",
            pseudocode="""Fonction TRI(T : Tab, n : Entier) : Tab
Début
    Pour i de 0 à n - 2 Faire
        p ← i
        Pour j de i + 1 à n - 1 Faire
            Si T[j] > T[p] Alors
                p ← j
            Fin Si
        Fin Pour
        Si p ≠ i Alors
            a ← T[i]
            T[i] ← T[p]
            T[p] ← a
        Fin Si
    Fin Pour
    Retourner T
Fin""",
            python="""def tri(T, n):
    for i in range(n - 1):
        p = i
        for j in range(i + 1, n):
            if T[j] > T[p]:
                p = j
        if p != i:
            a = T[i]
            T[i] = T[p]
            T[p] = a
    return T""",
            note="C'est ton tri par sélection d'origine, en ordre décroissant. Pour afficher l'ordre croissant : changer ">" par "<".",
        ),
    ),
    limits="Maximum 40 entiers pour garder un atelier facile à lire.",
)
