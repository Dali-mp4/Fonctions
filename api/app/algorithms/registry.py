"""Auto-discovery: adding an algorithms/*.py file automatically adds its SPEC."""

from importlib import import_module
from pathlib import Path
from typing import Mapping

from .schema import AlgorithmSpec


def discover_algorithms() -> Mapping[str, AlgorithmSpec]:
    specs: dict[str, AlgorithmSpec] = {}
    directory = Path(__file__).parent
    for file in sorted(directory.glob("*.py")):
        if file.name in {"__init__.py", "schema.py", "registry.py"} or file.name.startswith("_"):
            continue
        module = import_module(f"{__package__}.{file.stem}")
        spec = getattr(module, "SPEC", None)
        if not isinstance(spec, AlgorithmSpec):
            raise TypeError(f"{file.name} doit exposer SPEC : AlgorithmSpec")
        if spec.slug in specs:
            raise ValueError(f"Identifiant dupliqué : {spec.slug}")
        specs[spec.slug] = spec
    return specs
