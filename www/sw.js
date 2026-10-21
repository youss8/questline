// Offline cache for the browser/PWA version. The Android app bundles these files itself.
const CACHE = 'questline-v3';
const FILES = ['./', 'index.html', 'style.css', 'manifest.webmanifest', 'icon.png',
  'fonts/inter-400.woff2', 'fonts/inter-500.woff2', 'fonts/inter-600.woff2', 'fonts/inter-700.woff2', 'fonts/barlow-500.woff2', 'fonts/barlow-600.woff2', 'fonts/barlow-700.woff2',
  'js/util.js', 'js/icons.js', 'js/content.js', 'js/foods.js', 'js/state.js', 'js/sfx.js', 'js/schedule.js', 'js/nutrition.js', 'js/program.js', 'js/game.js', 'js/native.js', 'js/fx.js', 'js/views.js', 'js/sheets.js', 'js/onboarding.js', 'js/main.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => { if (e.request.method !== 'GET') return; e.respondWith(caches.match(e.request).then(h => h || fetch(e.request).catch(() => caches.match('index.html')))); });
