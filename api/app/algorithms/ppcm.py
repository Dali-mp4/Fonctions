"""PPCM by repeated addition, following the original project."""

from .schema import AlgorithmInputError, AlgorithmResult, AlgorithmSpec, CodeSection, InputField


def ppcm(a: int, b: int) -> int:
    """PPCM de deux entiers positifs en parcourant les multiples de a."""
    if a <= 0 or b <= 0:
        raise AlgorithmInputError("Le PPCM nécessite deux entiers strictement positifs.")
    m = a
    while m % b != 0:
        m += a
    return m


def execute(a: int, b: int) -> AlgorithmResult:
    if a <= 0 or b <= 0:
        raise AlgorithmInputError("Le PPCM nécessite deux entiers strictement positifs.")
    m = a
    steps = [f"Départ : m = {m} (premier multiple de {a})."]
    iterations = 0
    while m % b != 0:
        m += a
        iterations += 1
        if iterations <= 16:
            steps.append(f"m ← m + {a} = {m} ; reste de m / {b} : {m % b}.")
    if iterations > 16:
        steps.append(f"… {iterations - 16} étapes intermédiaires non affichées.")
    steps.append(f"{m} est divisible par {a} et {b}. PPCM = {m}.")
    return AlgorithmResult(ppcm(a, b), tuple(steps), f"{iterations} addition(s) supplémentaire(s).")


SPEC = AlgorithmSpec(
    slug="ppcm", name="PPCM", full_name="Plus Petit Commun Multiple",
    category="Mathématiques", icon="➗",
    summary="Trouver le plus petit multiple commun de deux entiers.",
    principle="On teste les multiples successifs du premier nombre jusqu'à trouver un multiple du second.",
    pseudocode="""Fonction PPCM(a, b : Entier) : Entier
Début
    m ← a
    Tant que m mod b ≠ 0 Faire
        m ← m + a
    Fin Tant que
    Retourner m
Fin""",
    inputs=(InputField("a", "Premier entier (a)", "int", 12, 1, 10000),
            InputField("b", "Deuxième entier (b)", "int", 18, 1, 10000)),
    function=ppcm, execute=execute, example="PPCM(12, 18) = 36",
    tags=("multiples", "boucle", "mod"),
    code_sections=(
        CodeSection(
            title="Fonction PPCM par additions successives",
            pseudocode="""Fonction PPCM(a, b : Entier) : Entier
Début
    m ← a
    Tant que m mod b ≠ 0 Faire
        m ← m + a
    Fin Tant que
    Retourner m
Fin""",
            python="""def ppcm(a, b):
    m = a
    while m % b != 0:
        m = m + a
    return m""",
            note="On utilise deux entiers strictement positifs.",
        ),
    ),
    limits="Deux entiers strictement positifs ; limites d'entrée pour garder une exécution fluide.",
)
