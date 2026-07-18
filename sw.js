// DISAM — Service Worker v3
const CACHE_NAME = 'disam-v3';
const ASSETS = [
  './index.html','./manifest.json',
  './icon-72.png','./icon-96.png','./icon-128.png','./icon-144.png',
  './icon-152.png','./icon-192.png','./icon-384.png','./icon-512.png',
  './apple-touch-icon.png','./favicon-32x32.png','./favicon-16x16.png'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))
  )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.hostname.includes('supabase.co')||url.hostname.includes('graph.facebook.com')||
     url.hostname.includes('cdnjs.cloudflare.com')||url.hostname.includes('cdn.jsdelivr.net')||
     url.hostname.includes('fonts.googleapis.com')||url.hostname.includes('fonts.gstatic.com'))return;
  e.respondWith(
    fetch(e.request).then(res=>{
      if(res.ok){const c=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put(e.request,c));}
      return res;
    }).catch(()=>caches.match(e.request))
  );
});
