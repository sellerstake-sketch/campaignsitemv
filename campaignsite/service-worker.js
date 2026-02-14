// Simple service worker to prevent 404 errors
// This service worker does nothing - just to stop browser from looking for it
// We don't intercept fetch events to avoid interfering with network requests

self.addEventListener('install', (event) => {
    // Skip waiting and activate immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Take control of all pages immediately
    event.waitUntil(clients.claim());
});

// No fetch listener - let all requests pass through normally without interception
// This prevents 404 errors for service-worker.js while not interfering with app functionality