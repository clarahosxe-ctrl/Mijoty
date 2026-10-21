# Mijoty — carnet de recettes (application mobile PWA)

Application installable sur téléphone (Android et iPhone), qui fonctionne hors ligne.
Recettes végétariennes classées par moment du repas, avec macros, planning de la semaine
et liste de courses.

## Installer sur le téléphone
1. Héberge le dossier en HTTPS (GitHub Pages, Netlify, Cloudflare Pages…) : Pages → branche, racine `/`.
2. Ouvre l'URL sur le téléphone.
   - **Android (Chrome)** : menu ⋮ → *Installer l'application*.
   - **iPhone (Safari)** : Partager → *Sur l'écran d'accueil*.

Test local : `python3 -m http.server 8000` puis http://localhost:8000.

## Fonctionnalités
- Recettes, recherche, filtres, favoris de la semaine, liste de courses, ajout / édition / suppression.
- Hors ligne (service worker), polices embarquées, plein écran, icône.
- Données stockées sur l'appareil (IndexedDB, avec migration automatique depuis l'ancien stockage) ; recettes de départ dans `recipes.json` ; **Exporter / Importer** (JSON, partage natif sur mobile) pour sauvegarder ou changer de téléphone.
- Import de recettes depuis des captures d'écran avec Claude, **sans saisir de clé dans l'appli** (voir ci-dessous).

## Activer l'analyse IA (une seule fois)
L'appli ne contient aucune clé : elle appelle un petit service (`worker/`, un Cloudflare Worker gratuit)
qui garde ta clé Anthropic et fait l'appel à ta place.

1. Crée un compte gratuit sur https://dash.cloudflare.com puis **Workers & Pages → Create → Hello World → Deploy**.
2. **Edit code** : remplace tout par le contenu de `worker/index.js`, puis **Deploy**.
3. **Settings → Variables and Secrets** :
   - secret `ANTHROPIC_API_KEY` = ta clé (https://console.anthropic.com) ;
   - variable `ALLOWED_ORIGINS` = l'adresse où l'appli est publiée, par ex. `https://clarahosxe-ctrl.github.io`.
4. Copie l'adresse du Worker (`https://….workers.dev`) et colle-la dans `config.js` (`aiProxyUrl`),
   ou dans l'appli : ⚙ Réglages → *Adresse du service d'analyse*.

Garde-fous : seules les adresses de `ALLOWED_ORIGINS` sont acceptées, 6 images maximum, la consigne et le modèle
sont fixés dans le service. Pense à définir une limite de dépense mensuelle dans la console Anthropic.
