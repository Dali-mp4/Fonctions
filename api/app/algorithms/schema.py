"""Shared contracts for algorithm modules. No Streamlit imports here."""

from dataclasses import dataclass, field
from typing import Any, Callable


@dataclass(frozen=True)
class InputField:
    name: str
    label: str
    kind: str  # int, float, text, choice, int_list, matrix, records
    default: Any = None
    min_value: int | float | None = None
    max_value: int | float | None = None
    options: tuple[str, ...] = ()
    hint: str = ""


@dataclass(frozen=True)
class AlgorithmResult:
    value: Any
    steps: tuple[str, ...] = ()
    note: str = ""


@dataclass(frozen=True)
class CodeSection:
    """Classroom-facing example: independent from the executable engine and Streamlit."""
    title: str
    pseudocode: str
    python: str
    note: str = ""


@dataclass(frozen=True)
class AlgorithmSpec:
    slug: str
    name: str
    full_name: str
    category: str
    summary: str
    principle: str
    pseudocode: str
    inputs: tuple[InputField, ...]
    function: Callable[..., Any]
    execute: Callable[..., AlgorithmResult]
    example: str
    icon: str = "🔢"
    tags: tuple[str, ...] = ()
    # The current seven algorithms are introductory. Level labels are guidance,
    # not a claim that this is an officially exhaustive school syllabus.
    level: str = "Bases · 3ème Info"  # Other valid choices: "3ème Info", "4ème Info", "Transversal"
    limits: str = ""
    code_sections: tuple[CodeSection, ...] = ()


class AlgorithmInputError(ValueError):
    """Explain an invalid user input with a friendly, localized message."""
