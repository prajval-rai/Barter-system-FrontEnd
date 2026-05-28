import Link from "next/link";
import styles from "./Emptywelcomehero.module.css";
import wellcomeImg from "../../../public/Image/NewUser/swap/wellcomeBanner.png";

export default function EmptyWelcomeHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>

        {/* Left — Text */}
        <div className={styles.left}>
          <h1 className={styles.heading}>
            Welcome to <span className={styles.brand}>ExchangeIt!</span> 🎉
          </h1>
          <p className={styles.sub}>
            Exchange what you have.<br />
            Get what you need — without spending money.
          </p>

          <Link href="/add" className={styles.ctaBtn}>
            <PlusIcon />
            Add Your First Item
          </Link>

          <p className={styles.trust}>
            <LockIcon />
            Safe, secure &amp; trusted by thousands
          </p>
        </div>

        {/* Right — Image */}
        <div className={styles.right}>
          <img
            src={wellcomeImg.src}
            alt="Exchange illustration"
            className={styles.illustration}
          />
        </div>

      </div>
    </section>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
