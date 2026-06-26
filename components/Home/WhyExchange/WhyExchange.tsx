import styles from './WhyExchange.module.css';

const BUYING = [
  'Spend money every time',
  'Unused items go to waste',
  'Contributes to more production',
  'Higher cost, more burden',
];
const EXCHANGING = [
  'Save money, get what you need',
  "Give value to what you don't use",
  'Reduces waste & protects Earth',
  'Smart, sustainable & community driven',
];

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M8 2L2 8M2 2l6 6" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <polyline points="1.5 5 4 7.5 8.5 2.5" />
  </svg>
);

export default function WhyExchange() {
  return (
    <section className={styles.section} id="why-exchange">
      <div className={styles.inner}>

        <div className={styles.header}>
          <span className={styles.eyebrow}>buying vs exchanging</span>
          <h2 className={styles.title}>why lenden beats buying</h2>
        </div>

        <div className={styles.grid}>

          {/* ── Left: Buying ── */}
          <div className={`${styles.card} ${styles.cardBuying}`}>
            <span className={`${styles.tag} ${styles.tagBad}`}>the old way</span>
            <h3 className={styles.cardTitle}>buying it</h3>
            <div className={styles.list}>
              {BUYING.map((text) => (
                <div key={text} className={styles.item}>
                  <span className={`${styles.itemIcon} ${styles.iconBad}`}>
                    <XIcon />
                  </span>
                  <span className={styles.itemText}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── VS ── */}
          <div className={styles.vsCircle}>VS</div>

          {/* ── Right: LenDen ── */}
          <div className={`${styles.card} ${styles.cardLenden}`}>
            <span className={`${styles.tag} ${styles.tagGood}`}>the lenden way</span>
            <h3 className={styles.cardTitle}>exchanging it</h3>
            <div className={styles.list}>
              {EXCHANGING.map((text) => (
                <div key={text} className={styles.item}>
                  <span className={`${styles.itemIcon} ${styles.iconGood}`}>
                    <CheckIcon />
                  </span>
                  <span className={styles.itemText}>{text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}