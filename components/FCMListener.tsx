"use client";
import { useEffect } from "react";
import { getApps, initializeApp } from "firebase/app";
import { getMessaging, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export default function FCMListener() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    const unsubscribe = onMessage(messaging, async (payload) => {
  const title = payload.notification?.title || "Notification";
  const body = payload.notification?.body || "";

  // ✅ Play beep sound
  const audio = new Audio("/beep.wav");  // add beep.mp3 to public folder
  audio.play();

  const registration = await navigator.serviceWorker.ready;
  registration.showNotification(title, {
    body: body,
    icon: "/danger.png",
    tag: Date.now().toString(),
    requireInteraction: true,
    silent: false,
  });
});

    return () => unsubscribe();
  }, []);

  return null;
}