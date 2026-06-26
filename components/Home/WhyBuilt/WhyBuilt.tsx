import styles from './WhyBuild.module.css';

const CARDS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M2 12h20" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
    title: 'Borrow Instead of Buy',
    desc: "Need something for a day or a week? Borrow it from someone nearby instead of spending thousands.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V22H4V12" />
        <path d="M22 7H2v5h20V7z" />
        <path d="M12 22V7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    ),
    title: 'Earn From What You Own',
    desc: 'Your idle camera, drill, or tent is money sitting unused. Lend it out and earn while you sleep.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Trust Your Neighbourhood',
    desc: 'Real people, real items, real locality. LenDen connects you with verified neighbours you can trust.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
    title: 'Less Waste, More Planet',
    desc: 'Every borrow is one less product manufactured. Small choices, big impact on the environment.',
  },
];

export default function WhyBuilt() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>

        <div className={styles.heading}>
          <h2 className={styles.title}>
            Why We Built <span className={styles.highlight}>LenDen?</span>
          </h2>
          <p className={styles.body}>
            Most things we buy are used a handful of times, then forgotten.
            Meanwhile, someone nearby needs exactly that thing — right now.
          </p>
          <p className={styles.sub}>
            <span className={styles.subBlue}>We built LenDen</span>{' '}
            <strong className={styles.subBold}>to turn your neighbourhood into a shared inventory.</strong>
          </p>
        </div>

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