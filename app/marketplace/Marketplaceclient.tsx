"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./Marketplace.module.css";
import ProductCard from "./Productcard";
import { Product, Category } from "./page";

interface Props {
  initialProducts: Product[];
  initialHasNext: boolean;
  initialTotal: number;
  categories: Category[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function MarketplaceClient({
  initialProducts,
  initialHasNext,
  initialTotal,
  categories,
}: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [total, setTotal] = useState(initialTotal);
  const loaderRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const fetchProducts = useCallback(
    async (pageNum: number, categoryId: number | null, reset = false) => {
      setLoading(true);
      try {
        let url = `${API_BASE}/products/marketplace/?page=${pageNum}&page_size=12&sort=newest`;
        if (categoryId) url += `&category=${categoryId}`;
        const res = await fetch(url, {
          credentials: "include", // sends cookies cross-origin (browser handles it)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProducts((prev) => (reset ? data.results : [...prev, ...data.results]));
        setHasNext(data.has_next);
        setTotal(data.total ?? data.count ?? 0);
        setPage(pageNum);
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Category change → reset to page 1
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchProducts(1, selectedCategory, true);
  }, [selectedCategory, fetchProducts]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !loading) {
          fetchProducts(page + 1, selectedCategory);
        }
      },
      { threshold: 0.1 }
    );
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasNext, loading, page, selectedCategory, fetchProducts]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerText}>
            <span className={styles.badge}>Marketplace</span>
            <h1 className={styles.heading}>Trade What You Have</h1>
            <p className={styles.subheading}>
              {total} item{total !== 1 ? "s" : ""} available for barter
            </p>
          </div>
        </div>
      </header>

      <section className={styles.filterBar}>
        <div className={styles.filterScroll}>
          <button
            className={`${styles.filterChip} ${selectedCategory === null ? styles.filterChipActive : ""}`}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.filterChip} ${selectedCategory === cat.id ? styles.filterChipActive : ""}`}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.grid}>
        {products.length === 0 && !loading ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📦</span>
            <p>No products found in this category.</p>
          </div>
        ) : (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </section>

      <div ref={loaderRef} className={styles.loaderSentinel}>
        {loading && (
          <div className={styles.spinner}>
            <span /><span /><span />
          </div>
        )}
        {!hasNext && products.length > 0 && !loading && (
          <p className={styles.endMessage}>You've seen everything ✦</p>
        )}
      </div>
    </main>
  );
}