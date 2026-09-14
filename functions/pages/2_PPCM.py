import streamlit as st

st.header("PPCM (Plus Petit Commun Multiple)")

def ppcm(a, b):
    m = a
    while m % b != 0:
        m += a
    return m

num1 = st.number_input("Entrer le premier nombre: ", min_value=1)
num2 = st.number_input("Entrer le deusieme nombre: ", min_value=1)

if st.button("Calculer le PPCM"):
    result = ppcm(num1, num2)
    st.write(f"Le Plus Petit Commun Multiple de {num1} et {num2} est: {result}")

with st.expander("Show code"):
    st.code("""
    def ppcm(a, b):
        m = a
        while m % b != 0:
            m += a
        return m
    """, language="python")