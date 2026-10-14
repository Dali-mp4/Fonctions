"""Run saved contributor Python only in freshly isolated Modal sandboxes.

Only immutable App/Image *descriptors* are cached per API process. Each run gets
its own network-blocked sandbox, with no secrets, volumes, or retained user code.
"""
from functools import lru_cache
import json
from pathlib import Path
from time import perf_counter


class RunnerUnavailable(RuntimeError):
    pass


class RunnerFailure(RuntimeError):
    pass


@lru_cache(maxsize=1)
def _modal_resources():
    try:
        import modal
    except ImportError as exc:
        raise RunnerUnavailable("Module Modal absent sur le serveur API") from exc
    app = modal.App.lookup("algo-fi-jib-sandbox", create_if_missing=True)
    image = (modal.Image.debian_slim(python_version="3.12")
             .pip_install("numpy==2.3.3")
             .add_local_file(str(Path(__file__).with_name("harness.py")),
                             "/opt/afj-harness.py", copy=True))
    return modal, app, image


def execute_in_modal(*, code: str, entry: str, inputs: list[dict],
                     timings: dict[str, int] | None = None) -> list[dict]:
    """Coarse monotonic diagnostics; never log or return submitted code."""
    phases = timings if timings is not None else {}
    started = perf_counter()
    sandbox = None
    try:
        modal, app, image = _modal_resources()
        phases["setup"] = round((perf_counter() - started) * 1000)

        tick = perf_counter()
        sandbox = modal.Sandbox.create(
            app=app, image=image, timeout=15, idle_timeout=12,
            cpu=(0.25, 0.5), memory=(256, 512), block_network=True,
            volumes={}, secrets=[], env={},
        )
        phases["create"] = round((perf_counter() - tick) * 1000)

        tick = perf_counter()
        # Trusted harness is pinned inside the image. Only arguments are uploaded.
        sandbox.filesystem.write_text(
            json.dumps({"code": code, "entry": entry, "cases": inputs}, ensure_ascii=False),
            "/tmp/afj-payload.json",
        )
        phases["payload"] = round((perf_counter() - tick) * 1000)

        tick = perf_counter()
        process = sandbox.exec("python", "-I", "/opt/afj-harness.py", timeout=10)
        exit_code = process.wait()
        phases["execute"] = round((perf_counter() - tick) * 1000)
        if exit_code != 0:
            raise RunnerFailure("Délai d'exécution dépassé ou processus interrompu")

        tick = perf_counter()
        meta = sandbox.filesystem.stat("/tmp/afj-results.json")
        if meta.size > 65536:
            raise RunnerFailure("Le résultat dépasse la limite autorisée")
        content = sandbox.filesystem.read_text("/tmp/afj-results.json")
        parsed = json.loads(content)
        results = parsed.get("results")
        phases["read"] = round((perf_counter() - tick) * 1000)
        if not isinstance(results, list) or len(results) != len(inputs):
            raise RunnerFailure(parsed.get("error", "Réponse du sandbox invalide"))
        return results
    except (RunnerUnavailable, RunnerFailure):
        raise
    except Exception as exc:
        raise RunnerFailure("Le sandbox n'a pas pu terminer l'exécution") from exc
    finally:
        if sandbox is not None:
            tick = perf_counter()
            try:
                sandbox.terminate()
            except Exception:
                pass
            phases["cleanup"] = round((perf_counter() - tick) * 1000)
