import styles from '../legal/Legal.module.css';

export const metadata = { title: 'Privacy Policy | LenDen' };

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <span className={styles.eyebrow}>Legal</span>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: July 2026</p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Information we collect</h2>
          <p className={styles.body}>
            We collect the information you provide when creating an account (name,
            email, contact number) and the listings, messages, and ratings you create
            while using LenDen.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How we use your information</h2>
          <ul className={styles.list}>
            <li>To operate core features like listings, swap requests, and messaging.</li>
            <li>To send account verification, security, and swap-related notifications.</li>
            <li>To maintain trust and safety across the platform.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What we don&apos;t do</h2>
          <p className={styles.body}>
            We don&apos;t sell your personal data to third parties. We don&apos;t send
            marketing emails without your consent.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Your choices</h2>
          <p className={styles.body}>
            You can update or delete your account information anytime from your profile
            settings, or by contacting us directly.
          </p>
        </section>

        <div className={styles.contactCard}>
          <p className={styles.body} style={{ marginBottom: 0 }}>
            Privacy questions? Reach us at{' '}
            <a href="mailto:privacy@lenden.co.in">privacy@lenden.co.in</a>
          </p>
        </div>
      </div>
    </main>
  );
}
