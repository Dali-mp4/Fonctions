import streamlit as st
from random import randint
from numpy import array
import pandas as pd

st.header("Matrice (Tableau des valeurs a deux dimensions)")

l = st.number_input("Entrer le nombrte du ligne: ", min_value=1)
c = st.number_input("Entrer le nombrte du colonne: ", min_value=1) 

radio = st.radio("Choisir le type d'insertion:", ("Insertion aléatoire", "Insertion manuelle"))

if radio == "Insertion aléatoire":
    min_val = st.number_input("Entrer la valeur minimale: ", min_value=0)
    max_val = st.number_input("Entrer la valeur maximale: ", min_value=min_val)
    M = array([[float()]*c]*l)
    for i in range(l):
        for j in range(c):
            M[i,j] = randint(min_val, max_val)
else:
    M = array([[float()]*c]*l)
    for i in range(l):
            for j in range(c):
                M[i,j] = st.number_input(f"Entrer la valeur du ligne {i+1}, colonne {j+1}: ", key=f"{i}_{j}")


st.dataframe(pd.DataFrame(M))

with st.expander("Show code"):
    st.code(f"""
    from numpy import array
    M = array([[float()]*c]*l)

    def remplir(M, c, l):
        for i in range(l):
            for j in range(c):
                M[i,j] = input("Entrer la valeur du ligne " ,i+1 ,"colonne ", j+1 ": ")
        return M

    def remplir_aleatoire(M, c, l, min_val, max_val):
        for i in range(l):
            for j in range(c):
                M[i,j] = randint(min_val, max_val)
        return M

    def afficher(M, c, l):
        for i in range(l):
            for j in range(c):
                print(M[i,j])

    """, language="python")