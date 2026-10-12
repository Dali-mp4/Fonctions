# Fonctions — mise à jour des codes pédagogiques

## Pourquoi
L'onglet **Algorithme & Python** montrait auparavant la source technique utilisée par le moteur de calcul (`inspect.getsource`). Cette source pouvait contenir des notions non étudiées (`raise`, `try/except`, annotations avancées).

## Ce qui change
- Chaque algorithme contient des exemples scolaires dans `SPEC.code_sections` (`CodeSection`).
- Le panneau de code affiche uniquement ces exemples, et jamais le code interne automatiquement.
- Le moteur de calcul et ses validations restent indépendants de Streamlit : le fonctionnement des ateliers ne change pas.
- TABLEAU : déclaration avec NumPy + TDNT/TDOG ; remplissage manuel ; remplissage aléatoire ; affichage ; tri par sélection décroissant d'origine.
- MATRICE : déclaration avec NumPy + TDNT/TDOG ; remplissage manuel ; remplissage aléatoire ; affichage. Aucun tri ajouté.
- ENREGISTREMENT : exemple fixe à trois champs, affichant des opérations simples sur un dictionnaire. La saisie dynamique dans l'atelier est conservée.
- PGCD, PPCM, SOM_CH, VERIF : exemples Python simplifiés.
- Ajout de NumPy dans `requirements.txt` pour exécuter les exemples scolaires.

## Installation
Dans le dossier du projet en cours (où se trouve `streamlit_app.py`) : remplacer les fichiers modifiés par ceux du ZIP de mise à jour, puis lancer :

```powershell
py -m pip install -r requirements.txt
py -m streamlit run streamlit_app.py
```

Pour un démarrage propre, extraire l'archive complète dans un nouveau dossier et lancer les mêmes commandes.

## Vérifications
- Compilation de tous les fichiers `.py` : réussie.
- 26 tests automatisés : réussis, dont des tests d'exécution des snippets pédagogiques de tableau, matrice et enregistrement.
- Test visuel de l'app Streamlit : à confirmer sur le PC de l'utilisateur.
