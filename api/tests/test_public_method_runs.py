"""No contributed source is executed in the API process."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.public_method_runs import validate_student_inputs

client = TestClient(app)
URL = "/api/v1/methods/aabbccdd-1234-4abc-8def-a1b2c3d4e5f6/run"


def test_method_runner_opt_in(monkeypatch):
    monkeypatch.delenv("ENABLE_PUBLIC_METHOD_RUNNER", raising=False)
    assert client.post(URL, json={"inputs": {"a": 3}}).status_code == 503


def test_source_injection_rejected(monkeypatch):
    monkeypatch.delenv("ENABLE_PUBLIC_METHOD_RUNNER", raising=False)
    assert client.post(URL, json={"inputs": {}, "source": "print('bad')"}).status_code == 422


def test_no_anonymous_paid_execution(monkeypatch):
    for name, value in {"ENABLE_PUBLIC_METHOD_RUNNER": "true", "ENABLE_DRAFT_RUNNER": "true",
                        "SUPABASE_URL": "https://example.supabase.co", "SUPABASE_PUBLISHABLE_KEY": "test"}.items():
        monkeypatch.setenv(name, value)
    response = client.post(URL, json={"inputs": {"a": 3}})
    assert response.status_code == 401


SCHEMA = {"parameters": [{"name": "a", "type": "int"}, {"name": "b", "type": "list[int]"}], "returns": "int"}


def test_student_input_type_validation_and_limits():
    assert validate_student_inputs(SCHEMA,{"a": 4,"b": [1,2]}) == {"a": 4,"b": [1,2]}
    for bad in ({"a": True,"b": [1]}, {"a": 3.0,"b": [1]}, {"a": 3,"b": [True]},
                {"a": 2}, {"a": 4,"b": [1], "source": "injected"},
                {"a": 3,"b": list(range(501))}):
        with pytest.raises(ValueError):
            validate_student_inputs(SCHEMA,bad)
    with pytest.raises(ValueError):
        validate_student_inputs({"parameters": [{"name": "a", "type": "str"}]}, {"a":"x"*7000})
