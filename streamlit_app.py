import streamlit as st

# Fonctions: Streamlit navigation; algorithms are independent Python modules.
# Launch on Windows: py -m streamlit run streamlit_app.py

from algorithms.registry import discover_algorithms
from ui.pages import algorithm_page, home, library, programmes
from ui.style import apply_styles, footer


st.set_page_config(
    page_title="Algo Fi Jib",
    page_icon="🧠", layout="wide", initial_sidebar_state="collapsed",
)
apply_styles()

SPECS = discover_algorithms()


def show_home() -> None:
    home(SPECS, go_algorithm, go_library)


def show_library() -> None:
    library(SPECS, go_algorithm)


def show_programmes() -> None:
    programmes(SPECS, go_algorithm)


def show_algorithm() -> None:
    algorithm_page(SPECS, go_library)


page_home = st.Page(show_home, title="Accueil", icon="🏠", url_path="accueil", default=True)
page_library = st.Page(show_library, title="Bibliothèque", icon="📚", url_path="bibliotheque")
page_programmes = st.Page(show_programmes, title="Parcours scolaires", icon="🎓", url_path="parcours")
page_algorithm = st.Page(show_algorithm, title="Atelier", icon="🧪", url_path="atelier")


def go_algorithm(slug: str) -> None:
    st.session_state["active_algorithm"] = slug
    st.switch_page(page_algorithm, query_params={"algo": slug})


def go_library() -> None:
    st.switch_page(page_library)


with st.sidebar:
    st.markdown("Algo Fi Jib")
    st.caption("Algorithmes · Python · Collection Bac")
    st.info("EL ALGO LKOL, FI JIBEK.")

navigation = st.navigation(
    [page_home, page_library, page_programmes, page_algorithm], position="top"
)
navigation.run()
footer()
