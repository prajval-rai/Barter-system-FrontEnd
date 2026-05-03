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
  <svg width="11" height="11" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M8 2L2 8M2 2l6 6"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <polyline points="1.5 5 4 7.5 8.5 2.5"/>
  </svg>
);

export default function WhyExchange() {
  return (
    <section className={styles.section} id="why-exchange">
      <div className={styles.inner}>
        <div className={styles.comparisonBox}>

          <h2 className={styles.comparisonTitle}>Why Exchange is Better Than Buy?</h2>

          <div className={styles.grid}>
            {/* ── Left: Buying ── */}
            <div className={styles.column}>
              <div className={styles.columnTitle}>Buying (Traditional Way)</div>
              {BUYING.map((text) => (
                <div key={text} className={styles.item}>
                  <div className={`${styles.itemIcon} ${styles.iconBad}`}>
                    <XIcon />
                  </div>
                  <span className={styles.itemText}>{text}</span>
                </div>
              ))}
            </div>

            {/* ── VS ── */}
            <div className={styles.vsCircle}>VS</div>

            {/* ── Right: Exchanging ── */}
            <div className={styles.column}>
              <div className={styles.columnTitle}>Exchanging (Smart Way)</div>
              {EXCHANGING.map((text) => (
                <div key={text} className={styles.item}>
                  <div className={`${styles.itemIcon} ${styles.iconGood}`}>
                    <CheckIcon />
                  </div>
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