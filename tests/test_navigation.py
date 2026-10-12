"""Regression test: Streamlit creates widgets in every tab on each rerun."""

import importlib
import sys
from unittest.mock import patch

from algorithms.registry import discover_algorithms


class _Context:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False


class _FakeStreamlit:
    def __init__(self):
        self.button_keys = set()

    def tabs(self, labels):
        return [_Context() for _ in labels]

    def columns(self, widths, **kwargs):
        return [_Context() for _ in range(widths if isinstance(widths, int) else len(widths))]

    def container(self, **kwargs):
        return _Context()

    def button(self, label, *, key=None, **kwargs):
        assert key, f"Button without explicit key: {label}"
        assert key not in self.button_keys, f"Duplicate Streamlit widget key: {key}"
        self.button_keys.add(key)
        return False

    def __getattr__(self, name):
        return lambda *args, **kwargs: None


def test_school_tabs_have_unique_card_button_keys():
    fake = _FakeStreamlit()
    with patch.dict(sys.modules, {"streamlit": fake}):
        # Import UI under a small Streamlit test double; no server/browser required.
        import ui.pages
        importlib.reload(ui.pages)
        ui.pages.programmes(discover_algorithms(), lambda slug: None)
    assert len(fake.button_keys) == 14  # 7 existing modules shown in two tabs
    assert all(key.startswith("open:parcours-") for key in fake.button_keys)


def test_other_pages_have_separate_card_key_scopes():
    fake = _FakeStreamlit()
    with patch.dict(sys.modules, {"streamlit": fake}):
        import ui.pages
        importlib.reload(ui.pages)
        specs = discover_algorithms()
        ui.pages.render_cards(list(specs.values()), lambda slug: None, key_scope="home")
        ui.pages.render_cards(list(specs.values()), lambda slug: None, key_scope="library")
    assert len(fake.button_keys) == 14
