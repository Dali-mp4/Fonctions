# Correctif — Parcours scolaires

## Problème

Dans Streamlit, les deux onglets de « Parcours scolaires » sont évalués au même lancement de page, même si un seul onglet est visible. Les sept cartes de fonctions apparaissent dans les deux parcours et leurs boutons portaient le même identifiant de widget (`open:<slug>`). Cela pouvait produire une erreur de clé dupliquée (`StreamlitDuplicateElementKey`).

## Correctif

Seul le fichier `ui/pages.py` a été modifié. La clé de chaque bouton de navigation contient maintenant **le contexte de la page ou de l'onglet** : `open:<contexte>:<slug>`.

Les sept algorithmes, les extraits Python scolaires, le pseudo-code et les champs de saisie sont **inchangés**.

## Installation rapide sur Windows

1. Fermer le serveur Streamlit (`Ctrl+C` dans le terminal, facultatif si le rechargement automatique fonctionne).
2. Ouvrir le dossier du projet qui contient `streamlit_app.py`.
3. Extraire `fonctions_parcours_fix.zip` **dans ce dossier**, en remplaçant `ui/pages.py`.
4. Lancer `py -m streamlit run streamlit_app.py`.
5. Tester « Parcours scolaires » puis les deux onglets, et les boutons « Découvrir ».

## Validation

- 28 tests Python réussis, dont 2 nouveaux tests ciblés simulant le rendu simultané des onglets et vérifiant l'unicité des boutons.
- Tous les fichiers Python vérifiés avec `compileall`.
- La page déployée dans le navigateur n'a pas été testée dans l'environnement Windows de l'utilisateur.
