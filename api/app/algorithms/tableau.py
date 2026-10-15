"""Tableau: classroom-style declaration, filling and display; sorting is taught in TRI."""

from .schema import AlgorithmInputError, AlgorithmResult, AlgorithmSpec, CodeSection, InputField


from numpy import array

def afficher_tableau(tableau: list[int], n: int) -> list[int]:
    """Un tableau NumPy se parcourt avec n transmis en paramètre."""
    if n <= 0:
        raise AlgorithmInputError("n doit être strictement positif.")
    T = array(tableau, dtype=int)
    if T.shape != (n,):
        raise AlgorithmInputError("Le nombre d'éléments doit être égal à n.")
    R = array([int()] * n)
    for i in range(n):
        R[i] = T[i]
    return R.tolist()


def execute(tableau: list[int], n: int) -> AlgorithmResult:
    resultat = afficher_tableau(tableau, n)
    steps = [f"Déclaration NumPy : tableau T de {n} éléments (indices de 0 à {n - 1})."]
    for i in range(min(n, 12)):
        steps.append(f"Remplissage : T[{i}] ← {resultat[i]}")
    if n > 12:
        steps.append(f"… {n - 12} autres valeurs non détaillées.")
    steps.append("Affichage : parcourir T de l'indice 0 au dernier, sans changer l'ordre.")
    return AlgorithmResult(resultat, tuple(steps),
        f"Tableau NumPy affiché : {n} élément(s). Aucun tri appliqué.")


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
    inputs=(
        InputField("tableau", "Éléments du tableau", "int_list", "8, 3, 11, 2, 5",
                   hint="Séparer les entiers par des virgules."),
        InputField("n", "Taille du tableau (n)", "int", 5,
                   min_value=1, max_value=40, hint="n doit être égal au nombre de valeurs."),
    ),
    function=afficher_tableau, execute=execute, example="T = array([8, 3, 11, 2, 5]) ; T[0] = 8 ; n = 5",
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
