# My Daily Roadmap Routine - V7 PWA + FCM Pro

This version adds PWA install + Firebase Cloud Messaging push notifications.

## What V7 adds

- PWA manifest
- Phone install support
- Firebase Messaging service worker
- Lock-screen push notification support
- FCM token generation and private Firestore saving
- Test lock-screen notification button
- Optional Firebase Functions scheduler for reminders while app is closed
- Keeps all V6 features: channels, midnight reset, downloads, AI coach, archive, edit activities

## Upload to GitHub

Upload/replace these root files:

- index.html
- style.css
- app.js
- firebase-config.js
- fcm-config.js
- firebase-messaging-sw.js
- manifest.json
- favicon.png
- icon-192.png
- icon-512.png
- badge-72.png
- README.md
- firestore.rules

Do not upload only the zip. Extract first.

## Required Firebase step

1. Firebase Console
2. Project settings
3. Cloud Messaging
4. Web Push certificates
5. Generate key pair
6. Copy the public key
7. Paste it into `fcm-config.js`

## Optional closed-app scheduled reminders

To receive reminders at exact times when the app is closed, deploy the `functions` folder with Firebase CLI.

Important: Cloud Functions require the Blaze plan.

## iPhone

For iPhone push, install the website to Home Screen first, then open the installed app and enable push notifications.


## V8 Mobile Gradient Pro CSS Fix

This update fixes:
- Phone horizontal overflow
- Activity cards cut off on mobile
- Edit/Delete buttons too large and awkward
- Sidebar/mobile nav layout
- Adds cleaner linear-gradient styling
- Better small-screen spacing


## V9 Task Notifications

Every activity in Today can now trigger notifications:
- 5 minutes before the activity starts
- At the exact activity time
- Works while the PWA/browser is open
- Optional Firebase Functions scheduler also sends task notifications when app is closed, if deployed on Blaze plan

Use time format like 05:00, 18:00, 22:30 for notification detection.
