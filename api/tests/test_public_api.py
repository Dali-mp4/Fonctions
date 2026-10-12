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
