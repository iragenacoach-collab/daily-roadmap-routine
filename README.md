# My Daily Roadmap Routine - V4 AI Coach

Private personal discipline system for one admin user.

## V4 features

Everything from V3, plus Gemini AI coaching using Firebase AI Logic:

- Private admin-only access
- Daily checklist
- Class day / no class day / custom day agendas
- Daily reflection with mood and energy
- Finish My Day button
- Daily achievement archive
- Score, streak, average score, best score
- Rule-based daily advice fallback
- Gemini AI Daily Review
- Gemini AI Tomorrow Plan
- Gemini AI Channel Coaching
- Gemini AI Weekly Discipline Review
- Channel Growth Coach
- Browser/on-site reminders
- Discipline rules
- Routine settings

## Important AI setup

This version uses Firebase AI Logic, not a direct Gemini API key in frontend code.

To activate Gemini AI:

1. Open Firebase Console.
2. Go to AI Services > AI Logic.
3. Click Get started.
4. Choose Gemini Developer API.
5. Finish the setup.
6. Later, enable Firebase App Check for protection.

If AI Logic is not enabled, the app still works and shows fallback rule-based advice.

## Firestore Rules

Use the content from `firestore.rules`.

Only this email can read/write data:

iragenacoach@gmail.com

## Upload to GitHub

Replace these files in your repository:

- index.html
- style.css
- app.js
- firestore.rules
- README.md

Keep firebase-config.js as long as it contains your real Firebase config.
