"""Security tests never execute an author's Python source locally."""
import os
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.runner.contracts import validate_revision, compare_outputs, value_matches
from app.runner.modal_runner import execute_in_modal, RunnerFailure

client = TestClient(app)


def revision(**updates):
    row = {
        "python_code": "def pgcd(a,b):\n return a%b",
        "entry_function": "pgcd",
        "input_schema": {"parameters": [{"name": "a", "type": "int"}, {"name": "b", "type": "int"}], "returns": "int"},
        "test_cases": [{"label": "PGCD", "inputs": {"a": 24, "b": 18}, "expected": 6}],
    }
    return {**row, **updates}


def test_draft_runner_is_disabled_by_default(monkeypatch):
    monkeypatch.delenv("ENABLE_DRAFT_RUNNER", raising=False)
    r = client.post("/api/v1/drafts/5580fdcc-7d8d-426e-9d34-09bfa416ccad/test", json={"edit_seq": 1})
    assert r.status_code == 503
    assert "Sandbox" in r.json()["detail"]


def test_untrusted_source_never_accepted_in_payload(monkeypatch):
    monkeypatch.delenv("ENABLE_DRAFT_RUNNER", raising=False)
    r = client.post("/api/v1/drafts/5580fdcc-7d8d-426e-9d34-09bfa416ccad/test",
                    json={"edit_seq": 1, "source": "__import__('os').system('id')"})
    assert r.status_code == 422


def test_no_anonymous_testing_even_if_runner_configured(monkeypatch):
    for k, v in {"ENABLE_DRAFT_RUNNER": "true", "SUPABASE_URL": "https://example.supabase.co",
                 "SUPABASE_PUBLISHABLE_KEY": "public", "SUPABASE_SERVICE_ROLE_KEY": "server-secret"}.items():
        monkeypatch.setenv(k, v)
    r = client.post("/api/v1/drafts/5580fdcc-7d8d-426e-9d34-09bfa416ccad/test", json={"edit_seq": 1})
    assert r.status_code == 401


def test_type_comparison_and_failure_cases():
    assert value_matches(True, "int") is False
    assert value_matches([[1, 2], [3, 4]], "list[list[int]]") is True
    assert not value_matches(float("inf"), "float")
    code, entry, cases, ret = validate_revision(revision())
    assert entry == "pgcd" and ret == "int"
    good = compare_outputs([{"ok": True, "value": 6}], cases, ret)
    bad = compare_outputs([{"ok": True, "value": 8}], cases, ret)
    failed = compare_outputs([{"ok": False, "error": "ZeroDivisionError: division by zero"}], cases, ret)
    assert good[0]["passed"] and not bad[0]["passed"]
    assert failed[0]["error"].startswith("ZeroDivisionError")


def test_invalid_contract_refused_before_sandbox():
    with pytest.raises(ValueError):
        validate_revision(revision(test_cases=[]))
    with pytest.raises(ValueError):
        validate_revision(revision(input_schema={"parameters": [{"name": "a", "type": "int"}, {"name": "a", "type": "int"}], "returns": "int"}))
    with pytest.raises(ValueError):
        validate_revision(revision(test_cases=[{"inputs": {"a": True, "b": 2}, "expected": 1}]))


def test_modal_adapter_enforces_limits_and_no_secrets(monkeypatch):
    import sys

    fake = SimpleNamespace()
    attrs = {}
    class FS:
        def write_text(self, content, path):
            attrs[path] = content
        def stat(self, path):
            return SimpleNamespace(size=150)
        def read_text(self, path):
            return '{"results":[{"ok":true,"value":6}]}'
    class Sandbox:
        filesystem = FS()
        def exec(self, *args, **kw):
            attrs["exec"] = (args, kw)
            return SimpleNamespace(wait=lambda: 0)
        def terminate(self):
            attrs["terminated"] = True
    def create(**kw):
        attrs["create"] = kw
        return Sandbox()
    fake.App = SimpleNamespace(lookup=lambda *a, **kw: object())
    def make_image(**kwargs):
        return SimpleNamespace(pip_install=lambda *args: SimpleNamespace(
            add_local_file=lambda *args, **kwargs: attrs.setdefault("image_file", (args, kwargs))))
    fake.Image = SimpleNamespace(debian_slim=make_image)
    fake.Sandbox = SimpleNamespace(create=create)
    monkeypatch.setitem(sys.modules, "modal", fake)
    from app.runner.modal_runner import _modal_resources
    _modal_resources.cache_clear()
    phases = {}
    try:
        result = execute_in_modal(code="def pgcd(a,b): return 6", entry="pgcd",
                                  inputs=[{"a": 24, "b": 18}], timings=phases)
    finally:
        _modal_resources.cache_clear()
    assert result == [{"ok": True, "value": 6}]
    assert attrs["create"]["block_network"] is True
    assert attrs["create"]["secrets"] == []
    assert attrs["create"]["volumes"] == {}
    assert attrs["create"]["timeout"] <= 20
    assert attrs["exec"][0] == ("python", "-I", "/opt/afj-harness.py")
    assert attrs["image_file"][0][1] == "/opt/afj-harness.py"
    assert attrs["image_file"][1]["copy"] is True
    assert "/tmp/afj-harness.py" not in attrs
    assert phases["setup"] >= 0 and phases["create"] >= 0 and phases["execute"] >= 0
    assert "expected" not in attrs["/tmp/afj-payload.json"]
    assert attrs["terminated"] is True
