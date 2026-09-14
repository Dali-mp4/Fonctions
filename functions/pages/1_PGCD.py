import streamlit as st

st.header("PGCD (Plus Grand Commun Diviseur)")

def pgcd(a, b):
    while a != b:
        if a > b:
            a -= b
        else:
            b -= a
    return a

num1 = st.number_input("Entrer le premier nombre: ", min_value=1)
num2 = st.number_input("Entrer le deusieme nombre: ", min_value=1)

if st.button("Calculer le PGCD"):
    result = pgcd(num1, num2)
    st.write(f"Le Plus Grand Commun Diviseur de {num1} et {num2} est: {result}")

with st.expander("Show code"):
    st.code("""
    def pgcd(a, b):
        while a != b:
            if a > b:
                a -= b
            else:
                b -= a
        return a
    """, language="python")