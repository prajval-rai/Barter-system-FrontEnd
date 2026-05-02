// public/firebase-messaging-sw.js  ← must be in public folder
importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:  "AIzaSyAl4_5r5wsNpt39edP0hBpIOkC2dn_OutA",
  authDomain: "bartersystem-90a0b.firebaseapp.com",
  projectId: "bartersystem-90a0b",
  storageBucket: "bartersystem-90a0b.firebasestorage.app",
  messagingSenderId: "311324772607",
  appId:"1:311324772607:web:23ac44c3d34315cc03a4ca",
});

const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    tag: Date.now().toString(),
  });
});