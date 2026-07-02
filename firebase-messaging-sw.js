/* =========================================================
   How This Began PWA + Firebase Messaging Service Worker
   - Offline cache for GitHub Pages PWA
   - Background FCM notifications when Firebase is configured
   - Notification click opens/focuses the app
========================================================= */
const CACHE_NAME = 'htb-control-room-v1';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './pro-discipline.js',
  './manifest.json',
  './firebase-client-config.js',
  './fcm-config.js',
  './icon-192.png',
  './icon-512.png',
  './badge-72.png'
];

let firebaseMessagingReady = false;

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL.map(url => new Request(url, { cache: 'reload' }))).catch(() => null))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => null);
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

try {
  importScripts('./firebase-client-config.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

  const config = self.HTB_FIREBASE_CONFIG || {};
  const configured = config.apiKey && !String(config.apiKey).includes('PASTE_');

  if (configured && self.firebase?.apps?.length === 0) {
    self.firebase.initializeApp(config);
  } else if (configured) {
    self.firebase.initializeApp(config);
  }

  if (configured && self.firebase?.messaging) {
    const messaging = self.firebase.messaging();
    firebaseMessagingReady = true;
    messaging.onBackgroundMessage(payload => {
      const title = payload?.notification?.title || payload?.data?.title || 'How This Began Control Room';
      const body = payload?.notification?.body || payload?.data?.body || 'It is time for your next action.';
      return self.registration.showNotification(title, {
        body,
        icon: './icon-192.png',
        badge: './badge-72.png',
        vibrate: [120, 60, 120],
        tag: payload?.data?.tag || `htb-fcm-${Date.now()}`,
        renotify: true,
        data: { url: payload?.data?.url || './index.html', ...payload?.data }
      });
    });
  }
} catch (error) {
  console.warn('Firebase messaging not initialized in service worker:', error);
}

// Fallback for non-FCM Web Push payloads. If FCM is active, FCM handles the message.
self.addEventListener('push', event => {
  if (firebaseMessagingReady) return;
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = { body: event.data?.text() || '' }; }
  const title = payload.title || payload.notification?.title || 'How This Began Control Room';
  const body = payload.body || payload.notification?.body || 'It is time for your next action.';
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: './icon-192.png',
    badge: './badge-72.png',
    vibrate: [120, 60, 120],
    tag: payload.tag || `htb-push-${Date.now()}`,
    renotify: true,
    data: { url: payload.url || './index.html' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification?.data?.url || './index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url).catch(() => null);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
