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
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
}

export default function MarketplaceClient({
  initialProducts,
  initialHasNext,
  initialTotal,
  categories,
  selectedCategory,
  onSelectCategory,
}: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts ?? []);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(initialTotal);

  const loaderRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const lastFetchedCategory = useRef(selectedCategory);

  const fetchProducts = useCallback(
    async (pageNum: number, categoryId: number | null, reset = false) => {
      setLoading(true);
      setError(null);
      try {
        let url = `/api/marketplace?page=${pageNum}&page_size=12&sort=newest`;
        if (categoryId !== null && categoryId !== undefined) {
          url += `&category=${categoryId}`;
        }

        const res = await fetch(url);
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const results: Product[] = Array.isArray(data.results) ? data.results : [];

        setProducts((prev) => (reset ? results : [...prev, ...results]));
        setHasNext(Boolean(data.has_next));
        setTotal(data.total ?? data.count ?? 0);
        setPage(pageNum);
      } catch (err) {
        console.error("Failed to fetch products", err);
        setError("Couldn't load products. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (selectedCategory === lastFetchedCategory.current) return;
    lastFetchedCategory.current = selectedCategory;
    fetchProducts(1, selectedCategory, true);
  }, [selectedCategory, fetchProducts]);

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
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasNext, loading, page, selectedCategory, fetchProducts]);

  return (
    <main className={styles.page}>
      {error && (
        <div className={styles.errorBanner}>
          <span>{error}</span>
          <button onClick={() => fetchProducts(1, selectedCategory, true)}>
            Retry
          </button>
        </div>
      )}

      <section className={styles.grid}>
        {products.length === 0 && !loading ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📦</span>
            <p>No products found in this category.</p>
          </div>
        ) : (
          products.map((product) => {
            if (!product || product.id == null) return null;
            return <ProductCard key={product.id} product={product} />;
          })
        )}
      </section>

      <div ref={loaderRef} className={styles.loaderSentinel}>
        {loading && (
          <div className={styles.spinner}>
            <span />
            <span />
            <span />
          </div>
        )}
        {!hasNext && products.length > 0 && !loading && (
          <p className={styles.endMessage}>You've seen everything ✦</p>
        )}
      </div>
    </main>
  );
}
