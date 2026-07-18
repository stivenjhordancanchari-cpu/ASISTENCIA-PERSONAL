// DISAM — Service Worker v4
// Incrementa la versión CACHE_NAME cada vez que se sube un archivo nuevo a GitHub
const CACHE_NAME = 'disam-v4';
const ASSETS = [
  './index.html','./manifest.json',
  './icon-72.png','./icon-96.png','./icon-128.png','./icon-144.png',
  './icon-152.png','./icon-192.png','./icon-384.png','./icon-512.png',
  './apple-touch-icon.png','./favicon-32x32.png','./favicon-16x16.png'
];

// Instalar: cachear todos los archivos
self.addEventListener('install', e => {
  // NO hacer skipWaiting aquí — esperar instrucción del usuario
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

// Activar: limpiar caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Mensaje desde la app: el usuario aceptó actualizar
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch: Network first para HTML (siempre la versión más nueva),
// Cache first para íconos y assets estáticos
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // APIs externas: dejar pasar sin interceptar
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('graph.facebook.com') ||
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) return;

  // index.html: siempre intentar red primero para tener la versión más reciente
  if (url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Resto de assets: cache first, luego red
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      });
    }).catch(() => caches.match('./index.html'))
  );
});
