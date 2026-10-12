"""Typed named entries: a Python dictionary as an introduction to fields."""

from .schema import AlgorithmInputError, AlgorithmResult, AlgorithmSpec, CodeSection, InputField


def enregistrer(champs: list[dict[str, str]]) -> dict[str, object]:
    """Construire un dictionnaire de valeurs typées à partir des champs."""
    resultat: dict[str, object] = {}
    for champ in champs:
        nom = champ["nom"].strip()
        typ = champ["type"].lower().strip()
        texte = str(champ["valeur"])
        if not nom or not nom.isidentifier():
            raise AlgorithmInputError(f"Nom de champ invalide : {nom!r}. Utilisez un identifiant Python.")
        if nom in resultat:
            raise AlgorithmInputError(f"Nom de champ répété : {nom}.")
        try:
            if typ == "entier":
                valeur = int(texte)
            elif typ == "réel":
                valeur = float(texte.replace(",", "."))
            elif typ == "chaîne":
                valeur = texte
            elif typ == "booléen":
                if texte.strip().lower() not in {"vrai", "faux", "true", "false"}:
                    raise AlgorithmInputError(f"Valeur booléenne invalide pour {nom} : utiliser Vrai ou Faux.")
                valeur = texte.strip().lower() in {"vrai", "true"}
            else:
                raise AlgorithmInputError(f"Type inconnu pour {nom} : {typ}.")
        except ValueError as exc:
            raise AlgorithmInputError(f"La valeur de {nom} ne correspond pas au type {typ}.") from exc
        resultat[nom] = valeur
    return resultat


def execute(champs: list[dict[str, str]]) -> AlgorithmResult:
    resultat = enregistrer(champs)
    if not resultat:
        raise AlgorithmInputError("Ajoutez au moins un champ avant de valider.")
    steps = tuple(f"Champ « {nom} » ← {valeur!r} ({type(valeur).__name__})" for nom, valeur in resultat.items())
    return AlgorithmResult(resultat, steps,
                           "Démonstration en dictionnaire Python ; un enregistrement typé scolaire est une notion distincte.")


SPEC = AlgorithmSpec(
    slug="enregistrement", name="ENREGISTREMENT", full_name="Valeurs nommées et typées",
    category="Structures de données", icon="🗂️",
    summary="Définir des champs nommés avec des valeurs de types différents.",
    principle="Associer un nom, un type et une valeur à chaque champ, puis les regrouper. Ici, la représentation Python est un dictionnaire.",
    pseudocode="""// Illustration d'un enregistrement scolaire à champs fixes
Type Élève = Enregistrement
    nom : Chaîne
    age : Entier
    admis : Booléen
Fin Enregistrement

// Le dictionnaire Python utilisé dans l'atelier est
// une représentation pédagogique, pas un type identique.""",
    inputs=(InputField("champs", "Champs de l'enregistrement", "records",
                        (("nom", "chaîne", "Amira"), ("age", "entier", "17"), ("admis", "booléen", "Vrai"))),),
    function=enregistrer, execute=execute,
    example="nom = 'Amira' · age = 17 · admis = Vrai",
    tags=("enregistrement", "types", "champs"),
    code_sections=(
        CodeSection(
            title="Déclarer un enregistrement — TDNT et TDOG",
            pseudocode="""TDNT (Tableau de Déclaration des Nouveaux Types)
    Eleve = Enregistrement
        nom : Chaîne
        age : Entier
        admis : Booléen
    Fin

TDOG (Tableau de Déclaration des Objets Globaux)
    Objet       Type / Nature
    E           Eleve""",
            python="""E = {
    "nom": str(),
    "age": int(),
    "admis": bool()
}""",
            note="Exemple fixe à trois champs. L'atelier permet aussi d'ajouter d'autres champs : c'est une interface plus générale.",
        ),
        CodeSection(
            title="Remplir les champs",
            pseudocode="""Procédure REMPLIR(@E : Eleve)
Début
    Lire(E.nom)
    Lire(E.age)
    Lire(E.admis)
Fin""",
            python="""def remplir(E):
    E["nom"] = input("Entrer le nom : ")
    E["age"] = int(input("Entrer l'âge : "))
    E["admis"] = input("Admis (Vrai/Faux) : ") == "Vrai"
    return E""",
        ),
        CodeSection(
            title="Afficher les champs",
            pseudocode="""Procédure AFFICHER(E : Eleve)
Début
    Écrire(E.nom)
    Écrire(E.age)
    Écrire(E.admis)
Fin""",
            python="""def afficher(E):
    print(E["nom"])
    print(E["age"])
    print(E["admis"])""",
        ),
    ),
    limits="Les noms de champs doivent être uniques et valides. Démonstration via un dictionnaire Python.",
)
