"""Check that school-facing snippets remain elementary and usable."""

import ast

from algorithms.registry import discover_algorithms


def _snippets(slug):
    return discover_algorithms()[slug].code_sections


def test_all_modules_have_valid_simple_student_code():
    found = discover_algorithms()
    expected_steps = {
        'pgcd': 1,
        'ppcm': 1,
        'som-ch': 1,
        'verif': 1,
        'tableau': 5,
        'matrice': 4,
        'enregistrement': 3,
    }
    assert {name: len(spec.code_sections) for name, spec in found.items()} == expected_steps
    for spec in found.values():
        for snippet in spec.code_sections:
            assert snippet.title and snippet.pseudocode and snippet.python
            tree = ast.parse(snippet.python)
            assert not any(isinstance(node, (ast.Raise, ast.Try, ast.TryStar)) for node in ast.walk(tree))


def test_tableau_full_classroom_sequence(monkeypatch, capsys):
    declaration, manual, random, display, sort = _snippets('tableau')
    assert 'TDNT' in declaration.pseudocode and 'TDOG' in declaration.pseudocode
    assert 'from numpy import array' in declaration.python
    env = {}
    for lesson in [declaration, manual, random, display, sort]:
        exec(lesson.python, env)
    values = iter(['8', '3', '11', '2', '5'])
    monkeypatch.setattr('builtins.input', lambda prompt: next(values))
    arr = env['remplir'](env['T'], env['n'])
    assert arr.tolist() == [8, 3, 11, 2, 5]
    env['afficher'](arr, env['n'])
    assert capsys.readouterr().out.splitlines() == ['8.0', '3.0', '11.0', '2.0', '5.0']
    assert env['tri'](arr, env['n']).tolist() == [11, 8, 5, 3, 2]
    assert env['tri'](arr, env['n'])[::-1].tolist() == [2, 3, 5, 8, 11]
    assert env['remplir_aleatoire'](arr, env['n'], 2, 2).tolist() == [2] * 5


def test_matrice_full_classroom_sequence(monkeypatch, capsys):
    declaration, manual, random, display = _snippets('matrice')
    assert 'TDNT' in declaration.pseudocode and 'TDOG' in declaration.pseudocode
    assert 'from numpy import array' in declaration.python
    env = {}
    for lesson in [declaration, manual, random, display]:
        exec(lesson.python, env)
    values = iter(['1', '2', '3', '4', '5', '6'])
    monkeypatch.setattr('builtins.input', lambda prompt: next(values))
    mat = env['remplir'](env['M'], env['l'], env['c'])
    assert mat.tolist() == [[1, 2, 3], [4, 5, 6]]
    env['afficher'](mat, env['l'], env['c'])
    assert capsys.readouterr().out.splitlines() == ['1.0', '2.0', '3.0', '4.0', '5.0', '6.0']
    assert env['remplir_aleatoire'](mat, env['l'], env['c'], 9, 9).tolist() == [[9, 9, 9], [9, 9, 9]]


def test_enregistrement_classroom_sequence(monkeypatch, capsys):
    declaration, fill, display = _snippets('enregistrement')
    assert 'TDNT' in declaration.pseudocode and 'TDOG' in declaration.pseudocode
    env = {}
    for lesson in [declaration, fill, display]:
        exec(lesson.python, env)
    values = iter(['Amira', '17', 'Vrai'])
    monkeypatch.setattr('builtins.input', lambda prompt: next(values))
    e = env['remplir'](env['E'])
    assert e == {'nom': 'Amira', 'age': 17, 'admis': True}
    env['afficher'](e)
    assert capsys.readouterr().out.splitlines() == ['Amira', '17', 'True']
