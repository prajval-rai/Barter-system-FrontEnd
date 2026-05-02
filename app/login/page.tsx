"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import s from "@/styles/Login.module.css";
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

/* Extend Window to include Google's GSI types */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);

  /* Already logged in — go to dashboard */
  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [user, loading, router]);

  /* Initialize Google Identity Services once lib is loaded */
  useEffect(() => {
    if (loading || user) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google Client ID is not configured.");
      return;
    }

    const initGoogle = () => {
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: "outline",
          size: "large",
          width: btnRef.current.offsetWidth || 340,
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
        });
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const script = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (script) {
        script.addEventListener("load", initGoogle);
        return () => script.removeEventListener("load", initGoogle);
      }
    }
  }, [loading, user]);

  /* Send Hi notification after login */
  const sendHiNotification = async () => {
    try {
      // 1. Ask permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("Notification permission denied");
        return;
      }

      // 2. Init Firebase & get FCM token
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const messaging = getMessaging(app);

      const fcmToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (!fcmToken) {
        console.log("No FCM token received");
        return;
      }

      console.log("FCM Token:", fcmToken); // ✅ visible in console

      // 3. Call Django API to send "Hi" notification instantly
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}accounts/notifications/send-notification/`,
        {
          method: "POST",credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: fcmToken }),
        }
      );

      const data = await response.json();
      console.log("Notification sent ✅", data);

    } catch (err) {
      console.error("FCM Error:", err); // don't block login if this fails
    }
  };

  /* Called by Google with the id_token */
  const handleCredentialResponse = async (response: { credential: string }) => {
    setSigningIn(true);
    setError("");
    try {
      // 1. Login to Django
      await login(response.credential);

      // 2. Send "Hi" notification instantly 🔔
      await sendHiNotification();

      // 3. Redirect
      router.replace("/");
    } catch (err: any) {
      setError(err.message || "Sign-in failed. Please try again.");
      setSigningIn(false);
    }
  };

  /* Loading state */
  if (loading) {
    return (
      <div className={s.page}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚖️</div>
          <div style={{ color: "var(--gold)", fontFamily: "'Cinzel', serif", fontSize: 14, letterSpacing: 2 }}>
            LOADING...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <span className={s.sparkle}>✦</span>
        <span className={s.sparkle}>✦</span>
        <span className={s.sparkle}>✦</span>
        <span className={s.sparkle}>✦</span>

        <div className={s.logoWrap}>
          <div className={s.logoIcon}>⚖️</div>
          <div className={s.logoTitle}>ExchangeIt</div>
          <div className={s.logoSub}>Trade · Exchange · Deal</div>
        </div>

        <div className={s.divider} />

        <div className={s.heading}>
          <div className={s.headingTitle}>Welcome back</div>
          <div className={s.headingSubtitle}>
            Sign in with your Google account to access the marketplace
          </div>
        </div>

        {error && <div className={s.errorBox}>⚠ {error}</div>}

        {signingIn ? (
          <div className={s.googleBtnWrap} style={{ justifyContent: "center", gap: 12 }}>
            <div className={s.spinner} />
            <span style={{ color: "#3c4043", fontWeight: 600, fontSize: 15 }}>
              Signing you in...
            </span>
          </div>
        ) : (
          <div className={s.googleBtnWrap}>
            <div ref={btnRef} style={{ width: "100%" }} />
          </div>
        )}

        <div className={s.features}>
          {[
            "Browse thousands of items to trade",
            "Secure peer-to-peer exchanges",
            "Real-time trade chat & notifications",
            "Your data is never sold or shared",
          ].map((f, i) => (
            <div key={i} className={s.featureItem}>
              <div className={s.featureDot} />
              {f}
            </div>
          ))}
        </div>

        <div className={s.footerNote}>
          By signing in you agree to our Terms of Service.
          <br />
          We only request your name, email, and profile picture.
        </div>
      </div>
    </div>
  );
}