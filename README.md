# FONCTIONS 🧠

**Bibliothèque interactive d'algorithmique pour les lycéens tunisiens.**

Cette version est une première base éducative : **7 modules existants**, en pseudo-code, Python et exécution interactive. Elle **ne prétend pas couvrir la totalité** des programmes de 3ème ou 4ème Sciences de l'Informatique.

## Démarrer

Python 3.10+ recommandé.

```bash
python -m venv .venv
# Linux / macOS
source .venv/bin/activate
# Windows PowerShell : .venv\Scripts\Activate.ps1
pip install -r requirements.txt
streamlit run streamlit_app.py
```

## Ce qui est inclus

- **Accueil** : présentation du projet, accès aux modules.
- **Bibliothèque** : recherche par mot clé et filtre par catégorie.
- **Parcours scolaires** : révisions 3ème Info et prérequis pour le Bac Info ; l'intégration progressive de nouveaux modules est prévue.
- **Atelier** : saisie, calcul, trace pédagogique, pseudocode et **code Python scolaire rédigé indépendamment du moteur d’exécution**. Chaque atelier possède une URL partageable (`/atelier?algo=pgcd` par exemple).
- **Modules** : PGCD, PPCM, SOM_CH, VERIF, TABLEAU, ENREGISTREMENT, MATRICE.

Les algorithmes mathématiques utilisent les méthodes pédagogiques du projet original (soustractions successives pour le PGCD, additions successives pour le PPCM). Le tri est un **tri par sélection** décroissant, inversé pour obtenir l'ordre croissant.

## Organisation

```text
streamlit_app.py       # navigation / lancement
algorithms/
  schema.py            # InputField, AlgorithmSpec, AlgorithmResult
  registry.py          # découverte automatique des modules
  pgcd.py ...          # code métier pur, SANS import de Streamlit
ui/
  pages.py             # composants et pages réutilisables
  fields.py            # saisie et validation générique
  style.py             # thème et CSS
.streamlit/config.toml # couleurs
requirements.txt
tests/test_algorithms.py
```

## Ajouter une fonction SANS modifier Streamlit

1. Créer un fichier Python dans `algorithms/` (par exemple `factorielle.py`).
2. Écrire une fonction pure, une fonction `execute` renvoyant un `AlgorithmResult`, et une constante `SPEC : AlgorithmSpec`.
3. Ajouter ses champs (`InputField`), ses exemples pédagogiques (`CodeSection`), son pseudo-code et sa classification (`level="3ème Info"`, `level="4ème Info"` ou `level="Transversal"`) à `SPEC`.
4. Relancer l'app : le module sera détecté automatiquement dans la bibliothèque et dans le parcours de révision.

Exemple minimal (démonstration technique **non comprise dans les 7 modules publiés**) :

```python
from .schema import AlgorithmResult, AlgorithmSpec, InputField, CodeSection


def doubler(n: int) -> int:
    return 2 * n


def execute(n: int) -> AlgorithmResult:
    return AlgorithmResult(doubler(n), (f"2 × {n} = {2*n}",))

SPEC = AlgorithmSpec(
    slug="doubler", name="DOUBLER", full_name="Doubler un entier",
    category="Mathématiques", summary="Multiplier un nombre par 2.",
    principle="Additionner le nombre à lui-même.",
    pseudocode="Fonction DOUBLER(n : Entier) : Entier\nDébut\n    Retourner 2 * n\nFin",
    inputs=(InputField("n", "Entier", "int", 4),),
    function=doubler, execute=execute, example="DOUBLER(4) = 8",
    code_sections=(CodeSection(
        title="Fonction DOUBLER",
        pseudocode="Fonction DOUBLER(n : Entier) : Entier\nDébut\n    Retourner 2 * n\nFin",
        python="def doubler(n):\n    return 2 * n",
    ),),
)
```

Cet exemple explique **comment étendre la plateforme** : il n'est pas ajouté au catalogue livré.

### Types d'entrées génériques disponibles

`int`, `float`, `text`, `choice`, `int_list`, `matrix`, `records`.

Une nouvelle fonction utilisant ces types n'exige **aucune modification à `streamlit_app.py` ou à `ui/pages.py`**. Si une nouvelle fonctionnalité exige un type d'entrée encore inexistant (graphique, fichier, etc.), on pourra étendre **une seule fois** le rendu générique `ui/fields.py`.

### Pseudocode et programme scolaire

Le pseudo-code est une adaptation pédagogique **à vérifier avec les conventions appliquées par l'enseignant et le référentiel scolaire à jour**. Les rubriques 3ème/4ème sont des parcours de révision proposés, **pas un syllabus officiel ou exhaustif**.

Pour vérifier la nomenclature :
- [Documentation de référence algorithmique en Tunisie](https://www.algo.tn/drive/)

### Différences intentionnelles par rapport au projet d'origine

- Les sept modules restent les mêmes ; aucun nouvel algorithme n'est ajouté au catalogue.
- Le moteur Python est séparé de Streamlit. Les extraits scolaires TABLEAU et MATRICE conservent la déclaration NumPy de ton projet original.
- Vérification explicite des entrées invalides, noms de champs uniques, limites raisonnables de taille.
- Le module ENREGISTREMENT est une **démonstration de champs via dictionnaire Python** : un enregistrement scolaire à champs définis ne se réduit pas conceptuellement à un dictionnaire dynamique.
- Les exemples affichés sont volontairement distincts du code interne, pour présenter un Python accessible au niveau scolaire (pas de `raise` ni de `try/except` dans les extraits). L'atelier conserve ses vérifications techniques sans les enseigner.

## Tester

```bash
pip install pytest
python -m pytest -q
```

## Mettre en ligne sans perturber l'app actuelle

1. Tester cette version dans un dépôt ou une branche séparée.
2. Si tu veux remplacer le déploiement existant, mettre à jour **Main file path** dans Streamlit Community Cloud vers `streamlit_app.py` à la racine de ce projet (ou le chemin correspondant dans ton dépôt).
3. Confirmer la validation avant de modifier la branche/deployment en production.

Pas de comptes ni de base de données pour cette version. Le code métier reste réutilisable si un frontend sur mesure est développé plus tard.

## Windows PowerShell : commande de lancement

Depuis le dossier contenant `streamlit_app.py` :

```powershell
py -m pip install -r requirements.txt
py -m streamlit run streamlit_app.py
```

Si une erreur `IndentationError` apparaît à la première ligne de `streamlit_app.py`, vérifie que la première ligne commence exactement par `import streamlit as st`, sans aucun espace ni tabulation devant. Il faut remplacer la copie locale du fichier puis relancer Streamlit.

## Code Python à destination des élèves

Le contenu de l'onglet **Algorithme & Python** est maintenant défini explicitement dans `SPEC.code_sections` : chaque `CodeSection` contient un **titre**, un **pseudo-code** et un **extrait Python scolaire**, avec une remarque facultative. Le moteur de calcul (`function` / `execute`) reste indépendant et conserve ses contrôles de données : c'est volontaire.

- **PGCD, PPCM, SOM_CH, VERIF** : présentation simple des fonctions, sans gestion avancée d'exceptions dans les extraits visibles.
- **TABLEAU** : déclaration NumPy avec TDNT/TDOG, remplissage manuel, remplissage aléatoire, affichage, puis tri par sélection (ordre décroissant, comme la version d'origine).
- **MATRICE** : déclaration NumPy avec TDNT/TDOG, remplissage manuel, remplissage aléatoire et affichage ; pas de tri, car le projet original n'en contenait pas.
- **ENREGISTREMENT** : exemple scolaire fixe à trois champs (déclarer / remplir / afficher), distinct de l'atelier dynamique qui permet d'ajouter des champs.

Les snippets Python du tableau et de la matrice utilisent `float()` comme dans tes fichiers d'origine ; **l'interface interactive utilise encore des valeurs entières**. Une évolution vers les réels partout pourra être étudiée séparément.

Dans l'onglet code, ouvre chaque étape dans l'ordre. Modifier un exemple pédagogique ou en ajouter un ne nécessite pas de changement dans `ui/pages.py`.
