"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./CTA.module.css";
import LoginModal from "@/app/login/LoginModal";
import { useAuth } from "@/context/AuthContext";

export default function CTA() {
  const { user } = useAuth();
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);

  const handleGetStarted = () => {
    if (user) {
      router.push("/swap");
    } else {
      setLoginOpen(true);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.box}>
          {/* Left: copy */}
          <div className={styles.copy}>
            <span className={styles.eyebrow}>Join the community</span>
            <h2 className={styles.title}>Ready to LenDen Smarter?</h2>
            <p className={styles.desc}>
              Join thousands of people who are swapping smartly and living
              better every day.
            </p>

            <div className={styles.actionsRow}>
              <button className={styles.ctaBtn} type="button" onClick={handleGetStarted}>
                Get Started Now
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>

              <div className={styles.trustRow}>
                <div className={styles.avatars}>
                  <span className={styles.avatar} style={{ background: "#FDBA74" }} />
                  <span className={styles.avatar} style={{ background: "#93C5FD" }} />
                  <span className={styles.avatar} style={{ background: "#86EFAC" }} />
                </div>
                <span className={styles.trustText}>25K+ neighbours already exchanging</span>
              </div>
            </div>
          </div>

          {/* Right: illustration */}
          <div className={styles.illustration} aria-hidden="true">
            <svg className={styles.orbit} viewBox="0 0 260 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="130" cy="90" rx="110" ry="70" stroke="#1A56DB" strokeWidth="1.5" strokeDasharray="6 5" opacity="0.35" />
              <circle cx="20" cy="50" r="3" fill="#1A56DB" opacity="0.4" />
              <circle cx="240" cy="130" r="3" fill="#1A56DB" opacity="0.4" />
              <circle cx="235" cy="35" r="2" fill="#1A56DB" opacity="0.3" />
            </svg>

            <div className={styles.boxWrap}>
              <div className={styles.boxEmoji}>📦</div>
              <span className={styles.boxBadge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          setLoginOpen(false);
          router.push("/swap");
        }}
      />
    </section>
  );
}
