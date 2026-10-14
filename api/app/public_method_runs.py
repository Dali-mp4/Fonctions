"""Run only *published* contributed methods for logged-in students in Modal.

No source from the browser, no local execution, no service credentials inside
sandbox. SQL reserves a global + per-user paid run before any sandbox starts.
"""
import asyncio
import json
import os
from uuid import UUID

import httpx
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from .draft_tests import _slots, api_headers, get_json
from .runner.contracts import validate_revision, value_matches
from .runner.modal_runner import execute_in_modal, RunnerFailure, RunnerUnavailable

router = APIRouter(prefix="/api/v1/methods", tags=["metered public methods"])


class RunMethodRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    inputs: dict[str, object] = Field(default_factory=dict)


def validate_student_inputs(schema: dict, user_inputs: dict) -> dict:
    """Bound bytes, number/types, names and nesting before reserving paid work."""
    try:
        raw = json.dumps(user_inputs, ensure_ascii=False, allow_nan=False)
    except (TypeError, ValueError):
        raise ValueError("Valeurs JSON non valides") from None
    if len(raw.encode("utf-8")) > 6000:
        raise ValueError("Valeurs trop longues (6 Ko maximum)")
    if not isinstance(schema, dict) or not isinstance(schema.get("parameters"), list):
        raise ValueError("Contrat de fonction invalide")
    params = schema["parameters"]
    if len(params) > 8 or set(user_inputs) != {p.get("name") for p in params if isinstance(p, dict)}:
        raise ValueError("Les noms des paramètres ne correspondent pas à la fonction")
    if not all(isinstance(p, dict) and value_matches(user_inputs[p["name"]], p.get("type"))
               for p in params):
        raise ValueError("Types ou limites des paramètres invalides")
    return user_inputs


@router.post("/{revision_id}/run")
async def run_published_method(revision_id: UUID, request: RunMethodRequest,
                               authorization: str = Header(default="")):
    if (os.getenv("ENABLE_PUBLIC_METHOD_RUNNER", "false").lower() != "true" or
        os.getenv("ENABLE_DRAFT_RUNNER", "false").lower() != "true" or
        not all(os.getenv(x) for x in ("SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"))):
        raise HTTPException(503, "Exécution de la méthode temporairement indisponible")
    if not authorization.startswith("Bearer ") or not 10 < len(authorization) < 4500:
        raise HTTPException(401, "Connecte-toi pour essayer cette méthode")
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(401, "Connexion requise")
    async with httpx.AsyncClient(base_url=os.environ["SUPABASE_URL"].rstrip("/"),timeout=12.0) as client:
        headers = api_headers(token)
        identity = await get_json(client, "GET", "/auth/v1/user", headers)
        if not isinstance(identity, dict) or not identity.get("id"):
            raise HTTPException(401, "Session expirée")
        rows = await get_json(client, "GET", "/rest/v1/published_methods", headers,
            params={"select": "id,python_code,entry_function,input_schema,test_cases",
                    "id": f"eq.{revision_id}", "limit": "1"})
        if not isinstance(rows, list) or not rows:
            raise HTTPException(404, "Cette méthode n'est plus publiée")
        try:
            code, entry, _cases, return_type = validate_revision(rows[0])
            inputs = validate_student_inputs(rows[0]["input_schema"], request.inputs)
        except (ValueError, TypeError, KeyError) as e:
            raise HTTPException(422, str(e)) from e
        # The RPC rechecks the published pointer and trusted reviewer evidence,
        # then takes a locked quota reservation before consuming Modal capacity.
        reservation = await get_json(client, "POST", "/rest/v1/rpc/reserve_public_method_run",
                                     headers, payload={"p_revision": str(revision_id)})
        if not isinstance(reservation, str):
            raise HTTPException(503, "Réservation invalide")
        try:
            async with _slots:
                results = await asyncio.wait_for(asyncio.to_thread(
                    execute_in_modal, code=code, entry=entry, inputs=[inputs]), timeout=45)
            if len(results) != 1 or not isinstance(results[0], dict):
                raise RunnerFailure("Réponse du sandbox invalide")
            result = results[0]
            if not result.get("ok"):
                return {"status": "error", "error": str(result.get("error", "Erreur Python"))[:320]}
            value = result.get("value")
            if not value_matches(value, return_type):
                return {"status": "error", "error": "Résultat hors du contrat de types"}
            return {"status": "ok", "value": value}
        except (RunnerUnavailable, RunnerFailure, asyncio.TimeoutError):
            raise HTTPException(503, "Le sandbox n'a pas pu terminer l'exécution") from None
