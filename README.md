# Daily Roadmap Routine

A modern mobile-friendly routine website with real Firebase login.

## What it includes

- Real email/password signup and login using Firebase Authentication
- Firestore database for saving each user's daily routine
- Admin view for the admin email
- Daily checklist
- Daily comments/reflection
- Class day / no-class day / custom agenda
- 3 YouTube channel idea tracker
- Discipline rules
- Responsive design for phone and desktop
- GitHub Pages ready

## Setup

1. Create Firebase project.
2. Enable Authentication > Email/Password.
3. Create Cloud Firestore database.
4. Replace the config inside `firebase-config.js`.
5. In Firestore Rules, paste the content from `firestore.rules`.
6. Upload these files to GitHub.
7. Enable GitHub Pages from Settings > Pages.

## Important

GitHub Pages hosts the frontend only. Firebase provides the real login and database.
