import styles from '../legal/Legal.module.css';

export const metadata = { title: 'Safety Tips | LenDen' };

export default function SafetyTipsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <span className={styles.eyebrow}>Support</span>
        <h1 className={styles.title}>Safety Tips</h1>
        <p className={styles.updated}>Guidelines to keep every exchange safe.</p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Before you meet</h2>
          <ul className={styles.list}>
            <li>Check the other user&apos;s profile and past exchange ratings.</li>
            <li>Keep all communication inside LenDen&apos;s chat until the swap is confirmed.</li>
            <li>Ask clear questions about item condition before agreeing to a swap.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>During the handover</h2>
          <ul className={styles.list}>
            <li>Meet in a public, well-lit location — a mall, cafe, or community center works well.</li>
            <li>Bring a friend along for higher-value exchanges if possible.</li>
            <li>Inspect the item in person before finalizing the swap.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Red flags to watch for</h2>
          <ul className={styles.list}>
            <li>Pressure to move the conversation off-platform immediately.</li>
            <li>Requests for advance payment before a swap is agreed.</li>
            <li>Listings with vague descriptions or reused stock photos.</li>
          </ul>
        </section>

        <div className={styles.contactCard}>
          <p className={styles.body} style={{ marginBottom: 0 }}>
            See something suspicious? Report it to{' '}
            <a href="mailto:safety@lenden.co.in">safety@lenden.co.in</a>
          </p>
        </div>
      </div>
    </main>
  );
}
