// Keep this in sync with "version" in data/manifest.json and package.json.
// The validate:data check (run in CI) fails the build if they drift, which is
// what forces the cache to be invalidated whenever the app is re-released.
const CACHE_VERSION = 'v2.1.0';
const CACHE_NAME = `emoji-browser-${CACHE_VERSION}`;
const MANIFEST_URL = './data/manifest.json';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const manifestRes = await fetch(MANIFEST_URL);
        const manifest = await manifestRes.json();
        await cache.addAll(manifest.files);
      } catch (err) {
        console.warn('SW install: precache partially failed', err);
      }
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('emoji-browser-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req, './index.html', './offline.html'));
    return;
  }

  if (url.pathname.includes('/data/')) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  event.respondWith(cacheFirst(req));
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, res.clone());
    }
    return res;
  } catch (err) {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

async function networkFirst(req, fallbackUrl, offlineUrl) {
  try {
    const res = await fetch(req);
    // A redirected response cannot be stored, and storing a non-OK one would
    // poison the shell for every later offline visit.
    if (res && res.ok && !res.redirected) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(req, res.clone());
    }
    return res;
  } catch (err) {
    // respondWith() turns a resolved `undefined` into a hard network error, so
    // every branch below has to produce an actual Response.
    const cached =
      (await caches.match(req)) ||
      (await caches.match(fallbackUrl)) ||
      (await caches.match(offlineUrl));
    if (cached) return cached;
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Offline</title><p>غير متصل — Offline',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}
