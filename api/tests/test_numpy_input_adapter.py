"""Tests for the trusted Modal NumPy input/output adapter only.

Never execute database-authored/student Python in these API process tests.
"""
import pytest
import numpy as np

from app.runner.harness import infer_array_parameters, prepare_inputs, check_dimensions, normalize
from app.runner.contracts import validate_array_dimensions


def test_numpy_inputs_are_prepared_away_from_student_code():
    inputs = {"t": [7, 3, 5, 1], "n": 4}
    params = infer_array_parameters(inputs)
    prepared = prepare_inputs(inputs, params)
    assert isinstance(prepared["t"], np.ndarray)
    assert list(prepared["t"]) == [7, 3, 5, 1]
    assert prepared["n"] == 4
    assert inputs["t"] == [7, 3, 5, 1]
    prepared["t"][0] = 1
    assert inputs["t"][0] == 7
    assert normalize(prepared["t"]) == [1, 3, 5, 1]


def test_matrix_with_l_and_c_supports_m_i_j_indexing():
    inputs = {"matrice": [[1, 2, 3], [4, 5, 6]], "l": 2, "c": 3}
    prepared = prepare_inputs(inputs, infer_array_parameters(inputs))
    assert prepared["matrice"][1, 2] == 6
    assert normalize(prepared["matrice"]) == [[1, 2, 3], [4, 5, 6]]


def test_square_matrix_uses_n_not_inferred_length():
    inputs = {"matrice": [[2, 3], [4, 5]], "n": 2}
    params = infer_array_parameters(inputs)
    check_dimensions(inputs, params)
    validate_array_dimensions(inputs, params)
    with pytest.raises(ValueError):
        check_dimensions({**inputs, "n": 3}, params)
    with pytest.raises(ValueError):
        validate_array_dimensions({**inputs, "n": 3}, params)


@pytest.mark.parametrize("bad", [
    {"t": [1, 2], "n": 3},
    {"t": [1, 2], "n": 0},
    {"matrice": [[1, 2], [3, 4]], "l": 2, "c": 3},
    {"matrice": [[1, 2], [3, 4]], "l": 0, "c": 0},
    {"matrice": [[1, 2], [3]], "l": 2, "c": 2},
])
def test_inconsistent_dimensions_are_rejected(bad):
    params = infer_array_parameters(bad)
    with pytest.raises(ValueError):
        check_dimensions(bad, params)
    with pytest.raises(ValueError):
        validate_array_dimensions(bad, params)


def test_integers_and_text_are_left_unchanged():
    inputs = {"noms": "Ali,Sana,Med", "notes": [12, 17, 15], "n": 3}
    prepared = prepare_inputs(inputs, infer_array_parameters(inputs))
    assert prepared["noms"] == "Ali,Sana,Med"
    assert prepared["n"] == 3
    assert isinstance(prepared["notes"], np.ndarray)
    assert normalize(np.int64(12)) == 12
