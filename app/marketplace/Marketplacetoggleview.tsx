"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./Marketplacetoggleview.module.css";
import MarketplaceClient from "./Marketplaceclient";
import MarketplaceMap from "./Marketplacemap";
import CategoryFilter from "./CategoryFilter";
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
      {/* CategoryFilter owns the ENTIRE floating filter stack:
          Grid/Map toggle → Exchange/Rental/Want More → category pills.
          This component just passes state down. */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        view={view}
        onSelectView={setView}
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
