"""Public, bounded execution of *reviewed built-in* algorithms only.

SECURITY: User-submitted Python source must never be evaluated here. A separate,
resource-limited sandbox will be required before draft testing is enabled.
"""
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from .catalog import get_specs, public_catalog, serialize_spec
from .algorithms.schema import AlgorithmInputError

app = FastAPI(title="Algo Fi Jib API", version="0.1.0")
# For local development only; set real production CORS via a gateway or strict origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class RunRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    inputs: dict[str, Any] = Field(default_factory=dict)


def validate_inputs(slug: str, data: dict[str, Any]) -> dict[str, Any]:
    """Validate required shape & bound work for the seven reviewed examples."""
    shapes = {
        "pgcd": {"a", "b"},
        "ppcm": {"a", "b"},
        "som-ch": {"a"},
        "verif": {"a", "borne_min", "borne_max"},
        "tableau": {"tableau", "ordre"},
        "matrice": {"matrice"},
        "enregistrement": {"champs"},
    }
    expected = shapes.get(slug)
    if expected is None:
        raise ValueError("Algorithme inconnu")
    if set(data) != expected:
        raise ValueError("Les champs fournis ne correspondent pas à cet algorithme.")

    def integer(x, *, max_abs=1000000):
        if isinstance(x, bool) or not isinstance(x, int) or abs(x) > max_abs:
            raise ValueError("Un entier hors des limites autorisées a été fourni.")
        return x

    if slug in {"pgcd", "ppcm"}:
        # Subtraction and repeated-addition algorithms are deliberately elementary.
        if any(integer(data[k], max_abs=10000) <= 0 for k in ("a", "b")):
            raise ValueError("Utilisez deux entiers strictement positifs.")
    elif slug == "som-ch":
        if integer(data["a"], max_abs=10**12) < 0:
            raise ValueError("Entrez un entier positif ou nul.")
    elif slug == "verif":
        for k in expected:
            integer(data[k])
    elif slug == "tableau":
        values = data["tableau"]
        if not isinstance(values, list) or not (1 <= len(values) <= 40):
            raise ValueError("Le tableau doit contenir de 1 à 40 entiers.")
        for item in values:
            integer(item)
        if data["ordre"] not in ("Croissant", "Décroissant"):
            raise ValueError("Ordre de tri inconnu.")
    elif slug == "matrice":
        matrix = data["matrice"]
        if not isinstance(matrix, list) or not (1 <= len(matrix) <= 10):
            raise ValueError("La matrice doit comporter 1 à 10 lignes.")
        width = len(matrix[0]) if isinstance(matrix[0], list) else 0
        if not (1 <= width <= 10):
            raise ValueError("La matrice doit comporter 1 à 10 colonnes.")
        for row in matrix:
            if not isinstance(row, list) or len(row) != width:
                raise ValueError("Toutes les lignes doivent avoir la même longueur.")
            for item in row:
                integer(item)
    elif slug == "enregistrement":
        champs = data["champs"]
        if not isinstance(champs, list) or not (1 <= len(champs) <= 12):
            raise ValueError("Utilisez entre 1 et 12 champs.")
        for field in champs:
            if not isinstance(field, dict) or set(field) != {"nom", "type", "valeur"}:
                raise ValueError("Format de champ invalide.")
            if any(not isinstance(v, str) or len(v) > 160 for v in field.values()):
                raise ValueError("Champs trop longs ou invalides.")
    return data


@app.get("/health")
def health():
    return {"status": "ok", "runner": "reviewed-builtins-only"}


@app.get("/api/v1/algorithms")
def list_algorithms():
    return public_catalog()


@app.get("/api/v1/algorithms/{slug}")
def get_algorithm(slug: str):
    spec = get_specs().get(slug)
    if not spec:
        raise HTTPException(status_code=404, detail="Algorithme inconnu.")
    return serialize_spec(spec)


@app.post("/api/v1/algorithms/{slug}/run")
def run_reviewed_algorithm(slug: str, request: RunRequest):
    spec = get_specs().get(slug)
    if not spec:
        raise HTTPException(status_code=404, detail="Algorithme inconnu.")
    try:
        data = validate_inputs(slug, request.inputs)
        result = spec.execute(**data)
    except (AlgorithmInputError, ValueError, TypeError, KeyError, IndexError) as e:
        raise HTTPException(status_code=422, detail=str(e)) from None
    return {"value": result.value, "steps": list(result.steps)[:40], "note": result.note}
