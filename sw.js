// app.scansmart.uk service-worker KILL-SWITCH
// 12 May 2026
//
// The marketing-site service worker (CACHE_VERSION 'scansmart-v5.0.50-v6-checkit-refactor')
// was inadvertently deployed to the kip-app Cloudflare Pages project during the 10 May
// 2026 deploy mishap. It cached the marketing-site index.html as /, so every PWA visitor
// was being served stale marketing-site HTML even after the kip-app was redeployed.
//
// This file replaces that service worker with a kill-switch:
//   1. Activates immediately (skipWaiting).
//   2. Deletes every cache the previous SW created.
//   3. Unregisters itself.
//   4. Reloads all open clients — they get a clean, SW-less page from the network.
//
// Because the kip-app index.html does NOT register a service worker, after this kill-switch
// runs once, no service worker is reinstalled and the app behaves like a regular page.

self.addEventListener('install', (event) => {
  // Activate immediately, don't wait for old clients to close.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 1. Delete every cache (including the marketing-site precache).
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));

    // 2. Unregister this service worker.
    await self.registration.unregister();

    // 3. Force every open window/tab to reload — they'll now have no SW and a clean cache.
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => {
      try { client.navigate(client.url); } catch (e) { /* navigate may fail in standalone mode; ignore */ }
    });
  })());
});

// Pass-through fetch handler — DON'T intercept anything. The browser handles requests
// directly. Only matters during the brief window between SW install and activate.
self.addEventListener('fetch', () => {
  // intentionally empty — no event.respondWith()
});
