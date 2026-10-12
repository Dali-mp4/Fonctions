"""Pages share one reusable renderer for all discovered algorithm modules."""

from html import escape
from collections import defaultdict
from collections.abc import Callable, Mapping

import pandas as pd
import streamlit as st

from algorithms.schema import AlgorithmInputError, AlgorithmResult, AlgorithmSpec
from .fields import render_field, render_generation_helpers


CATEGORY_DESCRIPTIONS = {
    "Mathématiques": "Divisibilité et calculs sur les entiers.",
    "Traitement": "Chiffres, conditions et vérifications.",
    "Structures de données": "Tableaux, enregistrements et matrices.",
}


def card(spec: AlgorithmSpec, go_to: Callable[[str], None], *, key_scope: str) -> None:
    with st.container(border=True):
        st.caption(f"{spec.icon}  {spec.category.upper()} · {spec.level}")
        st.markdown(f"#### {spec.name}")
        st.write(spec.full_name)
        st.caption(spec.summary)
        st.button("Découvrir  →", key=f"open:{key_scope}:{spec.slug}",
                  use_container_width=True, on_click=go_to, args=(spec.slug,))


def render_cards(specs: list[AlgorithmSpec], go_to: Callable[[str], None], *, key_scope: str) -> None:
    if not specs:
        st.info("Aucune fonction ne correspond à cette recherche.")
        return
    for start in range(0, len(specs), 3):
        cols = st.columns(3, gap="medium")
        for col, spec in zip(cols, specs[start:start + 3]):
            with col:
                card(spec, go_to, key_scope=key_scope)


def home(specs: Mapping[str, AlgorithmSpec], go_to: Callable[[str], None], go_catalog: Callable[[], None]) -> None:
    st.markdown(
        '<div class="fn-hero"><span class="fn-pill">🇹🇳 POUR LES LYCÉES TUNSIENS · VERSION BÊTA</span>'
        '<h1>El algorithmes yweli <em>birasmi fi jib.</em></h1>'
        '<p>Explore les fonctions, teste tes propres valeurs et découvre comment '
        'chaque algorithme fonctionne — en pseudo-code et en Python. '
        'Une bibliothèque qui grandit avec tes cours.</p></div>',
        unsafe_allow_html=True,
    )
    c1, c2, c3, c4 = st.columns([1.25, 1.15, 1, 1])
    with c1:
        st.button("Explorer la bibliothèque →", type="primary", use_container_width=True,
                  on_click=go_catalog)
    with c2:
        st.caption("De la 3ème Info au Bac Info")
    with c3:
        st.metric("Modules disponibles", f"{len(specs):02}")
    with c4:
        st.metric("Catégories", len(set(s.category for s in specs.values())))

    st.write("")
    st.markdown("### Un outil, deux façons d'apprendre")
    left, right = st.columns(2)
    with left:
        with st.container(border=True):
            st.markdown("#### ⚡ Tester rapidement")
            st.write("Choisis une fonction, entre tes valeurs et observe immédiatement le résultat.")
    with right:
        with st.container(border=True):
            st.markdown("#### 📖 Comprendre en profondeur")
            st.write("Lis la définition, compare pseudo-code et Python, puis suis les étapes du calcul.")

    st.write("")
    st.markdown("### Les modules de départ")
    st.caption("Les 7 premiers modules de la collection, pas le programme scolaire complet.")
    render_cards(list(specs.values()), go_to, key_scope="home")

    st.write("")
    with st.container(border=True):
        st.markdown("#### 🎓 Et la 4ème Info ?")
        st.write("Le parcours Bac Info est prévu. Pour l'instant, tu peux déjà réviser "
                 "les bases grâce aux modules publiés. De nouvelles fonctions arriveront au fin du projet.")


def library(specs: Mapping[str, AlgorithmSpec], go_to: Callable[[str], None]) -> None:
    st.markdown('<div class="fn-header">EXPLORER</div>', unsafe_allow_html=True)
    st.title("Bibliothèque des fonctions")
    st.caption("Tous les modules disponibles, quel que soit le niveau. Recherche par nom, thème ou mot-clé.")
    a, b = st.columns([2.2, 1])
    with a:
        query = st.text_input("Rechercher une fonction", placeholder="PGCD, tri, matrice...", key="library:query")
    with b:
        categories = ["Toutes les catégories", *sorted({s.category for s in specs.values()})]
        category = st.selectbox("Catégorie", categories, key="library:category")
    filtered = [
        s for s in specs.values()
        if (category == "Toutes les catégories" or s.category == category)
        and query.casefold().strip() in " ".join((s.name, s.full_name, s.category, s.summary, *s.tags)).casefold()
    ]
    st.caption(f"{len(filtered)} module(s) trouvé(s)")
    render_cards(filtered, go_to, key_scope="library")


def programmes(specs: Mapping[str, AlgorithmSpec], go_to: Callable[[str], None]) -> None:
    st.markdown('<div class="fn-header">PARCOURS</div>', unsafe_allow_html=True)
    st.title("Parcours scolaires")
    st.write("Retrouve les fonctions selon ton niveau, tout en gardant accès à la bibliothèque complète.")
    st.info("Les classements ci-dessous sont des parcours de révision proposés, "
            "pas une reproduction exhaustive des programmes officiels tunisiens.")
    t3, t4 = st.tabs(["📗 3ème Sciences de l'Informatique", "📘 4ème Sciences de l'Informatique"])
    with t3:
        st.markdown("### Les fondamentaux disponibles")
        st.caption("Premiers outils d'algorithmique et structures de données.")
        by_cat: dict[str, list[AlgorithmSpec]] = defaultdict(list)
        for spec in specs.values():
            if spec.level in {"Bases · 3ème Info", "3ème Info", "Transversal"}:  # avoid Bac-only content
                by_cat[spec.category].append(spec)
        for cat, items in by_cat.items():
            st.markdown(f"#### {cat}")
            st.caption(CATEGORY_DESCRIPTIONS.get(cat, ""))
            render_cards(items, go_to, key_scope="parcours-3e")
    with t4:
        bac_specs = [s for s in specs.values() if s.level in {"4ème Info", "Transversal"}]
        revision_specs = [s for s in specs.values() if s.level in {"Bases · 3ème Info", "3ème Info"}]
        st.markdown("### Modules 4ème Info")
        if bac_specs:
            render_cards(bac_specs, go_to, key_scope="parcours-4e")
        else:
            st.info("En préparation : les modules spécifiques au Bac Info seront ajoutés progressivement.")
        if revision_specs:
            st.markdown("### Réviser les prérequis")
            st.write("Ces fonctions de base restent utiles pour les révisions, sans être présentées comme de nouveaux chapitres de 4ème.")
            render_cards(revision_specs, go_to, key_scope="parcours-4e-revisions")
        st.caption("Le classement par niveau est indicatif et sera confronté aux documents scolaires au fur et à mesure des ajouts.")


def output_result(result: AlgorithmResult) -> None:
    value = result.value
    if isinstance(value, bool):
        if value:
            st.success("✅ Vrai — la condition est vérifiée.")
        else:
            st.warning("❌ Faux — la condition n'est pas vérifiée.")
    elif isinstance(value, (int, float)):
        st.metric("Résultat", value)
    elif isinstance(value, dict):
        df = pd.DataFrame([{"Champ": k, "Valeur": repr(v), "Type Python": type(v).__name__}
                           for k, v in value.items()])
        st.dataframe(df, hide_index=True, use_container_width=True)
    elif isinstance(value, list) and value and isinstance(value[0], list):
        st.dataframe(pd.DataFrame(value), hide_index=True, use_container_width=True)
    elif isinstance(value, list):
        st.dataframe(pd.DataFrame([value]), hide_index=True, use_container_width=True)
    else:
        st.write(value)
    if result.note:
        st.caption(result.note)


def algorithm_page(specs: Mapping[str, AlgorithmSpec], go_catalog: Callable[[], None]) -> None:
    slug = st.query_params.get("algo", st.session_state.get("active_algorithm", next(iter(specs))))
    spec = specs.get(slug)
    if spec is None:
        st.error("Fonction inconnue.")
        st.button("← Bibliothèque", on_click=go_catalog)
        return

    st.button("← Retour à la bibliothèque", key="back:catalog", on_click=go_catalog)
    st.markdown(f'<div class="fn-header">{escape(spec.category.upper())} · ATELIER INTERACTIF</div>',
                unsafe_allow_html=True)
    st.title(f"{spec.icon} {spec.name}")
    st.subheader(spec.full_name)
    st.write(spec.summary)
    st.caption(f"Exemple : {spec.example}")

    t1, t2, t3 = st.tabs(["⚡ Exécuter", "🧠 Comprendre", "💻 Algorithme & Python"])
    with t1:
        st.markdown("#### Tester avec tes valeurs")
        render_generation_helpers(spec)
        with st.form(key=f"form:{spec.slug}", clear_on_submit=False, border=True):
            values = {}
            invalid = None
            for field in spec.inputs:
                try:
                    values[field.name] = render_field(spec, field)
                except (AlgorithmInputError, ValueError) as exc:
                    invalid = str(exc)
            run_clicked = st.form_submit_button("Exécuter la fonction →", type="primary",
                                                use_container_width=True)
        if run_clicked:
            try:
                if invalid:
                    raise AlgorithmInputError(invalid)
                st.session_state[f"result:{spec.slug}"] = spec.execute(**values)
                st.session_state.pop(f"error:{spec.slug}", None)
            except (AlgorithmInputError, ValueError, TypeError) as exc:
                st.session_state.pop(f"result:{spec.slug}", None)
                st.session_state[f"error:{spec.slug}"] = str(exc)
        error = st.session_state.get(f"error:{spec.slug}")
        if error:
            st.error(error)
        result = st.session_state.get(f"result:{spec.slug}")
        if result:
            st.markdown("#### Dernière exécution")
            output_result(result)
            with st.expander("🔍 Trace d'exécution — voir les étapes", expanded=True):
                for i, step in enumerate(result.steps, 1):
                    st.markdown(f"**{i:02d}.** {step}")
    with t2:
        st.markdown("#### Principe")
        st.write(spec.principle)
        st.markdown("#### Exemple")
        st.info(spec.example)
        if spec.limits:
            st.markdown("#### À retenir")
            st.write(spec.limits)
        st.caption("Objectif : comprendre le raisonnement, pas seulement mémoriser le code. **Na7i la7fatha !**")
    with t3:
        st.caption(
            "Code pédagogique adapté aux notions scolaires : les vérifications techniques "
            "de l'application sont séparées de ces exemples."
        )
        if spec.code_sections:
            if len(spec.code_sections) > 1:
                st.write("Les étapes ci-dessous suivent l'ordre d'un exercice : déclaration, saisie, affichage, puis traitement éventuel.")
            for number, section in enumerate(spec.code_sections, 1):
                if len(spec.code_sections) > 1:
                    region = st.expander(f"{number:02d} · {section.title}", expanded=(number == 1))
                else:
                    region = st.container()
                with region:
                    if len(spec.code_sections) == 1:
                        st.markdown(f"#### {section.title}")
                    p, py = st.columns(2, gap="large")
                    with p:
                        st.markdown("**Algorithme (pseudo-code)**")
                        st.code(section.pseudocode, language=None, line_numbers=False)
                    with py:
                        st.markdown("**Python (niveau scolaire)**")
                        st.code(section.python, language="python", line_numbers=False)
                    if section.note:
                        st.caption(section.note)
        else:
            st.markdown("#### Algorithme (pseudo-code)")
            st.code(spec.pseudocode, language=None)
            st.info("L'exemple Python pour ce module n'est pas encore rédigé.")
        st.caption("Les exemples sont des extraits d'apprentissage. La validation des entrées de l'atelier reste gérée séparément.")
