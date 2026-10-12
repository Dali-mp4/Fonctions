"""Generic widgets and parsing for reusable algorithm input schemas."""

import random
import re
from typing import Any

import pandas as pd
import streamlit as st

from algorithms.schema import AlgorithmInputError, AlgorithmSpec, InputField


INTEGER_PATTERN = re.compile(r"[+-]?\d+\Z")


def parse_integer_list(text: str, limit: int = 40) -> list[int]:
    parts = [part.strip() for part in re.split(r"[,;]", text)]
    if not parts or any(not INTEGER_PATTERN.fullmatch(part) for part in parts):
        raise AlgorithmInputError("Entrez des entiers séparés par des virgules (ex. 8, 3, 11, 2).")
    if len(parts) > limit:
        raise AlgorithmInputError(f"Le tableau ne peut pas dépasser {limit} éléments.")
    return [int(part) for part in parts]


def parse_matrix(text: str, max_dimension: int = 10) -> list[list[int]]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines or len(lines) > max_dimension:
        raise AlgorithmInputError(f"La matrice doit avoir entre 1 et {max_dimension} lignes.")
    result = [parse_integer_list(line, limit=max_dimension) for line in lines]
    ncols = len(result[0])
    if any(len(row) != ncols for row in result):
        raise AlgorithmInputError("Chaque ligne de la matrice doit comporter le même nombre de colonnes.")
    return result


def parse_records(df: pd.DataFrame) -> list[dict[str, str]]:
    parsed = []
    for _, row in df.iterrows():
        name = "" if pd.isna(row.get("Nom")) else str(row["Nom"]).strip()
        value = "" if pd.isna(row.get("Valeur")) else str(row["Valeur"])
        kind = "chaîne" if pd.isna(row.get("Type")) else str(row["Type"])
        if not name and not value:  # new empty row
            continue
        parsed.append({"nom": name, "type": kind, "valeur": value})
    if len(parsed) > 20:
        raise AlgorithmInputError("Limite de 20 champs par enregistrement.")
    return parsed


def render_generation_helpers(spec: AlgorithmSpec) -> None:
    """One-click generators; generated text persists in session state across reruns."""
    for field in spec.inputs:
        if field.kind not in {"int_list", "matrix"}:
            continue
        with st.expander("🎲 Générer des valeurs aléatoires (facultatif)"):
            ident = f"gen:{spec.slug}:{field.name}"
            if field.kind == "int_list":
                size = st.number_input("Nombre d'éléments", 1, 40, 6, key=ident + ":count")
            else:
                left, right = st.columns(2)
                with left:
                    rows = st.number_input("Lignes", 1, 10, 3, key=ident + ":rows")
                with right:
                    cols = st.number_input("Colonnes", 1, 10, 3, key=ident + ":cols")
            left, right = st.columns(2)
            with left:
                lower = st.number_input("Minimum", -1000, 1000, 0, key=ident + ":min")
            with right:
                upper = st.number_input("Maximum", -1000, 1000, 20, key=ident + ":max")
            if st.button("Générer", key=ident + ":button", use_container_width=True):
                if lower > upper:
                    st.error("Le minimum ne peut pas dépasser le maximum.")
                else:
                    if field.kind == "int_list":
                        value = ", ".join(str(random.randint(lower, upper)) for _ in range(size))
                    else:
                        value = "\n".join(
                            ", ".join(str(random.randint(lower, upper)) for _ in range(cols))
                            for _ in range(rows)
                        )
                    st.session_state[f"input:{spec.slug}:{field.name}"] = value
                    st.rerun()


def render_field(spec: AlgorithmSpec, field: InputField) -> Any:
    key = f"input:{spec.slug}:{field.name}"
    if field.kind == "int":
        return st.number_input(field.label, min_value=field.min_value, max_value=field.max_value,
                               value=int(field.default or 0), step=1, key=key, help=field.hint or None)
    if field.kind == "float":
        return st.number_input(field.label, value=float(field.default or 0.0), step=0.5,
                               key=key, help=field.hint or None)
    if field.kind == "text":
        return st.text_input(field.label, value=str(field.default or ""), key=key,
                             help=field.hint or None)
    if field.kind == "choice":
        index = field.options.index(field.default) if field.default in field.options else 0
        return st.selectbox(field.label, field.options, index=index, key=key,
                            help=field.hint or None)
    if field.kind in {"int_list", "matrix"}:
        text = st.text_area(field.label, value=str(field.default or ""), key=key,
                            help=field.hint or None, height=120 if field.kind == "matrix" else 88)
        return parse_integer_list(text) if field.kind == "int_list" else parse_matrix(text)
    if field.kind == "records":
        defaults = pd.DataFrame(
            [{"Nom": name, "Type": kind, "Valeur": value} for name, kind, value in field.default],
            columns=["Nom", "Type", "Valeur"],
        )
        st.caption("Ajoutez, modifiez ou supprimez des lignes. Types : entier, réel, chaîne, booléen.")
        edited = st.data_editor(
            defaults, num_rows="dynamic", use_container_width=True, hide_index=True, key=key,
            column_config={
                "Nom": st.column_config.TextColumn("Nom du champ", required=True),
                "Type": st.column_config.SelectboxColumn(
                    "Type", options=["entier", "réel", "chaîne", "booléen"], required=True
                ),
                "Valeur": st.column_config.TextColumn("Valeur"),
            },
        )
        return parse_records(edited)
    raise AlgorithmInputError(f"Type de champ non pris en charge : {field.kind}")
