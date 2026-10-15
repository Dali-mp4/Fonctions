"""Regression tests for repository-reviewed 3ème Info educational fixtures.

These are checked-in source-code fixtures, NOT contributor code loaded from a
database. Untrusted student code is executed only inside the Modal sandbox.
"""
import ast
import json
from pathlib import Path

from fastapi.testclient import TestClient
from app.main import app

ROOT = Path(__file__).resolve().parents[2]


def curriculum_rules():
    sql = (ROOT / "supabase/migrations/020_explicit_array_dimensions.sql").read_text(encoding="utf-8")
    return json.loads(sql.split("$rules$", 2)[1])


def test_all_nine_numpy_methods_require_explicit_dimensions_and_pass_examples():
    rules = curriculum_rules()
    assert len(rules) == 9
    for rule in rules:
        entry = rule["entry"]
        names = [p["name"] for p in rule["params"]]
        assert "len(" not in rule["code"], entry
        assert "from numpy import array" in rule["code"], entry
        if any(p["type"] == "list[list[int]]" for p in rule["params"]):
            assert names == ["matrice", "l", "c"], entry
            assert "range(total" in rule["code"], entry
        else:
            assert "n" in names, entry
            assert "range(n" in rule["code"] or "range(1, n" in rule["code"] or "range(n -" in rule["code"], entry

        parsed = ast.parse(rule["code"])
        functions = [node for node in parsed.body if isinstance(node, ast.FunctionDef)]
        assert len(functions) == 1 and functions[0].name == entry
        assert [arg.arg for arg in functions[0].args.args] == names
        # These fixtures are maintained in Git; no database/user source is evaluated.
        namespace = {}
        exec(compile(parsed, f"reviewed_fixture_{entry}", "exec"), namespace)
        assert callable(namespace[entry])


def test_numpy_methods_produce_expected_results_for_migrated_test_inputs():
    # Cases here mirror the draft examples. Never run arbitrary DB Python here.
    rules = {x["entry"]: x for x in curriculum_rules()}
    examples = {
        "parcours_tableau": (([8, 3, 11], 3), [8, 3, 11]),
        "maximum_tableau": (([-4, -2, -9], 3), -2),
        "recherche_sequentielle": (([8, 4, 8], 3, 8), 0),
        "recherche_dichotomique": (([2, 5, 8, 11, 17], 5, 11), 3),
        "tri_selection": (([7, 3, 5, 1], 4), [1, 3, 5, 7]),
        "tri_bulles": (([5, 2, 4], 3), [2, 4, 5]),
        "tri_selection_matrice": (([[9, 1, 5], [3, 7, 2]], 2, 3), [[1, 2, 3], [5, 7, 9]]),
        "tri_bulles_matrice": (([[6, 1], [9, 3]], 2, 2), [[1, 3], [6, 9]]),
        "meilleur_eleve": (("Ali,Sana,Med", [12, 17, 15], 3), "Sana"),
    }
    assert set(examples) == set(rules)
    for entry, (arguments, expected) in examples.items():
        namespace = {}
        exec(compile(rules[entry]["code"], f"reviewed_fixture_{entry}", "exec"), namespace)
        assert namespace[entry](*arguments) == expected, entry


def test_public_builtins_reject_missing_or_incorrect_dimension_parameters():
    client = TestClient(app)
    assert client.post("/api/v1/algorithms/tableau/run",
        json={"inputs": {"tableau": [2, 1, 5], "n": 3}}).json()["value"] == [2, 1, 5]
    assert client.post("/api/v1/algorithms/matrice/run",
        json={"inputs": {"matrice": [[1, 2, 3], [4, 5, 6]], "l": 2, "c": 3}}).json()["value"] == [[1, 2, 3], [4, 5, 6]]
    for slug, bad in [
        ("tableau", {"tableau": [1, 2]}),
        ("tableau", {"tableau": [1, 2], "n": 3}),
        ("matrice", {"matrice": [[1, 2], [3, 4]]}),
        ("matrice", {"matrice": [[1, 2], [3, 4]], "l": 2, "c": 3}),
    ]:
        assert client.post(f"/api/v1/algorithms/{slug}/run",
            json={"inputs": bad}).status_code == 422, (slug, bad)
