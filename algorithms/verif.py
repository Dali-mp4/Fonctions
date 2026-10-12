"""Closed-interval membership check."""

from .schema import AlgorithmInputError, AlgorithmResult, AlgorithmSpec, CodeSection, InputField


def verif(a: float, borne_min: float, borne_max: float) -> bool:
    if borne_min > borne_max:
        raise AlgorithmInputError("La borne minimale doit être inférieure ou égale à la borne maximale.")
    return borne_min <= a <= borne_max


def execute(a: float, borne_min: float, borne_max: float) -> AlgorithmResult:
    result = verif(a, borne_min, borne_max)
    steps = (
        f"Vérifier {borne_min:g} ≤ {a:g} : {'vrai' if borne_min <= a else 'faux'}.",
        f"Vérifier {a:g} ≤ {borne_max:g} : {'vrai' if a <= borne_max else 'faux'}.",
        "Les deux conditions sont vraies." if result else "Au moins une condition est fausse.",
    )
    return AlgorithmResult(result, steps, "Les bornes de l'intervalle sont incluses.")


SPEC = AlgorithmSpec(
    slug="verif", name="VERIF", full_name="Appartenance à un intervalle",
    category="Traitement", icon="📏",
    summary="Vérifier si un nombre appartient à un intervalle fermé.",
    principle="Le nombre appartient à [min, max] si et seulement si min ≤ nombre ≤ max.",
    pseudocode="""Fonction VERIF(a, mini, maxi : Réel) : Booléen
Début
    Retourner (mini ≤ a) et (a ≤ maxi)
Fin""",
    inputs=(InputField("a", "Nombre à vérifier", "float", 7.0),
            InputField("borne_min", "Borne minimale", "float", 2.0),
            InputField("borne_max", "Borne maximale", "float", 10.0)),
    function=verif, execute=execute, example="VERIF(7, 2, 10) = Vrai",
    tags=("conditions", "booléen", "intervalle"),
    code_sections=(
        CodeSection(
            title="Vérifier un intervalle fermé",
            pseudocode="""Fonction VERIF(a, mini, maxi : Réel) : Booléen
Début
    Si mini ≤ a ≤ maxi Alors
        Retourner Vrai
    Sinon
        Retourner Faux
    Fin Si
Fin""",
            python="""def VERIF(a, mini, maxi):
    if mini <= a <= maxi:
        return True
    else:
        return False""",
            note="La version originale renvoyait True si le test réussissait. Ici, False est écrit explicitement pour faciliter la lecture.",
        ),
    ),
    limits="Intervalle fermé : les bornes sont incluses. La borne minimale ne peut pas dépasser la maximale.",
)
