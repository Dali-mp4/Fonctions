"""Validate persisted data before calling a paid sandbox. No Python execution."""
import re
import math

NAME = re.compile(r"^[A-Za-z_][A-Za-z0-9_]{0,63}$")
TYPES = {"int", "float", "str", "bool", "list[int]", "list[list[int]]"}


def value_matches(value, kind):
    if kind == "int":
        return type(value) is int and abs(value) <= 9007199254740991
    if kind == "float":
        return type(value) in (int, float) and math.isfinite(value)
    if kind == "str":
        return isinstance(value, str) and len(value) <= 4000
    if kind == "bool":
        return type(value) is bool
    if kind == "list[int]":
        return isinstance(value, list) and len(value) <= 500 and all(value_matches(v, "int") for v in value)
    if kind == "list[list[int]]":
        return isinstance(value, list) and len(value) <= 100 and all(
            isinstance(r, list) and len(r) <= 100 and all(value_matches(v, "int") for v in r) for r in value
        )
    return False


def validate_array_dimensions(args, parameters):
    """Reject mismatched dimensions on API host, before metered sandbox work."""
    for param in parameters:
        name, kind = param["name"], param["type"]
        if kind == "list[int]" and "n" in args:
            n = args["n"]
            if type(n) is not int or n <= 0 or len(args[name]) != n:
                raise ValueError("La taille n doit être positive et correspondre au tableau.")
        if kind == "list[list[int]]":
            matrix = args[name]
            if "l" in args and "c" in args:
                l, c = args["l"], args["c"]
                if (type(l) is not int or type(c) is not int or l <= 0 or c <= 0
                        or len(matrix) != l or any(len(row) != c for row in matrix)):
                    raise ValueError("La matrice doit avoir l lignes et c colonnes, strictement positives.")
            elif "n" in args:
                n = args["n"]
                if (type(n) is not int or n <= 0 or len(matrix) != n
                        or any(len(row) != n for row in matrix)):
                    raise ValueError("La matrice carrée doit avoir n lignes et n colonnes (n positif).")
            elif matrix and any(len(row) != len(matrix[0]) for row in matrix):
                raise ValueError("Toutes les lignes doivent avoir la même longueur.")


def validate_revision(revision):
    code, entry = revision.get("python_code"), revision.get("entry_function")
    schema, cases = revision.get("input_schema"), revision.get("test_cases")
    if not isinstance(code, str) or not 10 <= len(code) <= 30000:
        raise ValueError("Code Python invalide")
    if not isinstance(entry, str) or not NAME.fullmatch(entry):
        raise ValueError("Nom de fonction invalide")
    if not isinstance(schema, dict) or set(schema) != {"parameters", "returns"}:
        raise ValueError("Définition de fonction invalide")
    params, ret = schema["parameters"], schema["returns"]
    if not isinstance(params, list) or not 0 <= len(params) <= 8 or ret not in TYPES:
        raise ValueError("Types de paramètres invalides")
    names = []
    for p in params:
        if not isinstance(p, dict) or set(p) != {"name", "type"} or not isinstance(p["name"], str) or not NAME.fullmatch(p["name"]) or p["type"] not in TYPES or p["name"] in names:
            raise ValueError("Paramètre invalide ou répété")
        names.append(p["name"])
    if not isinstance(cases, list) or not 1 <= len(cases) <= 20:
        raise ValueError("Ajoute entre 1 et 20 cas de test avant de lancer Python")
    for case in cases:
        if not isinstance(case, dict) or not {"inputs", "expected"} <= set(case):
            raise ValueError("Cas de test invalide")
        args = case["inputs"]
        if not isinstance(args, dict) or set(args) != set(names) or not value_matches(case["expected"], ret):
            raise ValueError("Entrées ou résultat attendu incompatibles")
        if not all(value_matches(args[p["name"]], p["type"]) for p in params):
            raise ValueError("Type d'entrée invalide")
        validate_array_dimensions(args, params)
    return code, entry, cases, ret


def compare_outputs(outputs, cases, return_type):
    if len(outputs) != len(cases):
        raise ValueError("Résultat du sandbox incomplet")
    report = []
    for i, (actual, case) in enumerate(zip(outputs, cases)):
        label = (case.get("label") or f"Test {i + 1}")[:100]
        if not isinstance(actual, dict) or type(actual.get("ok")) is not bool:
            raise ValueError("Réponse du sandbox invalide")
        if not actual["ok"]:
            report.append({"label": label, "passed": False, "error": str(actual.get("error", "Erreur d'exécution"))[:400]})
        else:
            value = actual.get("value")
            passed = value_matches(value, return_type) and value == case["expected"]
            report.append({"label": label, "passed": passed, "expected": case["expected"], "actual": value})
    return report
