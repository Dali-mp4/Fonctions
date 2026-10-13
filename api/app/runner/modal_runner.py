"""Only the Modal SDK runs contributor source; never in the API process.

Requires server-side Modal credentials. Each request creates and destroys one
short-lived sandbox; no volumes, user secrets, or outbound network access.
"""
import json
from pathlib import Path


class RunnerUnavailable(RuntimeError):
    pass


class RunnerFailure(RuntimeError):
    pass


def execute_in_modal(*, code: str, entry: str, inputs: list[dict]) -> list[dict]:
    try:
        import modal
    except ImportError as exc:
        raise RunnerUnavailable("Module Modal absent sur le serveur API") from exc

    app = modal.App.lookup("algo-fi-jib-sandbox", create_if_missing=True)
    image = modal.Image.debian_slim(python_version="3.12").pip_install("numpy==2.3.3")
    sandbox = None
    try:
        # CPU, memory and wall-clock bounds apply to all user code.
        sandbox = modal.Sandbox.create(
            app=app, image=image, timeout=15, idle_timeout=12,
            cpu=(0.25, 0.5), memory=(256, 512), block_network=True,
            volumes={}, secrets=[], env={},
        )
        sandbox.filesystem.write_text(Path(__file__).with_name("harness.py").read_text(encoding="utf-8"), "/tmp/afj-harness.py")
        sandbox.filesystem.write_text(
            json.dumps({"code": code, "entry": entry, "cases": inputs}, ensure_ascii=False),
            "/tmp/afj-payload.json",
        )
        process = sandbox.exec("python", "-I", "/tmp/afj-harness.py", timeout=10)
        exit_code = process.wait()
        if exit_code != 0:
            raise RunnerFailure("Délai d'exécution dépassé ou processus interrompu")
        meta = sandbox.filesystem.stat("/tmp/afj-results.json")
        if meta.size > 65536:
            raise RunnerFailure("Le résultat dépasse la limite autorisée")
        content = sandbox.filesystem.read_text("/tmp/afj-results.json")
        parsed = json.loads(content)
        results = parsed.get("results")
        if not isinstance(results, list) or len(results) != len(inputs):
            raise RunnerFailure(parsed.get("error", "Réponse du sandbox invalide"))
        return results
    except (RunnerUnavailable, RunnerFailure):
        raise
    except Exception as exc:
        raise RunnerFailure("Le sandbox n'a pas pu terminer l'exécution") from exc
    finally:
        if sandbox is not None:
            try:
                sandbox.terminate()
            except Exception:
                pass
