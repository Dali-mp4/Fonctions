"""Authenticated, DB-bound entrypoint for sandboxed contributor tests.

There is no endpoint taking Python source: the only input is a saved revision ID
and its edit sequence. Supabase RLS checks ownership, and an owner-scoped SQL
reservation enforces per-user quotas before paid sandbox allocation.
"""
import asyncio
import hashlib
import json
import os
from uuid import UUID

import httpx
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from .runner.contracts import validate_revision, compare_outputs
from .runner.modal_runner import execute_in_modal, RunnerFailure, RunnerUnavailable

router = APIRouter(prefix="/api/v1/drafts", tags=["contributor sandbox"])
# Per API instance admission control; SQL reservation enforces cross-instance quota.
_slots = asyncio.Semaphore(2)


class TestDraftRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    edit_seq: int = Field(ge=1)


def configured():
    return (os.getenv("ENABLE_DRAFT_RUNNER", "false").lower() == "true" and
            all(os.getenv(k) for k in ("SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY")))


def api_headers(token: str, *, privileged=False):
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"] if privileged else os.environ["SUPABASE_PUBLISHABLE_KEY"]
    return {"apikey": key, "Authorization": f"Bearer {key if privileged else token}", "Content-Type": "application/json"}


async def get_json(client, method, endpoint, headers, *, params=None, payload=None):
    try:
        res = await client.request(method, endpoint, headers=headers, params=params, json=payload)
    except httpx.RequestError as exc:
        raise HTTPException(503, "Connexion à Supabase indisponible") from exc
    if res.status_code >= 400:
        detail = "Opération refusée par Supabase"
        try:
            detail = str(res.json().get("message") or res.json().get("error_description") or detail)[:280]
        except ValueError:
            pass
        if res.status_code == 429 or "quota" in detail.lower() or "limite" in detail.lower():
            raise HTTPException(429, detail)
        if res.status_code in (401, 403):
            raise HTTPException(403, detail)
        if res.status_code == 404:
            raise HTTPException(404, detail)
        raise HTTPException(422 if res.status_code < 500 else 503, detail)
    if res.status_code == 204 or not res.content:
        return None
    try:
        return res.json()
    except ValueError as exc:
        raise HTTPException(503, "Réponse Supabase invalide") from exc


@router.post("/{revision_id}/test")
async def run_draft_tests(revision_id: UUID, request: TestDraftRequest, authorization: str = Header(default="")):
    if not configured():
        raise HTTPException(503, "Sandbox non configuré sur le serveur API (Phase 3B)")
    if not authorization.startswith("Bearer ") or len(authorization) > 4500:
        raise HTTPException(401, "Connexion requise")
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(401, "Connexion requise")

    url = os.environ["SUPABASE_URL"].rstrip("/")
    async with httpx.AsyncClient(base_url=url, timeout=12.0) as client:
        headers = api_headers(token)
        # Validate the token against Supabase Auth, not untrusted client metadata.
        person = await get_json(client, "GET", "/auth/v1/user", headers)
        uid = person.get("id") if isinstance(person, dict) else None
        if not uid:
            raise HTTPException(401, "Session invalide")
        rows = await get_json(client, "GET", "/rest/v1/revisions", headers, params={
            "select": "id,created_by,edit_seq,status,python_code,entry_function,input_schema,test_cases",
            "id": f"eq.{revision_id}", "created_by": f"eq.{uid}", "limit": "1",
        })
        if not isinstance(rows, list) or not rows:
            raise HTTPException(404, "Brouillon introuvable ou non autorisé")
        revision = rows[0]
        if revision["status"] not in ("draft", "changes_requested") or revision["edit_seq"] != request.edit_seq:
            raise HTTPException(409, "Brouillon modifié ou verrouillé. Recharge la page.")
        try:
            code, entry, cases, ret = validate_revision(revision)
        except (ValueError, TypeError) as exc:
            raise HTTPException(422, str(exc)) from exc

        # Reserve a quota slot atomically on the database BEFORE paying for a sandbox.
        run_id = await get_json(client, "POST", "/rest/v1/rpc/reserve_draft_test", headers, payload={
            "p_revision": str(revision_id), "p_edit_seq": request.edit_seq,
        })
        if not isinstance(run_id, str):
            raise HTTPException(503, "Réservation du test invalide")

        content_hash = hashlib.sha256(json.dumps({
            "code": code, "entry": entry, "schema": revision["input_schema"], "cases": cases,
        }, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()

        # Only inputs are passed to untrusted code; expected answers stay on API host.
        outcome = "error"
        evidence = {"runner": "modal-sandbox-v1", "run_id": run_id, "code_sha256": content_hash,
                    "edit_seq": request.edit_seq, "case_count": len(cases), "results": []}
        try:
            async with _slots:
                outputs = await asyncio.wait_for(asyncio.to_thread(
                    execute_in_modal, code=code, entry=entry,
                    inputs=[tc["inputs"] for tc in cases],
                ), timeout=45)
            report = compare_outputs(outputs, cases, ret)
            outcome = "passed" if all(item["passed"] for item in report) else "failed"
            evidence["results"] = report
        except (RunnerUnavailable, RunnerFailure, ValueError, asyncio.TimeoutError) as exc:
            evidence["error"] = ("Temps limite du service dépassé" if isinstance(exc, asyncio.TimeoutError)
                                 else str(exc))[:300]

        # Privileged access stays on the API host and is NEVER sent into Modal.
        # SQL checks reserved run, current edit_seq and status atomically.
        try:
            await get_json(client, "POST", "/rest/v1/rpc/finish_draft_test", api_headers(token, privileged=True), payload={
                "p_run_id": run_id, "p_revision": str(revision_id), "p_edit_seq": request.edit_seq,
                "p_outcome": outcome, "p_evidence": evidence,
            })
        except HTTPException as exc:
            raise HTTPException(409 if exc.status_code == 422 else exc.status_code,
                                "Brouillon modifié pendant le test, ou résultat non enregistré. Recharge la page.") from exc
        return {"run_id": run_id, "status": outcome, "case_count": len(cases),
                "results": evidence["results"], "error": evidence.get("error")}
