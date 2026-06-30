"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./Hero.module.css";
import LoginModal from "@/app/login/LoginModal";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Hero() {
  const { user } = useAuth();
  const router = useRouter();

  const [loginOpen, setLoginOpen] = useState(false);

  const handleProtectedAction = () => {
    if (user) {
      router.push("/swap");
    } else {
      setLoginOpen(true);
    }
  };

  return (
    <section className={styles.hero} id="home">
      <div className={styles.inner}>
        {/* Left Side */}
        <div className={styles.copy}>
          <h1 className={styles.heading}>
            Every Product
            <br />
            Deserves a
            <br />
            <span className={styles.headingAccent}>
              Second Life
              <svg
                className={styles.heart}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 21s-7.5-4.6-10-9.3C0.3 7.7 2.6 4 6.3 4c2.1 0 3.7 1.1 4.7 2.7C12 5.1 13.6 4 15.7 4 19.4 4 21.7 7.7 20 11.7 19.5 16.4 12 21 12 21z" />
              </svg>
            </span>
          </h1>

          <div className={styles.divider} />

          <p className={styles.description}>
            Jo aapke liye useless hai,
            <br />
            kisi aur ke liye
            <br />
            valuable ho sakta hai.
          </p>

          <p className={styles.hashtag}>#ExchangeForBetter</p>

          <div className={styles.actions}>
            <button
              className={styles.primaryBtn}
              type="button"
              onClick={handleProtectedAction}
            >
              find what you need
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>

            <button className={styles.outlineBtn} type="button">
              how it works
            </button>
          </div>
        </div>

        {/* Right Side */}
        <div className={styles.mockupArea} aria-hidden="true">
          <Image
            src="/Image/LandingPage/hero-img.png"
            alt="Chair with teddy bear, camera and books available for exchange"
            width={640}
            height={640}
            className={styles.heroImg}
            priority
          />
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
