"""Sum the digits of a non-negative integer."""

from .schema import AlgorithmInputError, AlgorithmResult, AlgorithmSpec, CodeSection, InputField


def som_ch(a: int) -> int:
    if a < 0:
        raise AlgorithmInputError("Entrez un entier positif ou nul.")
    s = 0
    ch = str(a)
    for i in range(len(ch)):
        s += int(ch[i])
    return s


def execute(a: int) -> AlgorithmResult:
    if a < 0:
        raise AlgorithmInputError("Entrez un entier positif ou nul.")
    digits = list(str(a))
    count = 0
    steps = []
    for digit in digits:
        before = count
        count += int(digit)
        steps.append(f"s = {before} + {digit} = {count}")
    return AlgorithmResult(som_ch(a), tuple(steps), "Chaque chiffre est transformé en entier puis ajouté.")


SPEC = AlgorithmSpec(
    slug="som-ch", name="SOM_CH", full_name="Somme des chiffres",
    category="Traitement", icon="🧮",
    summary="Calculer la somme de tous les chiffres d'un entier.",
    principle="Convertir le nombre en chaîne, parcourir chaque caractère et additionner sa valeur numérique.",
    pseudocode="""Fonction SOM_CH(n : Entier) : Entier
Début
    ch ← Convch(n)
    s ← 0
    Pour i de 0 à Long(ch) - 1 Faire
        s ← s + Valeur(ch[i])
    Fin Pour
    Retourner s
Fin""",
    inputs=(InputField("a", "Nombre entier (n)", "int", 4825, 0, 999999999),),
    function=som_ch, execute=execute, example="SOM_CH(4825) = 19",
    tags=("chaînes", "parcours", "addition"),
    code_sections=(
        CodeSection(
            title="Somme des chiffres d'un nombre",
            pseudocode="""Fonction SOM_CH(a : Entier) : Entier
Début
    s ← 0
    ch ← Convch(a)
    Pour i de 0 à Long(ch) - 1 Faire
        s ← s + Valeur(ch[i])
    Fin Pour
    Retourner s
Fin""",
            python="""def som_ch(a):
    s = 0
    ch = str(a)
    for i in range(len(ch)):
        s = s + int(ch[i])
    return s""",
            note="Comme dans ton code initial : conversion en chaîne puis parcours caractère par caractère.",
        ),
    ),
    limits="Entier positif ou nul ; au plus 9 chiffres dans ce démonstrateur.",
)
