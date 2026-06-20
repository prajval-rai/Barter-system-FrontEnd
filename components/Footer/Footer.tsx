import Link from 'next/link';
import styles from './Footer.module.css';

const QUICK_LINKS = ['Home', 'How it Works', 'Categories', 'Why LenDen?'];
const SUPPORT_LINKS = ['Help Center', 'Safety Tips', 'Terms of Service', 'Privacy Policy'];

const SOCIAL = [
  {
    label: 'Facebook',
    href: '#',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: '#',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    label: 'Twitter',
    href: '#',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: '#',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.inner}>
          {/* Brand */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round">
                <path d="M7 16L3 12M3 12L7 8M3 12H15M17 8L21 12M21 12L17 16M21 12H9"/>
              </svg>
              LenDen
            </Link>
            <p className={styles.tagline}>Exchange what you have. Get what you need.</p>
          </div>

          {/* Quick Links */}
          <div>
            <div className={styles.colTitle}>Quick Links</div>
            <ul className={styles.colLinks}>
              {QUICK_LINKS.map((link) => (
                <li key={link}><a href="#">{link}</a></li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <div className={styles.colTitle}>Support</div>
            <ul className={styles.colLinks}>
              {SUPPORT_LINKS.map((link) => (
                <li key={link}><a href="#">{link}</a></li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <div className={styles.colTitle}>Connect</div>
            <div className={styles.socialRow}>
              {SOCIAL.map((s) => (
                <a key={s.label} href={s.href} className={styles.socialIcon} aria-label={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © 2024 <span>LenDen</span>. All rights reserved.
          </p>
          <p className={styles.madeWith}>Made with ❤️ for a better tomorrow.</p>
        </div>
      </div>
    </footer>
  );
}