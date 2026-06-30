"use client";

import { useEffect, useRef } from "react";
import s from "./LoginModal.module.css";
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
import { useAuth } from "@/context/AuthContext"; // ← adjust path if needed
import LenDenLogo from "@/components/LenDenLogo";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const btnRef = useRef<HTMLDivElement>(null);
  const { login } = useAuth(); // ← pull login from context

  /* Close on Escape key */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  /* Lock body scroll when open */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  /* Init Google GSI button */
  useEffect(() => {
    if (!isOpen) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGoogle = () => {
      if (!window.google || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: false,
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        width: btnRef.current.offsetWidth || 340,
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
      });
    };

    const timeout = setTimeout(() => {
      if (window.google) {
        initGoogle();
      } else {
        const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        script?.addEventListener("load", initGoogle);
      }
    }, 50);

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const sendLoginNotification = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const messaging = getMessaging(app);
      const fcmToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      if (!fcmToken) return;

      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}accounts/notifications/send-notification/`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: fcmToken }),
        }
      );
    } catch (err) {
      console.error("FCM Error:", err);
    }
  };

  const handleCredentialResponse = async (response: { credential: string }) => {
    try {
      await login(response.credential);
      sendLoginNotification().catch(console.error);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={s.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>

        {/* Close button */}
        <button className={s.closeBtn} onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>

        {/* Header */}
        <div className={s.header}>
          <div className={s.badge}>
            <span className={s.badgeStar}>✦</span>
            LenDen Marketplace
          </div>

          <div className={s.logoRing}>
            <LenDenLogo width={120} />
          </div>

          <div className={s.tagline}>Trade · Exchange · Deal</div>
        </div>

        {/* Body */}
        <div className={s.body}>
          <div className={s.welcome}>
            <h2 className={s.welcomeTitle}>Welcome back!</h2>
            <p className={s.welcomeSub}>Sign in to access your marketplace and trades</p>
          </div>

          <div className={s.divider}>
            <span className={s.dividerText}>continue with</span>
          </div>

          <div className={s.googleBtnWrap}>
            <div ref={btnRef} style={{ width: "100%" }} />
          </div>

          <div className={s.featuresLabel}>What you get with LenDen</div>
          <div className={s.features}>
            {[
              "Browse thousands of items to trade",
              "Secure peer-to-peer exchanges",
              "Real-time trade chat & notifications",
              "Your data is never sold or shared",
            ].map((f, i) => (
              <div key={i} className={s.featureItem}>
                <div className={s.featureDot} />
                <span>{f}</span>
              </div>
            ))}
          </div>

          <p className={s.footerNote}>
            By signing in you agree to our{" "}
            <a href="#" className={s.footerLink}>Terms of Service</a>.
            <br />
            We only request your name, email &amp; profile picture.
          </p>
        </div>

      </div>
    </div>
  );
}
