import React from 'react';
import styles from './HowItWorks.module.css';

const STEPS = [
  {
    number: '01',
    title: 'List your item',
    desc: "Snap a photo of what you don't need every day.",
  },
  {
    number: '02',
    title: 'Find a match',
    desc: 'We surface people nearby looking for exactly that.',
  },
  {
    number: '03',
    title: 'Connect & chat',
    desc: 'Work out the details and confirm the exchange.',
  },
  {
    number: '04',
    title: 'Hand it over',
    desc: 'Meet up, exchange, and get back what you actually needed.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>The exchange path</span>
          <h2 className={styles.title}>From your shelf to theirs.</h2>
        </div>

        <div className={styles.rail} role="list">
          {STEPS.map((step) => (
            <div className={styles.stop} role="listitem" key={step.number}>
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