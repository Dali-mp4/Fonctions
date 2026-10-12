# Développement et déploiement — Algo Fi Jib — Fonctions

## Organisation des branches

- `main` : version historique, à conserver sans modification.
- `streamlit-v1-modular` : branche d'intégration de l'application modulaire.
- `feature/*`, `fix/*`, `chore/*` : branches courtes créées depuis `streamlit-v1-modular`.

Créer une branche, modifier le code et les tests, puis ouvrir une **pull request** vers `streamlit-v1-modular`. Attendre la réussite des contrôles GitHub Actions, puis vérifier l'application dans le navigateur avant de fusionner.

```bash
git fetch origin
git switch streamlit-v1-modular
git pull --ff-only origin streamlit-v1-modular
git switch -c feature/ma-fonction
python -m pip install -r requirements.txt -r requirements-dev.txt
python -m pytest -q
git add .
git commit -m "Add algorithm module"
git push -u origin feature/ma-fonction
```

## Contrôles GitHub Actions

Le workflow `.github/workflows/ci.yml` installe les dépendances, vérifie la syntaxe et exécute `pytest` sur Python 3.11 et 3.12. Il ne fusionne pas de branches et ne déploie pas le site. Les tests ne remplacent ni le contrôle visuel ni la relecture du pseudo-code scolaire.

## Déploiements Streamlit séparés

**Application de test :** sur Streamlit Community Cloud, créer une *nouvelle* application avec le dépôt `Dali-mp4/Fonctions`, la branche `streamlit-v1-modular` et le fichier `streamlit_app.py`. Les nouvelles fusions sur cette branche peuvent mettre à jour automatiquement le site de test.

**Application publique :** conserver ses paramètres de dépôt, de branche et de fichier d'entrée tant qu'une migration n'a pas été décidée. Vérifier sa configuration actuelle dans Streamlit Community Cloud avant tout changement. L'intégration continue n'active aucun déploiement et ne modifie pas `main`.

## Nouvel algorithme

Ajouter `algorithms/mon_module.py` avec une fonction Python pure, un `execute` et `SPEC`, puis les tests correspondants. Le registre l'intègre sans toucher aux pages Streamlit pour les types de champs pris en charge. Les exemples scolaires restent dans `SPEC.code_sections`, séparés des validations internes.
