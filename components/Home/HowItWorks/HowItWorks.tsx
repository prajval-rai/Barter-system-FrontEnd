"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./HowItWorks.module.css";

const STEPS = [
  {
    number: "01",
    title: "List your item",
    desc: "Snap a photo of what you don't need every day.",
  },
  {
    number: "02",
    title: "Find a match",
    desc: "We surface people nearby looking for exactly that.",
  },
  {
    number: "03",
    title: "Connect & chat",
    desc: "Work out the details and confirm the exchange.",
  },
  {
    number: "04",
    title: "Hand it over",
    desc: "Meet up, exchange, and get back what you actually needed.",
  },
];

export default function HowItWorks() {
  const railRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = railRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // animate in once, don't replay on every scroll pass
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>The exchange path</span>
          <h2 className={styles.title}>From your shelf to theirs.</h2>
        </div>

        <div
          ref={railRef}
          className={`${styles.rail} ${inView ? styles.railInView : ""}`}
          role="list"
        >
          {/* the drawn line that grows left -> right across all four stops */}
          <span className={styles.railLine} aria-hidden="true" />

          {STEPS.map((step, i) => (
            <div
              className={styles.stop}
              role="listitem"
              key={step.number}
              style={{ ["--i" as string]: i }}
            >
              <span className={styles.bigNumber} aria-hidden="true">
                {step.number}
              </span>
              <div className={styles.stopBody}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
