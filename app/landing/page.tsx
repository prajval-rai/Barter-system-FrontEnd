"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./Landing.module.css";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const MARQUEE_ITEMS = [
  { emoji: "🎧", label: "Headphones"  },
  { emoji: "📱", label: "Smartphones" },
  { emoji: "📷", label: "Cameras"     },
  { emoji: "💻", label: "Laptops"     },
  { emoji: "🎮", label: "Gaming Gear" },
  { emoji: "📚", label: "Books"       },
  { emoji: "👗", label: "Clothing"    },
  { emoji: "🪑", label: "Furniture"   },
  { emoji: "🎵", label: "Instruments" },
  { emoji: "🛴", label: "Vehicles"    },
  { emoji: "🧸", label: "Toys"        },
  { emoji: "🖼️", label: "Art"         },
];

const HOW_STEPS_WANT = [
  {
    icon: "📍",
    step: "Step 1",
    title: "Items dhundo paas mein",
    desc: "Apne area ke saare swap listings ek jagah dekho — jaise Kothrud, Bandra ya Sector 18. Category se filter karo, ek second mein.",
  },
  {
    icon: "🗺️",
    step: "Step 2",
    title: "Map pe dekho kya hai",
    desc: "Har pin pe item ka naam, swap preference aur distance dikhta hai. Tap karo aur full details lo — owner kya chahta hai bhi.",
  },
  {
    icon: "💬",
    step: "Step 3",
    title: "Directly baat karo, deal pakko",
    desc: "Koi broker nahi. Koi hidden charge nahi. Owner ka contact seedha wahan hai — apni listing se swap propose karo ek tap mein.",
  },
];

const HOW_STEPS_HAVE = [
  {
    icon: "📸",
    step: "Step 1",
    title: "Item list karo 2 min mein",
    desc: "2-3 photos lo, item ka naam likho aur batao kya chahiye tumhe. Bas itna. 2 minute se kam mein listing live ho jaati hai.",
  },
  {
    icon: "🔔",
    step: "Step 2",
    title: "Offers aayenge khud",
    desc: "Jab bhi koi tumhara item dekhe aur swap propose kare, tumhe turant notification milega. Tum decide karo — accept ya ignore.",
  },
  {
    icon: "🤝",
    step: "Step 3",
    title: "Agree karo, handover karo",
    desc: "Chat mein deal pakko, meetup ya shipping arrange karo — aur ho gaya swap! Zero rupees involved, sirf exchange.",
  },
];

const CATEGORIES = [
  { emoji: "📱", name: "Electronics", count: "1,240" },
  { emoji: "📚", name: "Books",       count: "863"   },
  { emoji: "👗", name: "Clothing",    count: "742"   },
  { emoji: "🎮", name: "Gaming",      count: "619"   },
  { emoji: "📷", name: "Cameras",     count: "388"   },
  { emoji: "🪑", name: "Furniture",   count: "511"   },
  { emoji: "🎵", name: "Music",       count: "297"   },
  { emoji: "🛴", name: "Transport",   count: "174"   },
];

const FEATURE_BADGES = [
  "Broker ko bye bolo",
  "Sirf real owners se baat",
  "Apne item ke liye item pao",
  "Nearby swap easily mile",
  "No extra commission",
  "Direct owner contact",
  "Safe aur verified listings",
  "Swap hona ab easy hai",
];

const DELAY_CLASSES = [
  styles.d1, styles.d2, styles.d3,
  styles.d4, styles.d5, styles.d6,
];

// ─── Reveal Hook ─────────────────────────────────────────────────────────────
// Attaches to a CONTAINER. When the container scrolls into view:
//  1. container gets .visible (for its own reveal transition if needed)
//  2. every .revealChild inside it also gets .visible (with CSS stagger delays)
function useRevealContainer(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add(styles.visible);
          el.querySelectorAll(`.${styles.revealChild}`).forEach((child) => {
            (child as HTMLElement).classList.add(styles.visible);
          });
          obs.unobserve(el);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router    = useRouter();
  const { login } = useAuth();

  const [showModal, setShowModal]     = useState(false);
  const [signingIn, setSigningIn]     = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<"want" | "have">("want");
  const [searchVal, setSearchVal]     = useState("");

  const googleBtnRef = useRef<HTMLDivElement>(null);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Every section gets its own container ref
  const statsRef  = useRevealContainer(0.08);
  const marqRef   = useRevealContainer(0.05);
  const catsRef   = useRevealContainer(0.06);
  const howRef    = useRevealContainer(0.06);
  const exchRef   = useRevealContainer(0.08);
  const badgesRef = useRevealContainer(0.06);
  const ctaRef    = useRevealContainer(0.08);
  const footRef   = useRevealContainer(0.06);

  // Modal keyboard / scroll lock
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setShowModal(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showModal]);

  const handleCredentialResponse = async (response: { credential: string }) => {
    setSigningIn(true);
    setGoogleError(null);
    try {
      await login(response.credential);
      setShowModal(false);
      router.replace("/home");
    } catch (err: any) {
      setGoogleError(err.message || "Sign-in nahi hua. Dobara try karo.");
      setSigningIn(false);
    }
  };

  useEffect(() => {
    if (!showModal) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) { setGoogleError("Google Client ID configure nahi hai."); return; }
    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline", size: "large",
          width: googleBtnRef.current.offsetWidth || 340,
          text: "continue_with", shape: "rectangular", logo_alignment: "left",
        });
      }
    };
    const timer = setTimeout(() => {
      if (window.google) { initGoogle(); }
      else {
        const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (script) {
          script.addEventListener("load", initGoogle);
          return () => script.removeEventListener("load", initGoogle);
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [showModal]);

  const openModal = useCallback(() => {
    setGoogleError(null);
    setSigningIn(false);
    setShowModal(true);
  }, []);

  const doubledMarquee = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  const activeSteps    = activeTab === "want" ? HOW_STEPS_WANT : HOW_STEPS_HAVE;

  return (
    <div className={styles.page}>

      {/* ── NAV ── */}
      <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>⇄</div>
          Swapify
        </div>
        <ul className={styles.navLinks}>
          <li><a href="#how">Kaise kaam karta hai</a></li>
          <li><a href="#categories">Browse karo</a></li>
          <li><a href="#cta">About</a></li>
        </ul>
        <div className={styles.navRight}>
          <button className={styles.btnNavLogin} onClick={openModal}>Sign In</button>
          <button className={styles.btnNavSignup} onClick={openModal}>Item List Karo</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroEyebrow}>
          <span className={styles.eyebrowDot} />
          Zero cash. Pure exchange.
        </div>
        <h1 className={styles.heroHeading}>
          <span>Kuch hai paas mein?</span>
          <span><em>Swap kar lo.</em></span>
        </h1>
        <p className={styles.heroSub}>
          Broker nahi. Commission nahi. Bas apna item list karo —
          paas ke logon se seedha swap karo. No money involved, ever.
        </p>
        <div className={styles.heroSearch}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search items e.g. Sony headphones, Canon camera…"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onFocus={openModal}
          />
          <button className={styles.btnSearch} onClick={openModal}>Search</button>
        </div>
        <div className={styles.heroCta}>
          <button className={styles.btnPrimary} onClick={openModal}>
            Paas ke Swaps Dhundo →
          </button>
          <button className={styles.btnGhost} onClick={openModal}>
            Apna Item List Karo
          </button>
        </div>
        <p className={styles.heroHint}>Nearby swaps dhundo, bina tension ke.</p>
      </section>

      {/* ── STATS BAR ── */}
      <div ref={statsRef} className={styles.statsBar}>
        <div className={styles.statsLeft}>
          <div className={`${styles.statItem} ${styles.revealChild} ${styles.d1}`}>
            <span className={styles.statNum}>6,200+</span>
            <span className={styles.statLabel}>Items Listed</span>
          </div>
          <div className={`${styles.statItem} ${styles.revealChild} ${styles.d2}`}>
            <span className={styles.statNum}>3,100+</span>
            <span className={styles.statLabel}>Swaps Complete</span>
          </div>
          <div className={`${styles.statItem} ${styles.revealChild} ${styles.d3}`}>
            <span className={styles.statNum}>₹0</span>
            <span className={styles.statLabel}>Platform Fees</span>
          </div>
        </div>
        <p className={`${styles.statsRight} ${styles.revealChild} ${styles.d4}`}>
          Pura <strong>India</strong> mein log Swapify use kar rahe hain apni cheezein
          exchange karne ke liye. <strong>3,100+ swaps</strong> already ho chuke hain — bina ek rupee ke.
        </p>
      </div>

      {/* ── MARQUEE ── */}
      <div ref={marqRef} className={`${styles.marqueeSection} ${styles.revealChild}`}>
        <div className={styles.marqueeTrack}>
          {doubledMarquee.map((item, i) => (
            <span key={i} className={styles.marqueeItem}>
              <span className={styles.marqueeEmoji}>{item.emoji}</span>
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <section id="categories" className={styles.catsSection}>
        <div ref={catsRef} className={styles.catsSectionInner}>
          <div className={`${styles.catsHead} ${styles.revealChild} ${styles.d1}`}>
            <div>
              <span className={styles.sectionLabel}>Category se browse karo</span>
              <h2 className={styles.sectionHeading}>
                Har cheez ke liye<br /><em>kuch na kuch hai</em>
              </h2>
            </div>
            <button className={styles.btnGhost} onClick={openModal}>Sab dekho →</button>
          </div>

          <div className={styles.catChips}>
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.name}
                className={`${styles.catChip} ${styles.revealChild} ${DELAY_CLASSES[i % DELAY_CLASSES.length]}`}
                onClick={openModal}
              >
                {cat.emoji} {cat.name}
                <span className={styles.chipCount}>{cat.count}</span>
              </button>
            ))}
          </div>

          <button
            className={`${styles.seeMore} ${styles.revealChild} ${styles.d3}`}
            onClick={openModal}
          >
            Aur categories dekho →
          </button>
          <p className={`${styles.catsBadge} ${styles.revealChild} ${styles.d4}`}>
            8+ categories mein items available
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className={styles.howSection}>
        <div ref={howRef} className={styles.howSectionInner}>
          <div className={`${styles.howHeader} ${styles.revealChild} ${styles.d1}`}>
            <span className={styles.sectionLabel}>Kaise kaam karta hai</span>
            <h2 className={styles.sectionHeading}>
              Chahe item lena ho<br /><em>ya dena ho</em>
            </h2>
          </div>

          <div className={`${styles.howToggle} ${styles.revealChild} ${styles.d2}`}>
            <button
              className={`${styles.toggleBtn} ${activeTab === "want" ? styles.toggleActive : ""}`}
              onClick={() => setActiveTab("want")}
            >
              🔍 Mujhe kuch chahiye
            </button>
            <button
              className={`${styles.toggleBtn} ${activeTab === "have" ? styles.toggleActive : ""}`}
              onClick={() => setActiveTab("have")}
            >
              📦 Mere paas kuch hai
            </button>
          </div>

          <div className={styles.howGrid}>
            {activeSteps.map((step, i) => (
              <div
                key={`${activeTab}-${step.step}`}
                className={`${styles.howCard} ${styles.revealChild} ${DELAY_CLASSES[i + 2]}`}
              >
                <div className={styles.howCardIcon}>{step.icon}</div>
                <div className={styles.howStepLabel}>{step.step}</div>
                <h3 className={styles.howCardTitle}>{step.title}</h3>
                <p className={styles.howCardDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE EXCHANGE DEMO ── */}
      <section className={styles.exchangeSection}>
        <div ref={exchRef} className={styles.exchangeInner}>
          <div className={`${styles.exchangeTitle} ${styles.revealChild} ${styles.d1}`}>
            Abhi ek swap ho raha hai 👀
          </div>
          <div className={styles.exchangeDemo}>
            <div className={`${styles.exchangeItem} ${styles.revealChild} ${styles.d2}`}>
              <span className={`${styles.exchangeItemBadge} ${styles.badgeYours}`}>Tumhara</span>
              <span className={styles.exchangeItemEmoji}>🎧</span>
              <span className={styles.exchangeItemName}>Sony WH-1000XM5</span>
              <span className={styles.exchangeItemOwner}>Listed by Ravi, Mumbai</span>
            </div>
            <div className={`${styles.exchangeArrow} ${styles.revealChild} ${styles.d3}`}>
              <div className={styles.arrowDot} />
              <div className={styles.arrowDot} />
              <div className={styles.arrowDot} />
              <span className={styles.exchangeLabel}>swap</span>
            </div>
            <div className={`${styles.exchangeItem} ${styles.revealChild} ${styles.d4}`}>
              <span className={`${styles.exchangeItemBadge} ${styles.badgeTheirs}`}>Unka</span>
              <span className={styles.exchangeItemEmoji}>📷</span>
              <span className={styles.exchangeItemName}>Canon EOS M50</span>
              <span className={styles.exchangeItemOwner}>Offered by Sneha, Pune</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE BADGES ── */}
      <div ref={badgesRef} className={styles.badgesStrip}>
        {FEATURE_BADGES.map((badge, i) => (
          <span
            key={badge}
            className={`${styles.featBadge} ${styles.revealChild} ${DELAY_CLASSES[i % DELAY_CLASSES.length]}`}
          >
            ✓ {badge}
          </span>
        ))}
      </div>

      {/* ── CTA BANNER ── */}
      <section id="cta" ref={ctaRef} className={styles.ctaSection}>
        <div className={styles.ctaInner} />
        <h2 className={`${styles.ctaHeading} ${styles.revealChild} ${styles.d1}`}>
          Aapki next favourite cheez<br /><em>ek swap door hai</em>
        </h2>
        <div className={`${styles.ctaActions} ${styles.revealChild} ${styles.d2}`}>
          <button className={styles.btnCtaPrimary} onClick={openModal}>
            Free Account Banao
          </button>
          <span className={styles.ctaNote}>Credit card nahi. Koi fees nahi. Kabhi bhi nahi.</span>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer ref={footRef} className={styles.footer}>
        <div className={`${styles.footerLogo} ${styles.revealChild} ${styles.d1}`}>Swapify</div>
        <ul className={`${styles.footerLinks} ${styles.revealChild} ${styles.d2}`}>
          <li><a href="#">About</a></li>
          <li><a href="#">Privacy</a></li>
          <li><a href="#">Terms</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
        <span className={`${styles.footerCopy} ${styles.revealChild} ${styles.d3}`}>
          © 2026 Swapify — Built for India 🇮🇳
        </span>
      </footer>

      {/* ── GOOGLE AUTH MODAL ── */}
      {showModal && (
        <div
          className={styles.modalBackdrop}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle}>Swapify pe Welcome!</div>
                <div className={styles.modalSub}>Sign in karo aur swapping shuru karo — free forever.</div>
              </div>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {googleError && (
                <p className={styles.googleError}>⚠ {googleError}</p>
              )}
              {signingIn ? (
                <div className={styles.googleBtnWrap}>
                  <div className={styles.spinner} />
                  <span className={styles.signingInText}>Sign in ho raha hai…</span>
                </div>
              ) : (
                <div className={styles.googleBtnWrap}>
                  <div ref={googleBtnRef} style={{ width: "100%" }} />
                </div>
              )}
              <p className={styles.modalLegal}>
                Continue karne par aap hamare{" "}
                <a href="#">Terms of Service</a> aur <a href="#">Privacy Policy</a> se agree karte ho.
                <br />Hum sirf aapka naam, email aur photo lete hain.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}