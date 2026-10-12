"""PGCD by repeated subtraction, following the original project."""

from .schema import AlgorithmInputError, AlgorithmResult, AlgorithmSpec, CodeSection, InputField


def pgcd(a: int, b: int) -> int:
    """PGCD de deux entiers strictement positifs par soustractions."""
    if a <= 0 or b <= 0:
        raise AlgorithmInputError("Le PGCD nécessite deux entiers strictement positifs.")
    while a != b:
        if a > b:
            a -= b
        else:
            b -= a
    return a


def execute(a: int, b: int) -> AlgorithmResult:
    if a <= 0 or b <= 0:
        raise AlgorithmInputError("Le PGCD nécessite deux entiers strictement positifs.")
    x, y = a, b
    steps = [f"Départ : a = {x}, b = {y}"]
    iterations = 0
    while x != y:
        if x > y:
            x -= y
        else:
            y -= x
        iterations += 1
        if iterations <= 16:
            steps.append(f"Soustraction {iterations} : a = {x}, b = {y}")
    if iterations > 16:
        steps.append(f"… {iterations - 16} étapes intermédiaires non affichées.")
    steps.append(f"a = b = {x}. Le PGCD vaut {x}.")
    return AlgorithmResult(pgcd(a, b), tuple(steps), f"{iterations} soustraction(s) effectuée(s).")


SPEC = AlgorithmSpec(
    slug="pgcd", name="PGCD", full_name="Plus Grand Commun Diviseur",
    category="Mathématiques", icon="🔢",
    summary="Trouver le plus grand diviseur commun de deux entiers.",
    principle="On retranche le plus petit entier du plus grand jusqu'à obtenir deux valeurs égales.",
    pseudocode="""Fonction PGCD(a, b : Entier) : Entier
Début
    Tant que a ≠ b Faire
        Si a > b Alors
            a ← a - b
        Sinon
            b ← b - a
        Fin Si
    Fin Tant que
    Retourner a
Fin""",
    inputs=(InputField("a", "Premier entier (a)", "int", 48, 1, 10000),
            InputField("b", "Deuxième entier (b)", "int", 18, 1, 10000)),
    function=pgcd, execute=execute, example="PGCD(48, 18) = 6",
    tags=("entiers", "soustractions", "boucle"),
    code_sections=(
        CodeSection(
            title="Fonction PGCD par soustractions successives",
            pseudocode="""Fonction PGCD(a, b : Entier) : Entier
Début
    Tant que a ≠ b Faire
        Si a > b Alors
            a ← a - b
        Sinon
            b ← b - a
        Fin Si
    Fin Tant que
    Retourner a
Fin""",
            python="""def pgcd(a, b):
    while a != b:
        if a > b:
            a = a - b
        else:
            b = b - a
    return a""",
            note="On utilise deux entiers strictement positifs, comme dans le programme d'origine.",
        ),
    ),
    limits="Deux entiers strictement positifs. La méthode par soustractions est volontairement conservée.",
)
