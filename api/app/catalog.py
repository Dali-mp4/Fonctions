"""Read-only catalog based on the original seven reviewed teaching modules.

Future published revisions will be read from Postgres. No submitted code is imported
or executed by this service.
"""
from dataclasses import asdict
from functools import lru_cache
from typing import Any

from .algorithms.registry import discover_algorithms


@lru_cache(maxsize=1)
def get_specs():
    return discover_algorithms()


def serialize_spec(spec) -> dict[str, Any]:
    return {
        "slug": spec.slug,
        "name": spec.name,
        "title": spec.full_name,
        "category": spec.category,
        "level": spec.level,
        "method": "base",
        "collection": "general",
        "icon": spec.icon,
        "summary": spec.summary,
        "principle": spec.principle,
        "example": spec.example,
        "tags": list(spec.tags),
        "limits": spec.limits,
        "inputs": [asdict(field) for field in spec.inputs],
        "code_sections": [asdict(section) for section in spec.code_sections],
    }


def public_catalog() -> list[dict[str, Any]]:
    return [serialize_spec(s) for s in get_specs().values()]
