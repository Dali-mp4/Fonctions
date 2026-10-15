"""Executed ONLY inside an ephemeral, network-blocked Modal Sandbox.

Do not import this module from FastAPI or run user source on the API host.
The payload contains user code and input values, NEVER expected answers or credentials.
"""
import json
import math
import os
import random

MAX_RESULT_BYTES = 60000


def normalize(value, depth=0):
    if depth > 5:
        raise ValueError("Résultat trop profondément imbriqué")
    # Numpy is available in the sandbox image, not necessarily on API hosts.
    try:
        import numpy as np
        if isinstance(value, np.ndarray):
            value = value.tolist()
        elif isinstance(value, np.generic):
            value = value.item()
    except ImportError:
        pass
    if value is None or isinstance(value, (bool, int, str)):
        if isinstance(value, str) and len(value) > 4000:
            raise ValueError("Résultat texte trop long")
        if isinstance(value, int) and not (-9007199254740991 <= value <= 9007199254740991):
            raise ValueError("Entier hors des limites JSON")
        return value
    if isinstance(value, float):
        if not math.isfinite(value):
            raise ValueError("Nombre non fini")
        return value
    if isinstance(value, (list, tuple)):
        if len(value) > 500:
            raise ValueError("Tableau trop grand")
        return [normalize(x, depth + 1) for x in value]
    raise TypeError("Type de résultat non JSON pris en charge")


def infer_array_parameters(args):
    """The input contracts only allow 1D/2D numeric arrays, not arbitrary lists."""
    parameters = []
    for name, value in args.items():
        if isinstance(value, list):
            is_matrix = bool(value) and all(isinstance(row, list) for row in value)
            parameters.append({"name": name, "type": "list[list[int]]" if is_matrix else "list[int]"})
    return parameters


def check_dimensions(args, parameters):
    """School bounds, checked before calling the student's function."""
    for param in parameters:
        name, kind = param["name"], param["type"]
        if kind == "list[int]" and "n" in args:
            n = args["n"]
            if type(n) is not int or n <= 0 or len(args[name]) != n:
                raise ValueError("n doit être positif et correspondre au tableau.")
        if kind == "list[list[int]]":
            rows = args[name]
            if "l" in args and "c" in args:
                l, c = args["l"], args["c"]
                if (type(l) is not int or type(c) is not int or l <= 0 or c <= 0
                    or len(rows) != l or any(len(row) != c for row in rows)):
                    raise ValueError("La matrice doit avoir l lignes et c colonnes, strictement positives.")
            elif "n" in args:
                n = args["n"]
                if (type(n) is not int or n <= 0 or len(rows) != n
                    or any(len(row) != n for row in rows)):
                    raise ValueError("La matrice carrée doit avoir n lignes et n colonnes.")
            elif rows and any(len(row) != len(rows[0]) for row in rows):
                raise ValueError("Les lignes de la matrice doivent avoir la même taille.")


def prepare_inputs(args, parameters):
    """Technical adapter, inside isolated sandbox, before student code runs."""
    if not parameters:
        return dict(args)
    import numpy as np
    prepared = dict(args)
    for param in parameters:
        name, kind = param["name"], param["type"]
        if kind in ("list[int]", "list[list[int]]"):
            prepared[name] = np.array(args[name], dtype=int)
    return prepared


def main():
    # File output avoids trusting stdout; we suppress both stdout/stderr of user code.
    payload = json.loads(open("/tmp/afj-payload.json", encoding="utf-8").read())
    os.dup2(os.open(os.devnull, os.O_WRONLY), 1)
    os.dup2(os.open(os.devnull, os.O_WRONLY), 2)
    source = payload["code"]
    entry = payload["entry"]
    cases = payload["cases"]
    parameters = payload.get("parameters", [])
    results = []
    try:
        namespace = {"__name__": "afj_contribution"}
        exec(compile(source, "contribution.py", "exec"), namespace)
        fn = namespace.get(entry)
        if not callable(fn):
            raise ValueError("Fonction d'entrée introuvable")
        for index, args in enumerate(cases):
            try:
                random.seed(0)
                try:
                    import numpy as np
                    np.random.seed(0)
                except ImportError:
                    pass
                case_params = parameters or infer_array_parameters(args)
                check_dimensions(args, case_params)
                result = normalize(fn(**prepare_inputs(args, case_params)))
                results.append({"ok": True, "value": result})
            except BaseException as exc:
                results.append({"ok": False, "error": f"{type(exc).__name__}: {str(exc)[:320]}"})
    except BaseException as exc:
        results = [{"ok": False, "error": f"{type(exc).__name__}: {str(exc)[:320]}"} for _ in cases]
    data = json.dumps({"results": results}, ensure_ascii=False, allow_nan=False).encode("utf-8")
    if len(data) > MAX_RESULT_BYTES:
        data = json.dumps({"error": "Résultats trop volumineux"}).encode("utf-8")
    with open("/tmp/afj-results.json", "wb") as output:
        output.write(data)


if __name__ == "__main__":
    main()
