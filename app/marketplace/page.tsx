"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, SlidersHorizontal, X, Package,
  TrendingUp, Layers, RefreshCw, ChevronDown,
  AlertTriangle, ShoppingBag, Sparkles,
} from "lucide-react";
import styles from "@/styles/Marketplace.module.css";
import ProductPreviewCard from "@/components/Productpreviewcard";
import ProductDetailPage from "@/components/ProductDetail/ProductDetail";
import type { PreviewReplaceOption } from "@/components/Productpreviewcard";

/* ─── Types ── */
interface Category { id: number; name: string; }

interface MarketplaceProduct {
  id: number;
  title: string;
  description: string;
  category: number;
  category_name: string;
  status: string;
  created_at: string;
  purchase_year: number;
  icon: string;
  owner_name: string;
  thumbnail: string | null;
  replace_options: {
    id: number;
    replace_type: string;
    title: string;
    description: string;
    category_name: string | null;
    point_value: number | null;
  }[];
}

interface MarketplaceResponse {
  results:   MarketplaceProduct[];
  page:      number;
  page_size: number;
  total:     number;
  has_next:  boolean;
}

type SortOption = "newest" | "oldest";

interface MarketplaceProps {
  onNavigate?: (id: string) => void;
}

/* ─── Constants ── */
const BASE      = process.env.NEXT_PUBLIC_BACKEND_URL
const PAGE_SIZE = 12;

/* ─── API ── */
async function fetchMarketplace(params: {
  page: number; search: string; category: string; sort: SortOption;
}): Promise<MarketplaceResponse> {
  const q = new URLSearchParams({
    page:      String(params.page),
    page_size: String(PAGE_SIZE),
    sort:      params.sort,
  });
  if (params.search)   q.set("search",   params.search);
  if (params.category) q.set("category", params.category);

  const res = await fetch(`${BASE}products/marketplace/?${q}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load marketplace");
  return res.json();
}

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE}products/categories/`, { credentials: "include" });
  if (!res.ok) return [];
  return res.json();
}

/* ─── Skeleton card ── */
function SkeletonCard({ delay }: { delay: number }) {
  return (
    <div className={styles.skelCard} style={{ animationDelay: `${delay}s` }}>
      <div className={styles.skelImg} />
      <div className={styles.skelBody}>
        <div className={`${styles.skelLine} ${styles.skelXs}`} />
        <div className={`${styles.skelLine} ${styles.skelLg}`} />
        <div className={`${styles.skelLine} ${styles.skelMd}`} />
        <div className={styles.skelChips}>
          <div className={styles.skelChip} />
          <div className={styles.skelChip} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════
   MAIN COMPONENT
════════════════════════════ */
export default function Marketplace({ onNavigate }: MarketplaceProps) {
  /* ── State ── */
  const [products, setProducts]       = useState<MarketplaceProduct[]>([]);
  const [page, setPage]               = useState(1);
  const [hasNext, setHasNext]         = useState(false);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);    // initial full load
  const [loadingMore, setLoadingMore] = useState(false);   // infinite scroll load
  const [error, setError]             = useState<string | null>(null);

  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory]       = useState("");
  const [sort, setSort]               = useState<SortOption>("newest");
  const [categories, setCategories]   = useState<Category[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [selectedId, setSelectedId]   = useState<number | null>(null);
  const [wishlist, setWishlist]       = useState<Set<number>>(new Set());

  const toggleWishlist = (id: number) => {
    setWishlist(prev => {
      const nb = new Set(prev);
      nb.has(id) ? nb.delete(id) : nb.add(id);
      return nb;
    });
  };

  /* ── Refs ── */
  const sentinelRef   = useRef<HTMLDivElement>(null);   // bottom sentinel for IntersectionObserver
  const searchTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetching    = useRef(false);

  /* ── Lock scroll when detail open ── */
  useEffect(() => {
    document.body.style.overflow = selectedId !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedId]);

  /* ── Load categories once ── */
  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  /* ── Core fetch ── */
  const load = useCallback(async (opts: {
    pg: number; srch: string; cat: string; srt: SortOption; append: boolean;
  }) => {
    if (isFetching.current) return;
    isFetching.current = true;

    if (opts.append) setLoadingMore(true);
    else             setLoading(true);
    setError(null);

    try {
      const data = await fetchMarketplace({
        page: opts.pg, search: opts.srch, category: opts.cat, sort: opts.srt,
      });
      setProducts(prev => opts.append ? [...prev, ...data.results] : data.results);
      setPage(opts.pg);
      setHasNext(data.has_next);
      setTotal(data.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetching.current = false;
    }
  }, []);

  /* ── Initial + filter change ── */
  useEffect(() => {
    setProducts([]);
    load({ pg: 1, srch: search, cat: category, srt: sort, append: false });
  }, [search, category, sort, load]);

  /* ── IntersectionObserver — infinite scroll ── */
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !loadingMore && !loading) {
          load({ pg: page + 1, srch: search, cat: category, srt: sort, append: true });
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNext, loadingMore, loading, page, search, category, sort, load]);

  /* ── Debounced search ── */
  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(val.trim()), 420);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
  };

  const activeFilters = [
    search   && { key: "search",   label: `"${search}"`,                       clear: clearSearch },
    category && { key: "category", label: categories.find(c => String(c.id) === category)?.name ?? category, clear: () => setCategory("") },
    sort !== "newest" && { key: "sort", label: "Oldest first", clear: () => setSort("newest") },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  /* ── Empty / error skeletons ── */
  const showInitialSkeleton = loading && products.length === 0;

  return (
    <>
      <div className={styles.shell}>

        {/* ══ Hero bar ══ */}
        <div className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={styles.heroIcon}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <h1 className={styles.heroTitle}>Marketplace</h1>
              <p className={styles.heroSub}>
                {total > 0
                  ? <><span className={styles.heroCount}>{total}</span> items available for exchange</>
                  : "Browse items available for exchange"
                }
              </p>
            </div>
          </div>

          {/* Sort pill */}
          <div className={styles.sortWrap}>
            <TrendingUp size={12} />
            <select
              className={styles.sortSelect}
              value={sort}
              onChange={e => setSort(e.target.value as SortOption)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <ChevronDown size={11} className={styles.sortChevron} />
          </div>
        </div>

        {/* ══ Search + filter bar ══ */}
        <div className={styles.toolbar}>
          {/* Search */}
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search products…"
              value={searchInput}
              onChange={e => handleSearchInput(e.target.value)}
            />
            {searchInput && (
              <button className={styles.searchClear} onClick={clearSearch}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            className={`${styles.filterBtn} ${filtersOpen ? styles.filterBtnActive : ""}`}
            onClick={() => setFiltersOpen(v => !v)}
          >
            <SlidersHorizontal size={13} />
            Filters
            {activeFilters.length > 0 && (
              <span className={styles.filterDot}>{activeFilters.length}</span>
            )}
          </button>
        </div>

        {/* ══ Expanded filters ══ */}
        {filtersOpen && (
          <div className={styles.filterPanel}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}><Layers size={11} /> Category</span>
              <div className={styles.filterChips}>
                <button
                  className={`${styles.fChip} ${category === "" ? styles.fChipActive : ""}`}
                  onClick={() => setCategory("")}
                >All</button>
                {categories.map(c => (
                  <button
                    key={c.id}
                    className={`${styles.fChip} ${String(c.id) === category ? styles.fChipActive : ""}`}
                    onClick={() => setCategory(String(c.id))}
                  >{c.name}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ Active filter tags ══ */}
        {activeFilters.length > 0 && (
          <div className={styles.activeTags}>
            {activeFilters.map(f => (
              <span key={f.key} className={styles.activeTag}>
                {f.label}
                <button onClick={f.clear}><X size={9} /></button>
              </span>
            ))}
            <button className={styles.clearAll} onClick={() => {
              clearSearch(); setCategory(""); setSort("newest");
            }}>Clear all</button>
          </div>
        )}

        {/* ══ Error ══ */}
        {error && (
          <div className={styles.errorBox}>
            <AlertTriangle size={36} color="var(--danger)" />
            <p className={styles.errorTitle}>Failed to load</p>
            <p className={styles.errorMsg}>{error}</p>
            <button
              className={styles.retryBtn}
              onClick={() => load({ pg: 1, srch: search, cat: category, srt: sort, append: false })}
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {/* ══ Initial skeleton ══ */}
        {showInitialSkeleton && (
          <div className={styles.grid}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <SkeletonCard key={i} delay={i * 0.04} />
            ))}
          </div>
        )}

        {/* ══ Empty state ══ */}
        {!loading && !error && products.length === 0 && (
          <div className={styles.emptyBox}>
            <div className={styles.emptyIcon}>
              <Package size={44} />
              <Sparkles size={16} className={styles.emptySparkle} />
            </div>
            <p className={styles.emptyTitle}>
              {activeFilters.length > 0 ? "No matches found" : "Nothing here yet"}
            </p>
            <p className={styles.emptySub}>
              {activeFilters.length > 0
                ? "Try adjusting your filters or search term."
                : "Be the first to list a product for exchange!"
              }
            </p>
            {activeFilters.length > 0 && (
              <button className={styles.retryBtn} onClick={() => {
                clearSearch(); setCategory(""); setSort("newest");
              }}>
                <X size={13} /> Clear filters
              </button>
            )}
          </div>
        )}

        {/* ══ Product grid ══ */}
        {products.length > 0 && (
          <div className={styles.grid}>
            {products.map((p, i) => {
              const replaceOpts: PreviewReplaceOption[] = p.replace_options
                .filter(r => r.replace_type === "product" && r.title)
                .map(r => ({ title: r.title }));

              return (
                <div
                  key={p.id}
                  className={styles.cardWrap}
                  style={{ animationDelay: `${(i % PAGE_SIZE) * 0.05}s` }}
                >
                  {/* Owner label above card */}
                  <div className={styles.ownerBar}>
                    <div className={styles.ownerAvatar}>
                      {p.owner_name.charAt(0).toUpperCase()}
                    </div>
                    <span className={styles.ownerName}>{p.owner_name}</span>
                    {p.purchase_year && (
                      <span className={styles.ownerYear}>{p.purchase_year}</span>
                    )}
                  </div>

                  <ProductPreviewCard
                    title={p.title}
                    categoryName={p.category_name}
                    purchaseYear={p.purchase_year}
                    imageUrls={p.thumbnail ? [p.thumbnail] : []}
                    replaceOptions={replaceOpts}
                    status="approved"
                    showBucketBtn
                    onAddToBucket={() => toggleWishlist(p.id)}
                    bucketAdded={wishlist.has(p.id)}
                    onView={() => setSelectedId(p.id)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* ══ Load-more skeleton (appending) ══ */}
        {loadingMore && (
          <div className={styles.grid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} delay={i * 0.06} />
            ))}
          </div>
        )}

        {/* ══ Infinite scroll sentinel ══ */}
        <div ref={sentinelRef} className={styles.sentinel} />

        {/* ══ End of list message ══ */}
        {!hasNext && !loading && products.length > 0 && (
          <div className={styles.endMsg}>
            <span className={styles.endLine} />
            <span className={styles.endText}>You've seen all {total} listings</span>
            <span className={styles.endLine} />
          </div>
        )}

      </div>

      {/* ══ Detail modal ══ */}
      {selectedId !== null && (
        <div className={styles.detailBackdrop} onClick={() => setSelectedId(null)}>
          <div className={styles.detailSheet} onClick={e => e.stopPropagation()}>
            <ProductDetailPage
              productId={selectedId}
              onBack={() => setSelectedId(null)}
              onNavigate={onNavigate ?? (() => {})}
            />
          </div>
        </div>
      )}
    </>
  );
}