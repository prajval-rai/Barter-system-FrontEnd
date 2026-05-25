"use client";

import { useState } from "react";
import styles from "./Marketplacetoggleview.module.css";
import MarketplaceClient from "./Marketplaceclient";
import MarketplaceMap from "./Marketplacemap";
import { Product, Category } from "./page";

interface Props {
  initialProducts: Product[];
  initialHasNext: boolean;
  initialTotal: number;
  categories: Category[];
}

type View = "grid" | "map";

export default function MarketplaceToggleView({
  initialProducts,
  initialHasNext,
  initialTotal,
  categories,
}: Props) {
  // ✅ FIX 1: Default view is now "map" as requested
  const [view, setView] = useState<View>("map");

  return (
    <div className={styles.wrapper}>
      {/* ── Toggle Bar ── */}
      <div className={styles.toggleBar}>
        <div className={styles.toggleTrack}>
          {/* sliding pill */}
          <span
            className={styles.pill}
            style={{ transform: view === "map" ? "translateX(100%)" : "translateX(0)" }}
          />

          <button
            className={`${styles.toggleBtn} ${view === "grid" ? styles.toggleBtnActive : ""}`}
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
          >
            <GridIcon />
            <span>Grid</span>
          </button>

          <button
            className={`${styles.toggleBtn} ${view === "map" ? styles.toggleBtnActive : ""}`}
            onClick={() => setView("map")}
            aria-pressed={view === "map"}
          >
            <MapIcon />
            <span>Map</span>
          </button>
        </div>
      </div>

      {/* ── Views ── */}
      {/*
        ✅ FIX 2: Both views are ALWAYS mounted (no conditional rendering).
        We toggle CSS visibility so:
          - Grid state (scroll position, loaded pages) is never lost on toggle
          - Map Leaflet instance is never destroyed & re-created on toggle
            (which was causing double-init flickers and lost marker state)
      */}
      <div className={styles.viewWrap}>
        <div className={view === "grid" ? styles.viewVisible : styles.viewHidden}>
          <MarketplaceClient
            initialProducts={initialProducts}
            initialHasNext={initialHasNext}
            initialTotal={initialTotal}
            categories={categories}
          />
        </div>

        {/* Map is always mounted once the component loads */}
        <div className={view === "map" ? styles.viewVisible : styles.viewHidden}>
          <MarketplaceMap categories={categories} />
        </div>
      </div>
    </div>
  );
}

/* ── Inline SVG icons ─────────────────────────────────────────────────────── */

function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path
        d="M7.5 1C5.015 1 3 3.015 3 5.5c0 3.5 4.5 8.5 4.5 8.5S12 9 12 5.5C12 3.015 9.985 1 7.5 1Z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"
      />
      <circle cx="7.5" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}