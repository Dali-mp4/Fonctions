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


def main():
    # File output avoids trusting stdout; we suppress both stdout/stderr of user code.
    payload = json.loads(open("/tmp/afj-payload.json", encoding="utf-8").read())
    os.dup2(os.open(os.devnull, os.O_WRONLY), 1)
    os.dup2(os.open(os.devnull, os.O_WRONLY), 2)
    source = payload["code"]
    entry = payload["entry"]
    cases = payload["cases"]
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
                result = normalize(fn(**args))
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
