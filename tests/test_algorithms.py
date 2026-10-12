"""Run from project root: python -m pytest -q"""

import pytest
import inspect
from pathlib import Path

from algorithms.registry import discover_algorithms
from algorithms.schema import AlgorithmInputError, AlgorithmSpec
from algorithms.pgcd import pgcd
from algorithms.ppcm import ppcm
from algorithms.som_ch import som_ch
from algorithms.verif import verif
from algorithms.tableau import tri
from algorithms.enregistrement import enregistrer
from algorithms.matrice import remplir_matrice


def test_discovery():
    found = discover_algorithms()
    assert set(found) == {"pgcd", "ppcm", "som-ch", "verif", "tableau", "enregistrement", "matrice"}
    assert all(isinstance(v, AlgorithmSpec) for v in found.values())
    for spec in found.values():
        source = Path(inspect.getfile(spec.function)).read_text(encoding="utf-8")
        assert "import streamlit" not in source and "from streamlit" not in source


@pytest.mark.parametrize("a,b,expected", [(48, 18, 6), (21, 14, 7), (7, 7, 7), (1, 999, 1)])
def test_pgcd(a, b, expected):
    assert pgcd(a, b) == expected


def test_pgcd_rejects_zero():
    with pytest.raises(AlgorithmInputError):
        pgcd(0, 5)


@pytest.mark.parametrize("a,b,expected", [(12, 18, 36), (4, 6, 12), (7, 7, 7), (1, 9, 9)])
def test_ppcm(a, b, expected):
    assert ppcm(a, b) == expected


def test_ppcm_rejects_zero():
    with pytest.raises(AlgorithmInputError):
        ppcm(5, 0)


@pytest.mark.parametrize("n,s", [(4825, 19), (0, 0), (10010, 2), (999, 27)])
def test_som_ch(n, s):
    assert som_ch(n) == s


def test_som_ch_negative():
    with pytest.raises(AlgorithmInputError):
        som_ch(-10)


def test_verif_inclusive_and_exclusive():
    assert verif(2, 2, 10)
    assert verif(10, 2, 10)
    assert not verif(1, 2, 10)
    assert not verif(11, 2, 10)
    with pytest.raises(AlgorithmInputError):
        verif(3, 8, 2)


def test_selection_sort_both_orders_and_no_mutation():
    original = [8, 3, -1, 2, 8]
    assert tri(original, "Croissant") == [-1, 2, 3, 8, 8]
    assert tri(original, "Décroissant") == [8, 8, 3, 2, -1]
    assert original == [8, 3, -1, 2, 8]
    with pytest.raises(AlgorithmInputError):
        tri(original, "autre")


def test_record_type_conversions():
    entries = [
        {"nom": "age", "type": "entier", "valeur": "17"},
        {"nom": "moyenne", "type": "réel", "valeur": "14,5"},
        {"nom": "nom", "type": "chaîne", "valeur": "Amira"},
        {"nom": "admis", "type": "booléen", "valeur": "Vrai"},
    ]
    assert enregistrer(entries) == {"age": 17, "moyenne": 14.5, "nom": "Amira", "admis": True}


def test_record_rejects_duplicate_and_invalid_values():
    with pytest.raises(AlgorithmInputError):
        enregistrer([{"nom": "age", "type": "entier", "valeur": "2"},
                    {"nom": "age", "type": "entier", "valeur": "3"}])
    with pytest.raises(AlgorithmInputError):
        enregistrer([{"nom": "age", "type": "entier", "valeur": "abc"}])
    with pytest.raises(AlgorithmInputError):
        enregistrer([{"nom": "ok", "type": "booléen", "valeur": "yes"}])


def test_matrix_copy_and_rectangle_validation():
    original = [[1, 2], [3, 4]]
    result = remplir_matrice(original)
    assert result == original
    assert result is not original
    assert result[0] is not original[0]
    with pytest.raises(AlgorithmInputError):
        remplir_matrice([[1, 2], [3]])


def test_all_executors():
    kwargs = {
        "pgcd": {"a": 48, "b": 18},
        "ppcm": {"a": 12, "b": 18},
        "som-ch": {"a": 4825},
        "verif": {"a": 3, "borne_min": 0, "borne_max": 10},
        "tableau": {"tableau": [3, 9, 1], "ordre": "Croissant"},
        "enregistrement": {"champs": [{"nom": "prenom", "type": "chaîne", "valeur": "Ali"}]},
        "matrice": {"matrice": [[1, 2], [3, 4]]},
    }
    for slug, spec in discover_algorithms().items():
        result = spec.execute(**kwargs[slug])
        assert result.steps, f"missing educational trace for {slug}"
        assert result.value is not None
