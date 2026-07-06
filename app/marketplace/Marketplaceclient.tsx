"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./Marketplace.module.css";
import ProductCard from "./Productcard";
import CategoryFilter from "../../components/Categoryfilter/Categoryfilter";
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
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(initialTotal);
  const loaderRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const lastFetchedCategory = useRef(selectedCategory);

  const fetchProducts = useCallback(
    async (pageNum: number, categoryId: number | null, reset = false) => {
      setLoading(true);
      try {
        let url = `/api/marketplace?page=${pageNum}&page_size=12&sort=newest`;
        if (categoryId) url += `&category=${categoryId}`;

        const res = await fetch(url);
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
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

  // Category changed via URL → refetch, unless it's the same category
  // the server already fetched for us on initial load
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (selectedCategory === lastFetchedCategory.current) return;
    lastFetchedCategory.current = selectedCategory;
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
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
      />

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