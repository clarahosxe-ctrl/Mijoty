const CACHE = 'mijoty-v13';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './recipes.json',
  './fonts/fonts.css', './fonts/Inter.woff2',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/logo.png', './icons/logo-320.png',
  './img/lemon.png', './img/tomate.png', './img/branche.png', './img/olives.png', './img/haricot.png', './img/figue.png', './img/raisin.png', './img/tasse.png', './img/citron-vert.png', './img/farfalle.png', './img/palmier.png', './img/artichaut.png', './img/assiette.png', './img/cafetiere.png', './img/citron-demi.png', './img/citron-feuilles.png', './img/conchiglie.png', './img/cuillere.png', './img/figue2.png', './img/fourchette.png', './img/fraise.png', './img/glace.png', './img/herbes.png', './img/macaroni.png', './img/oignon.png', './img/pates.png', './img/penne.png', './img/piment.png', './img/pizza.png', './img/ravioli.png', './img/tasse2.png', './img/tomate-tranche.png', './img/tomate2.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Ressources : cache d'abord, réseau en secours (l'API Anthropic n'est jamais interceptée).
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Pages : réseau d'abord (les mises à jour arrivent seules), cache en secours hors ligne.
  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req, { cache: 'no-cache' }).then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put('./index.html', c)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
