"use client";
import React from "react";
import styles from "./FAQ.module.css";

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

export default function FAQItem({ question, answer, isOpen, onToggle, index }: FAQItemProps) {
  return (
    <div
      className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}
      style={{ ["--i" as string]: index }}
    >
      <button
        className={styles.question}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
      >
        <span>{question}</span>
        <span className={styles.icon} aria-hidden="true">
          <span className={styles.iconLineH} />
          <span className={styles.iconLineV} />
        </span>
      </button>
      <div
        id={`faq-answer-${index}`}
        className={styles.answerWrap}
        role="region"
      >
        <p className={styles.answer}>{answer}</p>
      </div>
    </div>
  );
}
