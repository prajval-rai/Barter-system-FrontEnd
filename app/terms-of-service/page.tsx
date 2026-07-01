import styles from '../legal/Legal.module.css';

export const metadata = { title: 'Terms of Service | LenDen' };

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <span className={styles.eyebrow}>Legal</span>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.updated}>Last updated: July 2026</p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Using LenDen</h2>
          <p className={styles.body}>
            LenDen is a platform that connects users who want to exchange or rent
            personal items. You must be at least 18 years old, or have guardian consent,
            to create an account and list items.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Listings and exchanges</h2>
          <p className={styles.body}>
            You&apos;re responsible for the accuracy of your listings and for honoring
            swap agreements you accept. LenDen facilitates connections between users but
            is not a party to any exchange and does not guarantee item condition or
            outcomes.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Prohibited items and conduct</h2>
          <p className={styles.body}>
            Listing illegal, stolen, counterfeit, or unsafe items is not permitted.
            Harassment, fraud, or misrepresentation of items may result in account
            suspension.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Account termination</h2>
          <p className={styles.body}>
            We may suspend or remove accounts that violate these terms, at our
            discretion, to protect the safety of the community.
          </p>
        </section>

        <div className={styles.contactCard}>
          <p className={styles.body} style={{ marginBottom: 0 }}>
            Questions about these terms? Contact{' '}
            <a href="mailto:legal@lenden.co.in">legal@lenden.co.in</a>
          </p>
        </div>
      </div>
    </main>
  );
}
