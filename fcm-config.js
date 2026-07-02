/* =========================================================
   Firebase Cloud Messaging Web Setup
   Handles foreground messages, token generation and saving token locally.
   Requires firebase-client-config.js with real Firebase config + VAPID key.
========================================================= */
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getMessaging, getToken, onMessage, isSupported } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js';

const $ = id => document.getElementById(id);
const config = window.HTB_FIREBASE_CONFIG || null;
const vapidKey = window.HTB_VAPID_KEY || '';

function setStatus(id, message) {
  const el = $(id);
  if (el) el.textContent = message;
}

function isConfigured() {
  return config && config.apiKey && !String(config.apiKey).includes('PASTE_') && vapidKey && !String(vapidKey).includes('PASTE_');
}

async function showForegroundNotification(payload) {
  try {
    if (Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const title = payload?.notification?.title || payload?.data?.title || 'How This Began Control Room';
    const body = payload?.notification?.body || payload?.data?.body || 'You have a new reminder.';
    await reg.showNotification(title, {
      body,
      icon: './icon-192.png',
      badge: './badge-72.png',
      tag: payload?.data?.tag || `fcm-${Date.now()}`,
      data: { url: payload?.data?.url || './index.html' }
    });
  } catch (error) {
    console.warn('Foreground notification failed:', error);
  }
}

export async function enablePushMessaging() {
  try {
    if (!(await isSupported())) {
      setStatus('pushStatus', 'Firebase messaging is not supported in this browser.');
      return null;
    }
    if (!isConfigured()) {
      setStatus('pushStatus', 'Paste Firebase config + VAPID key inside firebase-client-config.js first.');
      return null;
    }
    if (!('Notification' in window)) {
      setStatus('pushStatus', 'Notifications are not supported in this browser.');
      return null;
    }
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('pushStatus', 'Push permission was not granted.');
        return null;
      }
    }

    const app = getApps().length ? getApps()[0] : initializeApp(config);
    const messaging = getMessaging(app);
    const swReg = await navigator.serviceWorker.register('./firebase-messaging-sw.js', { scope: './' });
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });

    if (!token) {
      setStatus('pushStatus', 'No FCM token returned. Check Firebase web push certificate.');
      return null;
    }

    localStorage.setItem('htbFcmToken', token);
    localStorage.setItem('htbFcmTokenSavedAt', new Date().toISOString());
    const box = $('fcmTokenBox');
    if (box) box.value = token;
    setStatus('pushStatus', 'Push token ready. Save/copy this token for Firebase scheduled pushes.');
    return token;
  } catch (error) {
    console.error(error);
    setStatus('pushStatus', error.message || 'Could not enable Firebase push messaging.');
    return null;
  }
}

async function initForegroundMessaging() {
  try {
    if (!(await isSupported()) || !isConfigured()) return;
    const app = getApps().length ? getApps()[0] : initializeApp(config);
    const messaging = getMessaging(app);
    onMessage(messaging, payload => {
      console.log('FCM foreground message:', payload);
      showForegroundNotification(payload);
    });
  } catch (error) {
    console.warn('FCM foreground init failed:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('htbFcmToken');
  if (saved && $('fcmTokenBox')) $('fcmTokenBox').value = saved;

  $('enablePushBtn')?.addEventListener('click', enablePushMessaging);
  $('copyTokenBtn')?.addEventListener('click', async () => {
    const token = $('fcmTokenBox')?.value || localStorage.getItem('htbFcmToken') || '';
    if (!token) {
      setStatus('pushStatus', 'No token to copy yet. Enable push first.');
      return;
    }
    await navigator.clipboard.writeText(token);
    setStatus('pushStatus', 'FCM token copied.');
  });

  if (!isConfigured()) {
    setStatus('pushStatus', 'FCM waiting for Firebase config + VAPID key. Local Pro notifications can still work.');
  }

  initForegroundMessaging();
});
