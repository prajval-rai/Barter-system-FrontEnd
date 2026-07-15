"use client";

import { useState } from "react";
import styles from "./Categoryfilter.module.css";
import { Category } from "../../app/marketplace/page";
import {
  LayoutGrid,
  Shirt,
  Package,
  BookOpen,
  Cpu,
  Armchair,
  Gamepad2,
  X,
  Check,
  SlidersHorizontal,
  Map as MapIcon,
  Grid3x3,
} from "lucide-react";

type View = "grid" | "map";
type ListingType = "exchange" | "rental" | "want";

interface Props {
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
  view: View;
  onSelectView: (v: View) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  Cloth: Shirt,
  Books: BookOpen,
  Electronics: Cpu,
  Furniture: Armchair,
  Toys: Gamepad2,
};

const getIcon = (name: string) => CATEGORY_ICONS[name] || Package;
const QUICK_LIMIT = 9;

const LISTING_TYPES: { id: ListingType; label: string; comingSoon: boolean }[] = [
  { id: "exchange", label: "Exchange", comingSoon: false },
  { id: "rental", label: "Rental", comingSoon: true },
  { id: "want", label: "Want More", comingSoon: true },
];

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  view,
  onSelectView,
}: Props) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);

  const listingType: ListingType = "exchange"; // only functional type for now

  const quickCategories = categories.slice(0, QUICK_LIMIT);
  const hasMore = categories.length > quickCategories.length;
  const activeCategoryName =
    categories.find((c) => c.id === selectedCategory)?.name ?? "All";

  const handleSelect = (id: number | null) => {
    onSelectCategory(id);
    setIsDrawerOpen(false);
    setShowAllModal(false);
  };

  const renderPill = (id: number | null, name: string, Icon: any) => {
    const isActive = selectedCategory === id;
    return (
      <button
        key={id ?? "all"}
        type="button"
        className={`${styles.pill} ${isActive ? styles.pillActive : ""}`}
        onClick={() => handleSelect(id)}
      >
        <Icon size={14} strokeWidth={2.25} />
        {name}
      </button>
    );
  };

  const renderTile = (id: number | null, name: string, Icon: any) => {
    const isActive = selectedCategory === id;
    return (
      <button
        key={id ?? "all"}
        type="button"
        className={`${styles.tile} ${isActive ? styles.tileActive : ""}`}
        onClick={() => handleSelect(id)}
      >
        <span className={styles.tileIconWrap}>
          <Icon size={20} strokeWidth={2} />
        </span>
        <span className={styles.tileName}>{name}</span>
        {isActive && (
          <span className={styles.tileCheck}>
            <Check size={11} strokeWidth={3} />
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      <div className={styles.floatingFilters}>
        {/* Row 1: Grid / Map toggle */}
        <div className={styles.filterRowTop}>
          <div className={styles.viewToggleTrack}>
            <span
              className={styles.viewToggleSlide}
              style={{ transform: view === "map" ? "translateX(100%)" : "translateX(0)" }}
            />
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${view === "grid" ? styles.viewToggleBtnActive : ""}`}
              onClick={() => onSelectView("grid")}
              aria-pressed={view === "grid"}
            >
              <Grid3x3 size={14} strokeWidth={2.25} />
              <span>Grid</span>
            </button>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${view === "map" ? styles.viewToggleBtnActive : ""}`}
              onClick={() => onSelectView("map")}
              aria-pressed={view === "map"}
            >
              <MapIcon size={14} strokeWidth={2.25} />
              <span>Map</span>
            </button>
          </div>
        </div>

        {/* Row 2: Exchange / Rental / Want More */}
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
                type="button"
                className={`${styles.typeBtn} ${listingType === t.id ? styles.typeBtnActive : ""}`}
                aria-pressed={listingType === t.id}
              >
                <span>{t.label}</span>
              </button>
            )
          )}
        </div>

        {/* Row 3: Mobile trigger pill (opens drawer) */}
        <div className={styles.mobileTriggerBar}>
          <button
            type="button"
            className={styles.filterTrigger}
            onClick={() => setIsDrawerOpen(true)}
          >
            <SlidersHorizontal size={14} strokeWidth={2.25} />
            {activeCategoryName}
            <span className={styles.triggerDot} />
          </button>
        </div>

        {/* Row 3 (desktop): full horizontal category bar */}
        <div className={styles.desktopBar}>
          <div className={styles.scrollRow}>
            {renderPill(null, "All", LayoutGrid)}
            {categories.map((cat) => renderPill(cat.id, cat.name, getIcon(cat.name)))}
          </div>
        </div>
      </div>

      {/* Mobile: bottom drawer with top 9 categories */}
      {isDrawerOpen && (
        <div className={styles.overlay} onClick={() => setIsDrawerOpen(false)}>
          <div
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Filter by category"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.handle} />

            <div className={styles.drawerGrid}>
              {renderTile(null, "All", LayoutGrid)}
              {quickCategories.map((cat) => renderTile(cat.id, cat.name, getIcon(cat.name)))}
            </div>

            {hasMore && (
              <button
                type="button"
                className={styles.moreBtn}
                onClick={() => {
                  setIsDrawerOpen(false);
                  setShowAllModal(true);
                }}
              >
                More categories
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile: full modal with every category */}
      {showAllModal && (
        <div className={styles.fullOverlay} onClick={() => setShowAllModal(false)}>
          <div
            className={styles.fullSheet}
            role="dialog"
            aria-modal="true"
            aria-label="All categories"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setShowAllModal(false)}
              aria-label="Close"
            >
              <X size={18} strokeWidth={2.25} />
            </button>

            <div className={styles.fullGrid}>
              {renderTile(null, "All", LayoutGrid)}
              {categories.map((cat) => renderTile(cat.id, cat.name, getIcon(cat.name)))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
