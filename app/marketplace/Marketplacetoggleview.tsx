"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./Marketplacetoggleview.module.css";
import MarketplaceClient from "./Marketplaceclient";
import MarketplaceMap from "./Marketplacemap";
import CategoryFilter from "@/components/Categoryfilter/Categoryfilter";
import { toSlug } from "./slug";
import { Product, Category } from "./page";

interface Props {
  initialProducts: Product[];
  initialHasNext: boolean;
  initialTotal: number;
  categories: Category[];
  initialCategory: number | null;
  initialView: "grid" | "map";
}

type View = "grid" | "map";
type ListingType = "exchange" | "rental" | "want";

const LISTING_TYPES: { id: ListingType; label: string; comingSoon: boolean }[] = [
  { id: "exchange", label: "Exchange", comingSoon: false },
  { id: "rental", label: "Rental", comingSoon: true },
  { id: "want", label: "Want More", comingSoon: true },
];

export default function MarketplaceToggleView({
  initialProducts,
  initialHasNext,
  initialTotal,
  categories,
  initialCategory,
  initialView,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const view: View = (searchParams.get("view") as View) ?? initialView;
  const selectedCategory = initialCategory;
  const listingType: ListingType = "exchange";

  const setView = useCallback(
    (v: View) => {
      const base = selectedCategory
        ? `/marketplace/${toSlug(categories.find((c) => c.id === selectedCategory)?.name ?? "")}`
        : "/marketplace";
      router.push(`${base}?view=${v}`, { scroll: false });
    },
    [router, selectedCategory, categories]
  );

  const setSelectedCategory = useCallback(
    (categoryId: number | null) => {
      const path = categoryId
        ? `/marketplace/${toSlug(categories.find((c) => c.id === categoryId)?.name ?? "")}`
        : "/marketplace";
      router.push(`${path}?view=${view}`, { scroll: false });
    },
    [router, categories, view]
  );

  return (
    <div className={styles.wrapper}>
      {/* Row 1: Exchange/Rental/Want + Grid/Map toggle */}
      <div className={styles.filterRow}>
        <div className={styles.typeTrack}>
          {LISTING_TYPES.map((t) =>
            t.comingSoon ? (
              <div
                key={t.id}
                className={`${styles.typeBtn} ${styles.typeBtnDisabled}`}
                title={`${t.label} — Coming soon`}
              >
                <span>{t.label}</span>
                <span className={styles.typeSoonPill}>Soon</span>
              </div>
            ) : (
              <button
                key={t.id}
                className={`${styles.typeBtn} ${listingType === t.id ? styles.typeBtnActive : ""}`}
                aria-pressed={listingType === t.id}
              >
                <span>{t.label}</span>
              </button>
            )
          )}
        </div>

        <div className={styles.toggleTrack}>
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

      {/* Row 2: Category filter — own component, own styling */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <div className={styles.viewWrap}>
        <div className={view === "grid" ? styles.viewVisible : styles.viewHidden}>
          <MarketplaceClient
            initialProducts={initialProducts}
            initialHasNext={initialHasNext}
            initialTotal={initialTotal}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        <div className={view === "map" ? styles.viewVisible : styles.viewHidden}>
          <MarketplaceMap
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      </div>
    </div>
  );
}

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
