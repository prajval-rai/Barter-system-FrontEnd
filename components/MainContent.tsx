"use client";

import { useEffect, useRef } from "react";
import {
  Home, ShoppingBag, ArrowLeftRight, Package, PlusCircle,
  MessageCircle, ClipboardList, Bell, User, Heart, Settings,
  ShieldCheck, Zap, TrendingUp,
} from "lucide-react";
import styles from "@/styles/MainContent.module.css";

const PAGE_META: Record<string, {
  label: string;
  desc: string;
  Icon: React.ElementType;
  accent: "purple" | "pink" | "cyan" | "green";
}> = {
  dashboard:            { label: "Dashboard",         desc: "Your activity at a glance",      Icon: Home,           accent: "purple" },
  marketplace:          { label: "Marketplace",       desc: "Browse & discover trades",       Icon: ShoppingBag,    accent: "pink"   },
  requests:             { label: "Exchange Requests", desc: "Pending & active offers",        Icon: ArrowLeftRight, accent: "cyan"   },
  "my-products":        { label: "My Products",       desc: "Manage your listings",           Icon: Package,        accent: "green"  },
  "add-product":        { label: "Add Product",       desc: "List something new",             Icon: PlusCircle,     accent: "purple" },
  chats:                { label: "Trade Chats",       desc: "Your active conversations",      Icon: MessageCircle,  accent: "cyan"   },
  history:              { label: "Trade History",     desc: "Past exchanges & deals",         Icon: ClipboardList,  accent: "pink"   },
  notifications:        { label: "Notifications",     desc: "What's happening around you",   Icon: Bell,           accent: "pink"   },
  profile:              { label: "My Profile",        desc: "Your public identity",           Icon: User,           accent: "purple" },
  wishlist:             { label: "Wishlist",          desc: "Items you're eyeing",            Icon: Heart,          accent: "pink"   },
  settings:             { label: "Settings",          desc: "Preferences & account",         Icon: Settings,       accent: "cyan"   },
  "manage-marketplace": { label: "Manage",            desc: "Admin marketplace controls",    Icon: ShieldCheck,    accent: "purple" },
};

interface MainContentProps {
  activeId: string;
  children: React.ReactNode;
}

export default function MainContent({ activeId, children }: MainContentProps) {
  const meta = PAGE_META[activeId] ?? {
    label: activeId, desc: "", Icon: Zap, accent: "purple" as const,
  };
  const { Icon } = meta;

  const contentRef = useRef<HTMLDivElement>(null);
  const prevId = useRef(activeId);

  useEffect(() => {
    if (prevId.current !== activeId && contentRef.current) {
      contentRef.current.classList.remove(styles.pageEnter);
      void contentRef.current.offsetWidth;
      contentRef.current.classList.add(styles.pageEnter);
      prevId.current = activeId;
    }
  }, [activeId]);

  return (
    <div className={styles.shell}>

      {/* ── Subtle ambient tints (light mode — very faint) ── */}
      <div className={`${styles.blob} ${styles.blob1}`} />
      <div className={`${styles.blob} ${styles.blob2}`} />

      {/* ══════════════════════════════
          FLOATING TOP NAVBAR
          ══════════════════════════════ */}
      <header className={`${styles.floatingNav} ${styles[`nav_${meta.accent}`]}`}>
        <div className={styles.navInner}>

          {/* Left: icon + page title + desc */}
          <div className={styles.navLeft}>
            <div className={`${styles.navIconBox} ${styles[`iconBox_${meta.accent}`]}`}>
              <Icon size={16} strokeWidth={2} />
            </div>
            <div className={styles.navText}>
              <span className={styles.navTitle}>{meta.label}</span>
              <span className={styles.navDesc}>{meta.desc}</span>
            </div>
          </div>

          {/* Right: breadcrumb + live chip */}
          <div className={styles.navRight}>
            <div className={styles.breadcrumb}>
              <span className={styles.breadHome}>LenDen</span>
              <span className={styles.breadSep}>/</span>
              <span className={styles.breadCurrent}>{meta.label}</span>
            </div>
            <div className={styles.liveChip}>
              <span className={styles.livePulse} />
              live
            </div>
          </div>

        </div>
        {/* thin accent underline */}
        <div className={`${styles.navUnderline} ${styles[`underline_${meta.accent}`]}`} />
      </header>

      {/* ══════════════════════════════
          SCROLLABLE CONTENT AREA
          ══════════════════════════════ */}
      <div
        className={[
          styles.contentScroll,
          styles.pageEnter,
          activeId === "add-product" ? styles.contentScrollLocked : "",
        ].join(" ")}
        ref={contentRef}
      >
        <div className={styles.contentCenter}>
          {children}
        </div>
      </div>

    </div>
  );
}