# Carnet de recettes — application mobile (PWA)

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
- Données stockées sur l'appareil ; **Exporter / Importer** (JSON, partage natif sur mobile) pour sauvegarder ou changer de téléphone.
- Import de recettes depuis des captures d'écran via l'API Claude : ⚙ Réglages → coller sa clé API
  (stockée uniquement sur l'appareil).
