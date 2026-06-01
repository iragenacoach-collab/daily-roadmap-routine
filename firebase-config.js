// STEP 1:
// Create a Firebase project, enable Authentication Email/Password,
// create Cloud Firestore, then replace this config with your real Firebase config.
// Firebase config is allowed to be public in frontend apps. Security comes from Firestore Rules.

export const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

// STEP 2:
// Put your real admin email here.
// Example: export const ADMIN_EMAIL = "iragenacoach@gmail.com";
export const ADMIN_EMAIL = "iragenacoach@gmail.com";
