import styles from './CTA.module.css';

export default function CTA() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.box}>

          {/* Left: copy */}
          <div className={styles.copy}>
            <h2 className={styles.title}>Ready to Exchange Smarter?</h2>
            <p className={styles.desc}>
              Join thousands of people who are swapping smartly and living better every day.
            </p>
            <button className={styles.ctaBtn}>
              Get Started Now &nbsp;→
            </button>
          </div>

          {/* Right: illustration */}
          <div className={styles.illustration} aria-hidden="true">
            {/* Dashed orbit ring */}
            <svg className={styles.orbit} viewBox="0 0 260 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="130" cy="90" rx="110" ry="70" stroke="#1A56DB" strokeWidth="1.5" strokeDasharray="6 5" opacity="0.35"/>
              {/* small x marks */}
              <text x="18" y="55"  fontSize="12" fill="#1A56DB" opacity="0.4">✕</text>
              <text x="228" y="135" fontSize="12" fill="#1A56DB" opacity="0.4">✕</text>
            </svg>
            {/* Box emoji rendered large */}
            <div className={styles.boxEmoji}>📦</div>
          </div>

        </div>
      </div>
    </section>
  );
}