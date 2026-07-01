import styles from '../legal/Legal.module.css';

export const metadata = { title: 'Help Center | LenDen' };

export default function HelpCenterPage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <span className={styles.eyebrow}>Support</span>
        <h1 className={styles.title}>Help Center</h1>
        <p className={styles.updated}>Answers to common questions about using LenDen.</p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Getting started</h2>
          <p className={styles.body}>
            Create a listing for an item you no longer need, then browse the marketplace
            for something you&apos;d like in exchange. When you find a match, send a swap
            request from the listing page.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Managing your listings</h2>
          <p className={styles.body}>
            You can edit, pause, or remove a listing anytime from your profile. Once a
            swap is accepted, the listing is automatically marked unavailable to others.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Completing a swap</h2>
          <ul className={styles.list}>
            <li>Agree on a handover method and location through the swap chat.</li>
            <li>Inspect the item before confirming the exchange is complete.</li>
            <li>Rate the other user afterward to help build trust across the platform.</li>
          </ul>
        </section>

        <div className={styles.contactCard}>
          <p className={styles.body} style={{ marginBottom: 0 }}>
            Still stuck? Reach out at{' '}
            <a href="mailto:support@lenden.co.in">support@lenden.co.in</a>
          </p>
        </div>
      </div>
    </main>
  );
}
