"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import s from "@/styles/Login.module.css";

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

      // Render the official Google button inside our styled wrapper
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

    // GSI script may already be loaded or may still be loading
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

  /* Called by Google with the id_token */
  const handleCredentialResponse = async (response: { credential: string }) => {
    setSigningIn(true);
    setError("");
    try {
      await login(response.credential); // sends token to Django
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
        {/* Corner sparkles */}
        <span className={s.sparkle}>✦</span>
        <span className={s.sparkle}>✦</span>
        <span className={s.sparkle}>✦</span>
        <span className={s.sparkle}>✦</span>

        {/* Logo */}
        <div className={s.logoWrap}>
          <div className={s.logoIcon}>⚖️</div>
          <div className={s.logoTitle}>ExchangeIt</div>
          <div className={s.logoSub}>Trade · Exchange · Deal</div>
        </div>

        <div className={s.divider} />

        {/* Heading */}
        <div className={s.heading}>
          <div className={s.headingTitle}>Welcome back</div>
          <div className={s.headingSubtitle}>
            Sign in with your Google account to access the marketplace
          </div>
        </div>

        {/* Error */}
        {error && <div className={s.errorBox}>⚠ {error}</div>}

        {/* Signing-in overlay */}
        {signingIn ? (
          <div className={s.googleBtnWrap} style={{ justifyContent: "center", gap: 12 }}>
            <div className={s.spinner} />
            <span style={{ color: "#3c4043", fontWeight: 600, fontSize: 15 }}>
              Signing you in...
            </span>
          </div>
        ) : (
          /* Google renders its official button into this div */
          <div className={s.googleBtnWrap}>
            <div ref={btnRef} style={{ width: "100%" }} />
          </div>
        )}

        {/* Feature list */}
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