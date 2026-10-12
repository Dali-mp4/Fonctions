from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_catalog_has_original_seven():
    response = client.get("/api/v1/algorithms")
    assert response.status_code == 200
    assert {v["slug"] for v in response.json()} == {
        "pgcd", "ppcm", "som-ch", "verif", "tableau", "matrice", "enregistrement"
    }
    for spec in response.json():
        assert spec["method"] == "base"
        assert spec["collection"] == "general"
        assert spec["code_sections"]


def test_pgcd_and_tableau():
    assert client.post("/api/v1/algorithms/pgcd/run", json={"inputs": {"a": 48, "b": 18}}).json()["value"] == 6
    assert client.post("/api/v1/algorithms/tableau/run", json={"inputs": {"tableau": [8, 3, 11, 2, 5], "ordre": "Croissant"}}).json()["value"] == [2, 3, 5, 8, 11]


def test_schema_rejects_extra_unknown_or_huge_payload():
    assert client.post("/api/v1/algorithms/pgcd/run", json={"inputs": {"a": 48, "b": 18, "evil": 1}}).status_code == 422
    assert client.post("/api/v1/algorithms/pgcd/run", json={"inputs": {"a": 0, "b": 18}}).status_code == 422
    assert client.post("/api/v1/algorithms/pgcd/run", json={"inputs": {"a": 10**100, "b": 1}}).status_code == 422
    assert client.post("/api/v1/algorithms/tableau/run", json={"inputs": {"tableau": [1] * 41, "ordre": "Croissant"}}).status_code == 422
    assert client.post("/api/v1/algorithms/matrice/run", json={"inputs": {"matrice": [[1, 2], [3]]}}).status_code == 422
    assert client.post("/api/v1/algorithms/x/run", json={"inputs": {}}).status_code == 404


def test_user_code_is_never_an_execution_parameter():
    r = client.post("/api/v1/algorithms/pgcd/run", json={"inputs": {"a": 3, "b": 6}, "source": "__import__('os').system('id')"})
    assert r.status_code == 422


def test_all_seven_can_be_executed_with_classroom_examples():
    cases = {
        "pgcd": ({"a": 21, "b": 14}, 7),
        "ppcm": ({"a": 12, "b": 18}, 36),
        "som-ch": ({"a": 4825}, 19),
        "verif": ({"a": 3, "borne_min": 0, "borne_max": 10}, True),
        "tableau": ({"tableau": [8, 3, 11, 2, 5], "ordre": "Décroissant"}, [11, 8, 5, 3, 2]),
        "matrice": ({"matrice": [[1, 2], [3, 4]]}, [[1, 2], [3, 4]]),
        "enregistrement": ({"champs": [{"nom": "age", "type": "entier", "valeur": "17"}]}, {"age": 17}),
    }
    for slug, (inputs, expected) in cases.items():
        r = client.post(f"/api/v1/algorithms/{slug}/run", json={"inputs": inputs})
        assert r.status_code == 200, (slug, r.text)
        assert r.json()["value"] == expected, slug


def test_tableau_defaults_to_display_without_sorting():
    values = [8, 3, 11, 2, 5]
    response = client.post(
        "/api/v1/algorithms/tableau/run",
        json={"inputs": {"tableau": values, "ordre": "Aucun"}},
    )
    assert response.status_code == 200
    result = response.json()
    assert result["value"] == values
    assert "Aucun tri" in result["note"]
    assert any("Déclaration" in step for step in result["steps"])
    assert any("Remplissage" in step for step in result["steps"])
    assert any("Affichage" in step for step in result["steps"])
    assert all("Tri, passage" not in step for step in result["steps"])


def test_tableau_sort_is_optional_and_preserves_original():
    values = [8, 3, 11, 2, 5]
    for order, expected in [
        ("Croissant", [2, 3, 5, 8, 11]),
        ("Décroissant", [11, 8, 5, 3, 2]),
    ]:
        r = client.post(
            "/api/v1/algorithms/tableau/run",
            json={"inputs": {"tableau": values, "ordre": order}},
        )
        assert r.status_code == 200
        assert r.json()["value"] == expected
        assert "Tri facultatif" in r.json()["note"]
    assert values == [8, 3, 11, 2, 5]
    assert client.post(
        "/api/v1/algorithms/tableau/run",
        json={"inputs": {"tableau": values, "ordre": "Inconnu"}},
    ).status_code == 422


def test_classroom_tableau_content_prioritizes_array_basics():
    spec = client.get("/api/v1/algorithms/tableau").json()
    assert "remplir" in spec["title"]
    assert "affichage" in spec["summary"]
    assert spec["inputs"][1]["default"] == "Aucun"
    assert spec["inputs"][1]["options"] == ["Aucun", "Croissant", "Décroissant"]
    assert [c["title"] for c in spec["code_sections"]][:4] == [
        "Déclarer le tableau — TDNT et TDOG",
        "Remplir manuellement",
        "Remplir aléatoirement",
        "Afficher les éléments",
    ]
    assert "facultatif" in spec["code_sections"][-1]["title"]


def test_matrice_stays_unchanged_and_has_no_sort_option():
    spec = client.get("/api/v1/algorithms/matrice").json()
    assert len(spec["inputs"]) == 1
    assert spec["inputs"][0]["name"] == "matrice"
    assert all("trier" not in c["title"].lower() for c in spec["code_sections"])
    r = client.post(
        "/api/v1/algorithms/matrice/run",
        json={"inputs": {"matrice": [[8, 3, 11], [2, 5, 1]]}},
    )
    assert r.status_code == 200
    assert r.json()["value"] == [[8, 3, 11], [2, 5, 1]]


def test_tableau_omitting_sort_choice_also_defaults_to_display():
    r = client.post(
        "/api/v1/algorithms/tableau/run",
        json={"inputs": {"tableau": [7, 1, 5]}},
    )
    assert r.status_code == 200
    assert r.json()["value"] == [7, 1, 5]
    assert "Aucun tri" in r.json()["note"]
