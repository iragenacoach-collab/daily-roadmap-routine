/*
  FIREBASE CLIENT CONFIG
  1) Go to Firebase Console > Project settings > General > Your apps > Web app.
  2) Copy the firebaseConfig values here.
  3) Go to Project settings > Cloud Messaging > Web Push certificates and generate/copy VAPID key.
  Without real values, local in-app notifications still work, but closed-app FCM push will not.
*/
(function (root) {
  root.HTB_FIREBASE_CONFIG = {
    apiKey: "PASTE_FIREBASE_API_KEY_HERE",
    authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
    projectId: "PASTE_PROJECT_ID",
    storageBucket: "PASTE_PROJECT_ID.appspot.com",
    messagingSenderId: "PASTE_MESSAGING_SENDER_ID",
    appId: "PASTE_FIREBASE_APP_ID"
  };

  root.HTB_VAPID_KEY = "PASTE_FIREBASE_WEB_PUSH_VAPID_KEY_HERE";
  root.HTB_ADMIN_EMAIL = "iragenacoach@gmail.com";
})(typeof self !== 'undefined' ? self : window);
