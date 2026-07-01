"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./FAQ.module.css";
import FAQItem from "./FAQItem";

const FAQS = [
  {
    question: "How does exchanging on lenden actually work?",
    answer:
      "List an item you don't need, browse what others have listed, and propose a swap. Once both sides agree, you arrange the handover directly — no money changes hands unless you both choose to add one.",
  },
  {
    question: "Is exchanging free, or does lenden take a cut?",
    answer:
      "Listing and browsing items is free. We'll always be upfront if any paid features are introduced later — core exchanges stay free.",
  },
  {
    question: "What kind of items can I list?",
    answer:
      "Anything in good, usable condition — electronics, books, furniture, clothing, tools, and more. We just ask that listings are accurate and items are safe and legal to exchange.",
  },
  {
    question: "Can I rent an item instead of swapping it permanently?",
    answer:
      "Yes. When creating a listing, you can mark an item as available for rent with a return date, instead of a permanent exchange.",
  },
  {
    question: "How do I know the other person is trustworthy?",
    answer:
      "Every user has a profile with exchange history and ratings from past swaps. We recommend reviewing this and meeting in safe, public locations for handovers.",
  },
  {
    question: "What happens if an item isn't as described?",
    answer:
      "Report it through the swap's message thread. We review disputes on a case-by-case basis and factor them into the user's trust rating.",
  },
];

export default function FAQ() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className={styles.section} id="faqs">
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>Got Questions?</span>
          <h2 className={styles.title}>Frequently asked questions</h2>
        </div>

        <div
          ref={sectionRef}
          className={`${styles.list} ${inView ? styles.listInView : ""}`}
        >
          {FAQS.map((faq, i) => (
            <FAQItem
              key={faq.question}
              index={i}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onToggle={() => handleToggle(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
