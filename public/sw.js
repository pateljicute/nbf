const CACHE_NAME = 'nbfhomes-v4-killer';

self.addEventListener('install', (event) => {
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // DELETE ALL CACHES TO FIX CORRUPTED DATA
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    console.log('Deleting cache:', cacheName);
                    return caches.delete(cacheName);
                })
            ).then(() => {
                // Take control of all clients immediately
                return self.clients.claim();
            });
        })
    );
});

self.addEventListener('fetch', (event) => {
    // NETWORK ONLY STRATEGY
    // We intentionally bypass cache to ensure the fresh App Shell and JS chunks are loaded
    event.respondWith(fetch(event.request));
});
