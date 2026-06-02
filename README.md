# My Daily Roadmap Routine — V12 Final Merge Pro

This is the full final merged version: premium mobile app UI + all previous working features.

## Included

- Firebase Email/Password login
- Admin-only access for `iragenacoach@gmail.com`
- Firestore database saving
- Mobile app UI inspired by premium booking/travel app layouts
- Bottom navigation
- Daily agenda and activities
- Edit/delete activities
- Automatic midnight reset to a fresh day
- Browser notifications while app is open
- Task notifications 5 minutes before and at exact time while app is open
- Firebase Cloud Messaging token support
- PWA install/app mode
- AI Coach with Firebase AI Logic / Gemini fallback
- Habit tracking and streak display
- Goal/channel system: DiraIQ, 5 Highlight, GeoMystery
- Daily achievement archive
- Download today report
- Download achievements as JSON/CSV
- Settings
- Discipline rules

## Upload to GitHub

Extract the ZIP and upload/replace all root files:

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

## Important

If your `fcm-config.js` already has your Firebase Web Push certificate public key, do not overwrite it, or paste the key again after uploading.

## Firebase Rules

Paste `firestore.rules` into Firebase Console → Firestore → Rules → Publish.
