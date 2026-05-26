// src/components/GetFCMToken.jsx
import { useEffect, useState } from "react";
import { messaging } from "../firebase";
import { getToken } from "firebase/messaging";

export default function GetFCMToken() {
  const [token, setToken] = useState("");

  useEffect(() => {
    requestPermissionAndGetToken();
  }, []);

  const requestPermissionAndGetToken = async () => {
    try {
      // 1. Ask user for notification permission
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        // 2. Get FCM token
        const fcmToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, // from Firebase Console
        });

        console.log("FCM Token:", fcmToken); // copy this!
        setToken(fcmToken);

        // 3. Send token to Django backend
        const base_url    = process.env.NEXT_PUBLIC_BACKEND_URL;
        await fetch(`${base_url}api/notifications/send-notification/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: fcmToken }),
        });

      } else {
        console.log("Notification permission denied");
      }

    } catch (error) {
      console.error("Error getting FCM token:", error);
    }
  };

  return (
    <div>
      <p>FCM Token:</p>
      <p style={{ wordBreak: "break-all" }}>{token || "Getting token..."}</p>
    </div>
  );
}