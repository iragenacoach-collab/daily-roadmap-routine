importScripts("https://www.gstatic.com/firebasejs/12.5.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.5.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCuY7Hbc79OoAhp_bq91VGz4cQTX85kOo0",
  authDomain: "daily-roadmap-routine.firebaseapp.com",
  projectId: "daily-roadmap-routine",
  storageBucket: "daily-roadmap-routine.firebasestorage.app",
  messagingSenderId: "772011561444",
  appId: "1:772011561444:web:8b31405ef790dcc19177f1"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "Daily Roadmap Reminder";
  const options = {
    body: payload?.notification?.body || payload?.data?.body || "Protect your focus today.",
    icon: "./icon-192.png",
    badge: "./badge-72.png",
    requireInteraction: true,
    data: payload?.data || {}
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("./");
    })
  );
});
