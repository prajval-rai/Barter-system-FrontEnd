'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './NavBar.module.css';
import LoginModal from "@/app/login/LoginModal";
import { useAuth } from "@/context/AuthContext";

const NAV_LINKS = [
  { label: 'Home',          href: '#home' },
  { label: 'How it Works',  href: '#how-it-works' },
  { label: 'Why LenDen?', href: '#why-exchange' },
  { label: 'FAQs',          href: '#faqs' },
];

function SwapIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={styles.logoIcon}
    >
      <path
        d="M7 16L3 12M3 12L7 8M3 12H15M17 8L21 12M21 12L17 16M21 12H9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [activeHash, setActiveHash] = useState('#home');
  const [loginOpen,  setLoginOpen]  = useState(false);

  const { user } = useAuth();
  const router = useRouter();

  const handleProtectedAction = () => {
    setMenuOpen(false);
    if (user) {
      router.push("/swap");   // change to your actual protected route
    } else {
      setLoginOpen(true);
    }
  };

  /* Add shadow on scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Track active section via IntersectionObserver */
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.replace('#', ''));
    const observers: IntersectionObserver[] = [];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveHash(`#${id}`); },
        { threshold: 0.4 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  /* Close menu on resize */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 900) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>

        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <SwapIcon />
          Exchange<span className={styles.logoAccent}>it</span>
        </Link>

        {/* Desktop Nav */}
        <nav className={styles.nav} aria-label="Main navigation">
          <ul className={styles.navList}>
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className={`${styles.navLink} ${activeHash === link.href ? styles.active : ''}`}
                  onClick={() => { setActiveHash(link.href); setMenuOpen(false); }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* CTA Button */}
        <div className={styles.actions}>
          <button className={styles.signupBtn} type="button" onClick={handleProtectedAction}>
            Start LenDen
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          type="button"
          onClick={() => setMenuOpen((p) => !p)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          setLoginOpen(false);
          router.push("/swap"); // change to your actual protected route
        }}
      />

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className={styles.mobileMenu} role="navigation" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`${styles.mobileLink} ${activeHash === link.href ? styles.mobileActive : ''}`}
              onClick={() => { setActiveHash(link.href); setMenuOpen(false); }}
            >
              {link.label}
            </a>
          ))}
          <div className={styles.mobileCtas}>
            <button className={styles.signupBtn} type="button" onClick={handleProtectedAction}>
              Start LenDen
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
