# How This Began Daily Control Room — PRO PWA Upgrade

This package upgrades the routine app with:

- Class Day / Holiday Mode / Deep Work Mode
- Morning class 08:00–12:30 and optional afternoon class 14:00–17:00
- Recovered Time Plan when afternoon class is cancelled
- Two How This Began videos per week tracker
- Coding + sport + university revision structure
- Social media discipline for YouTube, TikTok, X, and WhatsApp
- No alcohol / no girls distraction / no peer pressure tracker
- PWA install support
- Service worker notifications
- Firebase Cloud Messaging-ready background push system

## Files to upload to your GitHub repo

Replace or add these files in the root of your repo:

```text
index.html
style.css
manifest.json
pro-discipline.js
firebase-client-config.js
fcm-config.js
firebase-messaging-sw.js
```

Optional closed-app scheduler folder:

```text
functions/package.json
functions/index.js
```

## Important truth about notifications

GitHub Pages is static hosting. Local JavaScript reminders work when the PWA/browser is active. Real closed-app reminders need a push sender, normally Firebase Cloud Messaging + Cloud Functions.

The included service worker can receive push notifications. The included Cloud Functions folder is a starter for scheduled closed-app reminders.

## Firebase setup

1. Open Firebase Console.
2. Go to Project settings > General > Your apps > Web app.
3. Copy `firebaseConfig` values.
4. Paste them into `firebase-client-config.js`.
5. Go to Project settings > Cloud Messaging > Web Push certificates.
6. Generate/copy the Web Push VAPID key.
7. Paste it into `HTB_VAPID_KEY` inside `firebase-client-config.js`.
8. Upload all files to GitHub.
9. Open your GitHub Pages URL using HTTPS.
10. Click **Install App**.
11. Click **Enable Pro Notifications**.
12. Click **Enable Push Notifications**.
13. Copy the FCM token if you want to test cloud push.

## Optional Cloud Functions deployment

Install Firebase CLI, log in, then from your project folder:

```bash
firebase login
firebase init functions
```

Use Node 20 and JavaScript. Replace the generated `functions/index.js` and `functions/package.json` with the included versions.

Deploy:

```bash
firebase deploy --only functions
```

To queue a closed-app reminder, create a Firestore document in `pushQueue`:

```json
{
  "token": "YOUR_FCM_TOKEN",
  "title": "Sport time",
  "body": "No negotiation. Train even when motivation is low.",
  "url": "./index.html",
  "tag": "sport-0630",
  "dueAt": "2026-07-03T06:30:00+02:00",
  "status": "pending"
}
```

The scheduler checks every 5 minutes in Africa/Kigali timezone and sends due notifications.

## Daily mission rules included

- No alcohol today
- No chasing girls
- No peer pressure decision
- No random scrolling
- Sport completed
- Sleep protected
- YouTube, TikTok, X, WhatsApp used with purpose only
- Two How This Began videos every week

## Recommended first test

1. Upload files.
2. Open app.
3. Enable notifications.
4. Press **Test** in Pro PWA Reminder Engine.
5. Install app on Chrome/Edge Android.
6. Configure Firebase and FCM token.
7. Send a test notification from Firebase Console.
