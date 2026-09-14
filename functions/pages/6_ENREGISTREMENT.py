import streamlit as st
from random import randint
from numpy import array
import pandas as pd

st.header("ENREGISTREMENT (Enregistrement de differentes types de valeurs dans une variable)")

if "E" not in st.session_state:
    st.session_state.E = {}

var_name = st.text_input("Entrer le nom de la variable: ")
var_type = st.selectbox("Choisir le type de la variable:", ("int", "float", "str", "bool"))

if var_type == "int":
    value = st.number_input("Entrer la valeur entière: ", step=1)
elif var_type == "float":
    value = st.number_input("Entrer la valeur flottante: ")
elif var_type == "str":
    value = st.text_input("Entrer la valeur chaîne de caractères: ")
elif var_type == "bool":
    value = st.selectbox("Choisir la valeur booléenne:", (True, False))

if st.button("Enregistrer la variable"):
    st.session_state.E[var_name] = value

if st.button("Réinitialiser"):
    st.session_state.E.clear()

st.write(st.session_state.E)

with st.expander("Show code"):
    st.code(r"""
    E = {}

    def remplir(T, n):
        E[nom_de_variable1] = input(Entrer la valeur de variable1)
        E[nom_de_variable2] = input(Entrer la valeur de variable2)

    def afficher(T):
        print(E[nom_de_variable1])
        print(E[nom_de_variable2])

    """, language="python")