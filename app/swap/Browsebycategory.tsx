// components/home/BrowseByCategory.tsx
"use client"
import React from "react";
import { useRouter } from "next/navigation";
import styles from "./Browsebycategory.module.css";

export interface Category {
  label: string;
  emoji: string;
  slug: string;
}

interface BrowseByCategoryProps {
  categories?: Category[];
  activeSlug?: string;
  onSelect?: (slug: string) => void;
}

const DEFAULT_CATEGORIES: Category[] = [
  { label: "Electronics", emoji: "💻", slug: "electronics" },
  { label: "Books",       emoji: "📚", slug: "books" },
  { label: "Fashion",     emoji: "👗", slug: "fashion" },
  { label: "Sports",      emoji: "⚽", slug: "sports" },
  { label: "Furniture",   emoji: "🛋️", slug: "furniture" },
  { label: "Gaming",      emoji: "🎮", slug: "gaming" },
  { label: "Cameras",     emoji: "📷", slug: "cameras" },
];

export default function BrowseByCategory({
  categories = DEFAULT_CATEGORIES,
  activeSlug,
  onSelect,
}: BrowseByCategoryProps) {
  const router = useRouter();

  const handleSelect = (slug: string) => {
    if (onSelect) {
      onSelect(slug);
    } else {
      router.push(`/browse?category=${slug}`);
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Browse by category</h2>
      <div className={styles.chipRow}>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => handleSelect(cat.slug)}
            className={`${styles.chip} ${activeSlug === cat.slug ? styles.chipActive : ""}`}
          >
            <span className={styles.chipEmoji}>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>
    </section>
  );
}