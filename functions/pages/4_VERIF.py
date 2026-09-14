import streamlit as st

st.header("VERIF (Vérification d'intervalle)")

def VERIF(a, min, max):
    if min <= a <= max:
        return True

num1 = st.number_input("Entrer un nombre: ")
min = st.number_input("Entrer la valeur minimale: ")
max = st.number_input("Entrer la valeur maximale: ")

if st.button("Vérifier l'intervalle"):
    if VERIF(num1, min, max):
        st.write(f"Le nombre {num1} est dans l'intervalle [{min}, {max}]")
    else:
        st.write(f"Le nombre {num1} n'est pas dans l'intervalle [{min}, {max}]")

with st.expander("Show code"):
    st.code(f"""
    def VERIF(a):
        if {min} <= a <= {max}:
            return True
    """, language="python")