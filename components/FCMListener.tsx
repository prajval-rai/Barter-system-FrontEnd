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

    const init = async () => {
      try {
        // ✅ Register SW at ROOT scope explicitly
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          { scope: "/" }  // ✅ force root scope
        );

        console.log("SW registered at scope:", registration.scope);

        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
        const messaging = getMessaging(app);

        const unsubscribe = onMessage(messaging, async (payload) => {
          console.log("🔔 Foreground notification:", payload);

          const title = payload?.notification?.title ?? "Notification";
          const body = payload?.notification?.body ?? "";

          // ✅ Use the root scope registration
          await registration.showNotification(title, {
            body,
            icon: "/logo.png",
            tag: Date.now().toString(),
            requireInteraction: true,
          });
        });

        return () => unsubscribe();

      } catch (err) {
        console.error("FCMListener error:", err);
      }
    };

    init();
  }, []);

  return null;
}