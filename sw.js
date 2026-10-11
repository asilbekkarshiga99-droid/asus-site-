const C = "asus-v3";
self.addEventListener("install", e => { self.skipWaiting(); });
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => { const u = new URL(e.request.url);
  // API жауаптары (жеке деректер) мен басқа сайттар кэштелмейді
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/") || u.pathname.endsWith("admin.html")) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(C).then(ch => ch.put(e.request, c)); } return r; }).catch(() => caches.match(e.request))); });
