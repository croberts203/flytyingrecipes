// Fly Bench service worker: lets the app open offline and install as an app.
// The app's own pages and scripts: network first (so fixes show up right away), saved copy when offline.
// Icons and outside libraries (pinned versions): saved copy first.
// Account data (Supabase) is never cached here.
const CACHE = "flybench-v10"; // bump to clear old copies on every phone
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/privacy.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("supabase.co")) return;
  if (req.mode === "navigate" || (url.origin === location.origin && /\.(html|js|css|webmanifest)$/.test(url.pathname))) {
    e.respondWith(fetch(req, { cache: "no-cache" }).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return r; })
      .catch(() => caches.match(req).then((r) => r || caches.match("/index.html"))));
    return;
  }
  const cacheable = url.origin === location.origin || ["esm.sh", "unpkg.com", "cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"].some((h) => url.hostname.endsWith(h));
  if (!cacheable) return;
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return r;
  })));
});
