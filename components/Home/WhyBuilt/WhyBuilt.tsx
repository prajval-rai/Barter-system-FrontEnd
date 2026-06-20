import styles from './WhyBuild.module.css';

const CARDS = [
  {
    icon: (
      /* Swap arrows — "Every Item Has Value" */
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3l4 4-4 4" />
        <path d="M20 7H4" />
        <path d="M8 21l-4-4 4-4" />
        <path d="M4 17h16" />
      </svg>
    ),
    title: 'Every Item Has Value',
    desc: "Every product you own has value for someone else. Don't let it go to waste.",
  },
  {
    icon: (
      /* Dollar coin — "Money Isn't Always Needed" */
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v1m0 8v1" />
        <path d="M9.5 9.5A2.5 2.5 0 0 1 12 8a2.5 2.5 0 0 1 0 5 2.5 2.5 0 0 0 0 5 2.5 2.5 0 0 0 2.5-1.5" />
      </svg>
    ),
    title: "Money Isn't Always Needed",
    desc: 'Why spend money when you can exchange smartly and get what you truly need?',
  },
  {
    icon: (
      /* People / community — "Build a Sharing Community" */
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Build a Sharing Community',
    desc: 'We connect real people who want to exchange, save and help each other.',
  },
  {
    icon: (
      /* Leaf — "Better for You, Better for Earth" */
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
    title: 'Better for You, Better for Earth',
    desc: 'Reduce waste, reuse more, and build a sustainable future together.',
  },
];

export default function WhyBuilt() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>

        {/* Heading */}
        <div className={styles.heading}>
          <h2 className={styles.title}>
            Why We Built <span className={styles.highlight}>LenDen?</span>
          </h2>
          <p className={styles.body}>
            In today&apos;s world, we buy more than we need and use less than we buy.
            Meanwhile, many people struggle to afford even basic things.
          </p>
          <p className={styles.sub}>
            <span className={styles.subBlue}>We built LenDen</span>{' '}
            <strong className={styles.subBold}>to create a better way.</strong>
          </p>
        </div>

        {/* Cards */}
        <div className={styles.grid}>
          {CARDS.map((card) => (
            <div key={card.title} className={styles.card}>
              <div className={styles.iconWrap}>{card.icon}</div>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDesc}>{card.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}