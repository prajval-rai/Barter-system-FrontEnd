"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./Hero.module.css";
import LoginModal from "@/app/login/LoginModal";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const INITIAL_LISTINGS = 24735;

const FEED_ITEMS = [
  {
    color: "#F59E0B",
    offer: "Camping tent available",
    want: "Weekend rental • 2 mins ago",
  },
  {
    color: "#22C55E",
    offer: "Looking for a GoPro",
    want: "Needed for 2 days • 5 mins ago",
  },
  {
    color: "#14B8A6",
    offer: "Mountain bike available",
    want: "₹200/day • nearby",
  },
  {
    color: "#F87171",
    offer: "Engineering books available",
    want: "Semester borrow • today",
  },
  {
    color: "#60A5FA",
    offer: "DSLR camera available",
    want: "₹500/day • nearby",
  },
  {
    color: "#A78BFA",
    offer: "Drill machine available",
    want: "₹100/day • nearby",
  },
  {
    color: "#FB923C",
    offer: "Projector available",
    want: "1-day booking • today",
  },
  {
    color: "#34D399",
    offer: "Trekking backpack available",
    want: "Weekend rental • nearby",
  },
];

type FeedItem = {
  id: number;
  color: string;
  offer: string;
  want: string;
};

export default function Hero() {
  const { user } = useAuth();
  const router = useRouter();

  const [loginOpen, setLoginOpen] = useState(false);
  const [listingCount, setListingCount] = useState(INITIAL_LISTINGS);

  const [feed, setFeed] = useState<FeedItem[]>(
    FEED_ITEMS.slice(0, 5).map((item, i) => ({
      ...item,
      id: i,
    }))
  );

  const feedIndexRef = useRef(5);
  const idRef = useRef(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setListingCount((c) => c + Math.floor(Math.random() * 3 + 1));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const next =
        FEED_ITEMS[feedIndexRef.current % FEED_ITEMS.length];

      feedIndexRef.current++;
      idRef.current++;

      setFeed((prev) => [
        ...prev.slice(1),
        {
          ...next,
          id: idRef.current,
        },
      ]);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

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
            Don&apos;t buy everything.
          </h1>

          <p className={styles.description}>
            Why spend thousands on something you&apos;ll only use for a few
            days? Find camping gear, cameras, books, tools and more from
            people nearby.
          </p>

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

            <button
              className={styles.outlineBtn}
              type="button"
            >
              how it works
            </button>
          </div>

          <div className={styles.statRow}>
            <span
              className={styles.liveDot}
              aria-hidden="true"
            />

            <span>live right now —</span>

            <span className={styles.statCount}>
              {listingCount.toLocaleString()}
            </span>

            <span>community listings</span>
          </div>
        </div>

        {/* Right Side */}
        <div
          className={styles.mockupArea}
          aria-hidden="true"
        >
          <div className={styles.feedPanel}>
            <div className={styles.feedHeader}>
              <div className={styles.feedHeaderDots}>
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className={styles.feedList}>
              {feed.map((item, i) => (
                <div
                  key={item.id}
                  className={`${styles.feedRow} ${
                    i === feed.length - 1
                      ? styles.feedRowNew
                      : ""
                  }`}
                >
                  <span
                    className={styles.feedDot}
                    style={{
                      background: item.color,
                    }}
                  />

                  <div className={styles.feedText}>
                    <span className={styles.feedTitle}>
                      {item.offer}
                    </span>

                    <span className={styles.feedSub}>
                      {item.want}
                    </span>
                  </div>
                </div>
              ))}
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