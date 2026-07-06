// components/home/BrowseByCategory.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Browsebycategory.module.css";

export interface Category {
  id: number;
  name: string;
}

interface BrowseByCategoryProps {
  activeSlug?: string;
  onSelect?: (slug: string) => void;
}

const EMOJI_MAP: Record<string, string> = {
  electronics: "💻",
  books: "📚",
  fashion: "👗",
  sports: "⚽",
  furniture: "🛋️",
  gaming: "🎮",
  cameras: "📷",
  vehicles: "🚗",
  toys: "🧸",
  music: "🎵",
  tools: "🛠️",
  kitchen: "🍳",
  outdoor: "🏕️",
};

function toSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function getEmoji(name: string): string {
  return EMOJI_MAP[toSlug(name)] ?? "🏷️";
}

export default function BrowseByCategory({ activeSlug, onSelect }: BrowseByCategoryProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setCategories(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelect = (slug: string) => {
    if (onSelect) {
      onSelect(slug);
    } else {
      router.push(`/marketplace/${slug}`);
    }
  };

  const handleSeeAll = () => {
    router.push("/marketplace");
  };

  return (
    <section className={styles.section}>
      <div className={styles.headingRow}>
        <h2 className={styles.heading}>Browse by category</h2>
        <button className={styles.seeAllBtn} onClick={handleSeeAll}>
          See all
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className={styles.chipRow}>
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.chipSkeleton} />
          ))}

        {!loading && error && (
          <p className={styles.errorText}>Couldn't load categories.</p>
        )}

        {!loading &&
          !error &&
          categories.map((cat) => {
            const slug = toSlug(cat.name);
            return (
              <button
                key={cat.id}
                onClick={() => handleSelect(slug)}
                className={`${styles.chip} ${activeSlug === slug ? styles.chipActive : ""}`}
              >
                <span className={styles.chipEmoji}>{getEmoji(cat.name)}</span>
                {cat.name}
              </button>
            );
          })}
      </div>
    </section>
  );
}