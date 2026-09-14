import streamlit as st

st.header("SOM_CH (Somme des Chiffres)")

def som_ch(a):
    s = 0
    ch = str(a)
    for i in range(len(ch)):
        s += int(ch[i])
    return s

num1 = st.number_input("Entrer un nombre: ", min_value=0)

if st.button("Calculer la somme des chiffres"):
    result = som_ch(num1)
    st.write(f"La somme des chiffres de {num1} est: {result}")

with st.expander("Show code"):
    st.code("""
    def som_ch(a):
        s = 0
        ch = str(a)
        for i in range(len(ch)):
            s += int(ch[i])
        return s
    """, language="python")