import streamlit as st

st.set_page_config(
    page_title="Fonctions",
    page_icon="💻",
    layout="wide",
    initial_sidebar_state="expanded"
)#el layout

#css
st.markdown("""
<style>

.main-title {
    font-size: 48px;
    font-weight: 700;
    margin-bottom: 5px;
}

.subtitle {
    font-size: 20px;
    color: #A0A7B5;
    margin-bottom: 30px;
}

.section-title {
    font-size: 26px;
    font-weight: 600;
    margin-top: 10px;
    margin-bottom: 15px;
}

.card {
    background-color: #181B24;
    padding: 25px;
    border-radius: 15px;
    border: 1px solid #2A2E39;
    height: 100%;
}

.card-title {
    font-size: 21px;
    font-weight: 600;
    margin-bottom: 10px;
}

.card-text {
    color: #A0A7B5;
    font-size: 15px;
    line-height: 1.5;
}

.number {
    color: #7C3AED;
    font-weight: bold;
}

.footer {
    text-align: center;
    color: #6B7280;
    margin-top: 50px;
    font-size: 14px;
}

</style>
""", unsafe_allow_html=True)

#3nwen
st.markdown(
    '<div class="main-title">💻 Collection de fonctions algorithmiques</div>',
    unsafe_allow_html=True
)

st.markdown(
    '<div class="subtitle">'
    'Une collection des principales fonctions et notions '
    'algorithmiques étudiées au cours de la 3eme année secondaires.' #a33 yel francaisssss
    '</div>',
    unsafe_allow_html=True
)

st.info(
    "👉 Utilisez la barre latérale pour accéder aux différentes pages."
)

st.divider()


st.markdown(
    '<div class="section-title">🔢 Fonctions mathématiques</div>',
    unsafe_allow_html=True
)

col1, col2 = st.columns(2)

with col1:
    st.markdown("""
    <div class="card">
        <div class="card-title">① PGCD</div>
        <div class="card-text">
            <b>Plus Grand Commun Diviseur</b><br><br>
            Fonction permettant de déterminer le plus grand
            diviseur commun de deux nombres.
        </div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
    <div class="card">
        <div class="card-title">② PPCM</div>
        <div class="card-text">
            <b>Plus Petit Commun Multiple</b><br><br>
            Fonction permettant de déterminer le plus petit
            multiple commun de deux nombres.
        </div>
    </div>
    """, unsafe_allow_html=True)


st.write("")


st.markdown(
    '<div class="section-title">⚙️ Fonctions de traitement</div>',
    unsafe_allow_html=True
)

col1, col2 = st.columns(2)

with col1:
    st.markdown("""
    <div class="card">
        <div class="card-title">③ SOM_CH</div>
        <div class="card-text">
            <b>Somme des chiffres d'un nombre</b><br><br>
            Fonction permettant de calculer la somme
            des différents chiffres composant un nombre.
        </div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
    <div class="card">
        <div class="card-title">④ VERIF</div>
        <div class="card-text">
            <b>Vérification d'un nombre dans un intervalle</b><br><br>
            Fonction permettant de vérifier si un nombre
            appartient à un intervalle donné.
        </div>
    </div>
    """, unsafe_allow_html=True)


st.write("")


st.markdown(
    '<div class="section-title">🗂️ Structures de données</div>',
    unsafe_allow_html=True
)

col1, col2, col3 = st.columns(3)

with col1:
    st.markdown("""
    <div class="card">
        <div class="card-title">⑤ TABLEAU</div>
        <div class="card-text">
            Tableau à une dimension avec
            une fonction de tri permettant
            d'organiser les valeurs.
        </div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
    <div class="card">
        <div class="car```d-title">⑥ ENREGISTREMENT</div>
        <div class="card-text">
            Enregistrement de différents types
            de valeurs dans une variable.
        </div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown("""
    <div class="card">
        <div class="card-title">⑦ MATRICE</div>
        <div class="card-text">
            Tableau de valeurs à deux dimensions
            permettant de manipuler des données
            en lignes et colonnes.
        </div>
    </div>
    """, unsafe_allow_html=True)

#louta t3 lpage
st.markdown("""
<div class="footer">
    Projet de programmation • les fonctions et structures algorithmiques générales • Med Ali Tej
</div>
""", unsafe_allow_html=True)
