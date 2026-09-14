import streamlit as st
from random import randint
from numpy import array
import pandas as pd

st.header("TABLEAU (Tableau des valeurs)")

n = st.number_input("Entrer la longueur du tableau: ", min_value=1)

radio = st.radio("Choisir le type d'insertion:", ("Insertion aléatoire", "Insertion manuelle"))

if radio == "Insertion aléatoire":
    min_val = st.number_input("Entrer la valeur minimale: ", min_value=0)
    max_val = st.number_input("Entrer la valeur maximale: ", min_value=min_val)
    T = array([float()]*n)
    for i in range(n):
        T[i] = randint(min_val, max_val)
else:
    T = array([float()]*n)
    for i in range(n):
        T[i] = st.number_input(f"Entrer la valeur {i+1}: ")


st.dataframe(pd.DataFrame([T]))

with st.expander("Show code"):
    st.code(f"""
    from numpy import array
    T = array([Type_element()]*taille)

    def remplir(T, n):
        for i in range(n):
            T[i] = input(f"Entrer la valeur ",i+1,": ")
        return T

    def remplir_aleatoire(T, n, min_val, max_val):
        for i in range(n):
            T[i] = randint(min_val, max_val)
        return T

    def afficher(T):
        for i in range(len(T)):
            print(T[i])

""", language="python")

def tri(T,n):
    for i in range(0,n-1):
        p = i
        for j in range(i+1,n):
            if T[j] > T[p]:
                p = j
        if p != i:
            a = T[i]
            T[i] = T[p]
            T[p] = a
    return T

order = st.selectbox("Choisir l'ordre de tri",("ordre croissant","ordre décroissant"))
if st.button("Trier"):
    if order == "ordre décroissant":
        st.dataframe(pd.DataFrame([tri(T,n)]))
    else :
        st.dataframe(pd.DataFrame([tri(T,n)[::-1]]))

with st.expander("Show code"):
    st.code(f"""
    def tri(T,n):
        for i in range(0,n-1):
            p = i
            for j in range(i+1,n):
                if T[j] > T[p]:
                    p = j
            if p != i:
                a = T[i]
                T[i] = T[p]
                T[p] = a
        return T
    """, language="python")