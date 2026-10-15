# Référencement Google · Algo Fi Jib

Domaine canonique : **https://algofijib.vercel.app**

## Configuration (déjà intégrée au site)
- `/robots.txt` : autorise les pages publiques, annonce `/sitemap.xml`, bloque l'exploration des espaces privés.
- `/sitemap.xml` : accueil, bibliothèque, parcours, chapitres publics et méthodes **approuvées** (mis à jour lors des retraits/approbations).
- Titres, descriptions, liens canoniques et Open Graph sur les pages publiques.
- `noindex` sur Studio, Mon compte et Connexion ; aucune révision privée n'entre dans le sitemap.

## Vérifier le domaine dans Google Search Console
1. Ouvrir https://search.google.com/search-console/welcome.
2. Choisir **Préfixe de l'URL**, saisir `https://algofijib.vercel.app/`.
3. Sélectionner **Balise HTML** ; copier **uniquement le jeton de vérification**
   contenu dans la balise `google-site-verification` (pas toute la balise HTML).
4. Dans Vercel > algofijib > **Settings → Environment Variables**, définir
   `GOOGLE_SITE_VERIFICATION` = le jeton, pour l'environnement **Production**.
   Ne pas inscrire le jeton dans Git ni dans les leçons.
5. Redéployer la version de Production pour émettre la balise dans `<head>`.
6. Cliquer **Vérifier** dans Search Console.
7. Dans **Sitemaps**, saisir `sitemap.xml` et **Envoyer**. Facultatif :
   inspection de l'URL d'accueil puis demande d'indexation.

Vérifier ensuite `https://algofijib.vercel.app/robots.txt` et
`https://algofijib.vercel.app/sitemap.xml` depuis la version de Production.

Un sitemap n'assure pas le référencement : Google décide de l'indexation
et l'apparition peut prendre plusieurs jours ou semaines.
La connexion de Google Search Console est une action du propriétaire ;
elle n'est pas réalisée automatiquement par un commit GitHub.
