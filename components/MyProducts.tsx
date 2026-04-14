"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  RefreshCw, Plus, Clock, CheckCircle, XCircle, Lock,
  Package, FileText, Trash2, Edit3, RotateCcw, ChevronRight,
  Check, X, AlertTriangle,
} from "lucide-react";
import styles from "@/styles/Myproducts.module.css";
import BarterLoader from "@/components/Barterloader";
import ProductPreviewCard from "@/components/Productpreviewcard";
import ProductDetailPage from "@/components/ProductDetail";
import ProductScanner from "@/components/Productscanner";
import type { PreviewReplaceOption } from "@/components/Productpreviewcard";
import { Icon } from '@iconify/react';

/* ─── Types ── */
export interface Category { id: number; name: string; }
export interface ReplaceOption {
  id: number; title: string; description: string; category: string; icon?: string;
}
export interface UserProduct {
  id: number;
  title: string;
  description: string;
  category: Category;
  images: number[];
  image_urls?: string[];
  thumbnail?: string;
  status: "Submitted" | "Approved" | "Rejected" | "Closed";
  created_at: string;
  product_replace_options: ReplaceOption[];
  purchase_year: number;
  purchase_price?: number;
  market_price?: number;
  purchase_bill: string | null;
  icon: string;
  condition?: string;
  tags?: string;
}

type Filter = "All" | "Submitted" | "Approved" | "Rejected" | "Closed";
interface MyProductsProps { onNavigate: (id: string) => void; }

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "Icon": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { icon?: string; width?: string | number; height?: string | number },
        HTMLElement
      >;
    }
  }
}

/* ─── API ── */
const BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

// "All" → /products/user/   |   others → /products/user/?status=submitted etc.
async function fetchByFilter(filter: Filter): Promise<UserProduct[]> {
  const url = filter === "All"
    ? `${BASE}products/products_by_status/`
    : `${BASE}products/products_by_status/?status=${filter.toLowerCase()}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load products");
  return res.json();
}

async function apiDelete(id: number) {
  const res = await fetch(`${BASE}products/${id}/`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error("Failed to delete product");
}

/* ─── Helpers ── */
function normalizeStatus(raw: string): UserProduct["status"] {
  const n = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  return (["Submitted","Approved","Rejected","Closed"].includes(n) ? n : "Submitted") as UserProduct["status"];
}
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

function getImageUrls(p: UserProduct): string[] {
  if (p.image_urls && p.image_urls.length > 0) return p.image_urls;
  if (p.thumbnail) return [p.thumbnail];
  return [];
}

const COND_COLOR: Record<string, string> = {
  "New": "#4ade80", "Like New": "#22d3ee", "Good": "#3b82f6", "Fair": "#f472b6",
};

/* ─── Status meta ── */
const STATUS_META: Record<UserProduct["status"], {
  Icon: React.ElementType; label: string; color: string; bg: string; border: string;
}> = {
  Submitted: { Icon: Clock,       label: "Under Review", color: "#b45309", bg: "rgba(217,119,6,0.07)",  border: "rgba(217,119,6,0.15)"  },
  Approved:  { Icon: CheckCircle, label: "Live",         color: "#15803d", bg: "rgba(22,163,74,0.07)",  border: "rgba(22,163,74,0.15)"  },
  Rejected:  { Icon: XCircle,     label: "Rejected",     color: "#b91c1c", bg: "rgba(185,28,28,0.07)",  border: "rgba(185,28,28,0.15)"  },
  Closed:    { Icon: Lock,        label: "Closed",       color: "#1d4ed8", bg: "rgba(29,78,216,0.07)",  border: "rgba(29,78,216,0.15)"  },
};

const FILTERS: Filter[] = ["All", "Submitted", "Approved", "Rejected", "Closed"];

/* ════════════════════════════
   COMPONENT
════════════════════════════ */
export default function MyProducts({ onNavigate }: MyProductsProps) {
  const [filter, setFilter]             = useState<Filter>("All");

  // Per-tab cache — null means not yet fetched for that tab
  const cache = useRef<Partial<Record<Filter, UserProduct[]>>>({});

  const [list, setList]                 = useState<UserProduct[]>([]);
  const [loading, setLoading]           = useState(true);       // full-page spinner (first load only)
  const [tabLoading, setTabLoading]     = useState(false);      // thin bar on tab switch
  const [error, setError]               = useState<string | null>(null);
  const [deleting, setDeleting]         = useState<number | null>(null);
  const [confirmId, setConfirmId]       = useState<number | null>(null);
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null);
  const [bucket, setBucket]             = useState<Set<number>>(new Set());
  const [selectedId, setSelectedId]     = useState<number | null>(null);
  const [scanProduct, setScanProduct]   = useState<UserProduct | null>(null);
  const [tabCounts, setTabCounts]       = useState<Partial<Record<Filter, number>>>({});

  /* Lock body scroll when modal open */
  useEffect(() => {
    document.body.style.overflow = (selectedId !== null || scanProduct !== null) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedId, scanProduct]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  };

  /* ── Core fetch — uses cache unless force=true ── */
  const fetchForFilter = useCallback(async (f: Filter, opts?: { force?: boolean }) => {
    // Serve from cache instantly
    if (!opts?.force && cache.current[f] !== undefined) {
      setList(cache.current[f]!);
      setError(null);
      return;
    }

    // First-ever load → full skeleton; subsequent → thin loading bar
    if (Object.keys(cache.current).length === 0) {
      setLoading(true);
    } else {
      setTabLoading(true);
    }
    setError(null);

    try {
      const raw  = await fetchByFilter(f);
      const data = raw.map(p => ({ ...p, status: normalizeStatus(p.status) }));
      cache.current[f] = data;
      setList(data);
      setTabCounts(prev => ({ ...prev, [f]: data.length }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setTabLoading(false);
    }
  }, []);

  /* Initial load */
  useEffect(() => { fetchForFilter("All"); }, [fetchForFilter]);

  /* Tab switch → API call (cached after first visit) */
  const handleFilterChange = (f: Filter) => {
    setFilter(f);
    fetchForFilter(f);
  };

  /* Manual refresh — bust cache for current tab only */
  const handleRefresh = () => fetchForFilter(filter, { force: true });

  /* Delete — bust whole cache so counts are accurate everywhere */
  const handleDelete = async (id: number) => {
    setConfirmId(null);
    setDeleting(id);
    try {
      await apiDelete(id);
      cache.current = {};                                           // bust all tabs
      setList(prev => prev.filter(x => x.id !== id));             // optimistic remove
      setBucket(b => { const nb = new Set(b); nb.delete(id); return nb; });
      showToast("Product deleted.", true);
      await fetchForFilter(filter, { force: true });               // re-fetch current tab
    } catch (e: any) {
      showToast(e.message || "Delete failed.", false);
    } finally {
      setDeleting(null);
    }
  };

  const toggleBucket = (id: number) => {
    setBucket(prev => {
      const nb = new Set(prev);
      if (nb.has(id)) { nb.delete(id); showToast("Removed from bucket.", false); }
      else            { nb.add(id);    showToast("Added to bucket! 🛒", true); }
      return nb;
    });
  };

  // Count badge: prefer cached count; fall back to live list for active tab
  const count = (f: Filter) => {
    if (tabCounts[f] !== undefined) return tabCounts[f]!;
    if (f === filter) return list.length;
    return 0;
  };

  /* ── Skeleton ── */
  const SkeletonCard = ({ delay }: { delay: number }) => (
    <div className={styles.skeletonWrap} style={{ animationDelay: `${delay}s` }}>
      <div className={styles.skelStatusBar}>
        <div className={`${styles.skelLine} ${styles.skelShort}`} />
        <div className={`${styles.skelLine} ${styles.skelXshort}`} />
      </div>
      <div className={styles.skelImg} />
      <div className={styles.skelBody}>
        <div className={`${styles.skelLine} ${styles.skelXshort}`} />
        <div className={`${styles.skelLine} ${styles.skelFull}`} />
        <div className={`${styles.skelLine} ${styles.skelMed}`} />
        <div className={styles.skelChips}>
          <div className={styles.skelChip} />
          <div className={styles.skelChip} />
        </div>
      </div>
      <div className={styles.skelFooter}>
        <div className={styles.skelBtn} />
        <div className={styles.skelBtnSm} />
      </div>
    </div>
  );

  if (loading) return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <div className={styles.skelHeaderLeft}>
          <div className={`${styles.skelLine} ${styles.skelTitle}`} />
          <div className={`${styles.skelLine} ${styles.skelSubtitle}`} />
        </div>
        <div className={styles.skelHeaderRight}>
          <div className={styles.skelHeaderBtn} />
          <div className={styles.skelHeaderBtn} />
        </div>
      </div>
      <div className={styles.filters}>
        {[80, 90, 85, 75, 70].map((w, i) => (
          <div key={i} className={styles.skelChipFilter} style={{ width: w, animationDelay: `${i * 0.07}s` }} />
        ))}
      </div>
      <div className={styles.grid}>
        {[0, 0.07, 0.14, 0.21, 0.28, 0.35, 0.42, 0.49].map((delay, i) => (
          <SkeletonCard key={i} delay={delay} />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {deleting !== null && <BarterLoader text="Deleting product…" />}

      {toast && (
        <div className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}>
          {toast.ok ? <Check size={14} /> : <X size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Delete confirm */}
      {confirmId !== null && (
        <div className={styles.overlay} onClick={() => setConfirmId(null)}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()}>
            <div className={styles.dialogIcon}><AlertTriangle size={30} color="var(--danger)" /></div>
            <h3 className={styles.dialogTitle}>Delete this listing?</h3>
            <p className={styles.dialogMsg}>This will permanently remove it and cannot be undone.</p>
            <div className={styles.dialogActions}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setConfirmId(null)}>Cancel</button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => handleDelete(confirmId)}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner modal */}
      {scanProduct !== null && (
        <ProductScanner
          productId={scanProduct.id}
          productTitle={scanProduct.title}
          productThumbnail={getImageUrls(scanProduct)[0]}
          onClose={() => setScanProduct(null)}
          onViewMatch={(match) => {
            setScanProduct(null);
            setSelectedId(match.id);
          }}
        />
      )}

      <div className={styles.shell}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>My Products</h1>
            <p className={styles.subtitle}>
              {`${list.length} item${list.length !== 1 ? "s" : ""} · ${filter === "All" ? "All statuses" : filter}`}
              {bucket.size > 0 && <span className={styles.bucketCount}> · 🛒 {bucket.size} in bucket</span>}
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={handleRefresh}
              disabled={loading || tabLoading}
            >
              <RefreshCw size={14} className={(loading || tabLoading) ? styles.spinIcon : ""} /> Refresh
            </button>
            <button className={`${styles.btn} ${styles.btnGold}`} onClick={() => onNavigate("add-product")}>
              <Plus size={14} /> Add New
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className={styles.filters}>
          {FILTERS.map(f => {
            const meta   = f !== "All" ? STATUS_META[f as UserProduct["status"]] : null;
            const active = filter === f;
            const c      = count(f);
            return (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`${styles.chip} ${active ? styles.chipActive : ""}`}
                style={active ? {
                  color: meta?.color ?? "var(--purple)",
                  borderColor: meta?.color ?? "var(--purple)",
                  background: meta?.bg ?? "var(--gold-dim)",
                } as React.CSSProperties : {}}
              >
                {f === "All" ? <Package size={12} /> : meta && <meta.Icon size={12} />}
                <span>{f === "Submitted" ? "Review" : f}</span>
                {c > 0 && (
                  <span
                    className={styles.chipBadge}
                    style={active ? { background: meta?.color ?? "var(--purple)", color: "#fff" } as React.CSSProperties : {}}
                  >
                    {c}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Thin loading bar on tab switch */}
        {tabLoading && (
          <div className={styles.tabLoadingBar}>
            <div className={styles.tabLoadingFill} />
          </div>
        )}

        {/* Error / empty / grid */}
        {error ? (
          <div className={styles.stateBox}>
            <AlertTriangle size={40} className={styles.stateIcon} />
            <p className={styles.stateTitle}>Failed to load</p>
            <p className={styles.stateMsg}>{error}</p>
            <button className={`${styles.btn} ${styles.btnGold}`} onClick={handleRefresh}>Retry</button>
          </div>

        ) : list.length === 0 && !tabLoading ? (
          <div className={styles.stateBox}>
            <Package size={40} className={styles.stateIcon} />
            <p className={styles.stateTitle}>{filter === "All" ? "No products yet" : `No ${filter.toLowerCase()} products`}</p>
            <p className={styles.stateMsg}>{filter === "All" ? "Add items you want to exchange." : `No products with "${filter}" status.`}</p>
            {filter === "All" && (
              <button className={`${styles.btn} ${styles.btnGold}`} onClick={() => onNavigate("add-product")}>
                <Plus size={13} /> Add Product
              </button>
            )}
          </div>

        ) : (
          <div className={`${styles.grid} ${tabLoading ? styles.gridFading : ""}`}>
            {list.map((p, i) => {
              const st       = STATUS_META[p.status];
              const busy     = deleting === p.id;
              const inBucket = bucket.has(p.id);
              const imgs     = getImageUrls(p);
              const replaceOpts: PreviewReplaceOption[] = p.product_replace_options.map(o => ({
                title: o.title, icon: o.icon,
              }));

              return (
                <div
                  key={p.id}
                  className={`${styles.cardWrap} ${busy ? styles.cardBusy : ""}`}
                  style={{ animationDelay: `${i * 0.055}s` }}
                >
                  <div
                    className={styles.statusBar}
                    style={{ background: st.bg, borderBottomColor: st.border } as React.CSSProperties}
                  >
                    <span className={styles.statusLabel} style={{ color: st.color } as React.CSSProperties}>
                      <st.Icon size={11} /> {st.label}
                    </span>
                    <span className={styles.statusDate}>
                      <FileText size={9} /> {fmtDate(p.created_at)}
                    </span>
                  </div>

                  <ProductPreviewCard
                    title={p.title}
                    categoryName={p.category.name}
                    condition={p.condition}
                    conditionColor={p.condition ? COND_COLOR[p.condition] : undefined}
                    purchasePrice={p.purchase_price}
                    marketPrice={p.market_price}
                    purchaseYear={p.purchase_year}
                    imageUrls={imgs}
                    replaceOptions={replaceOpts}
                    tags={p.tags}
                    status={p.status.toLowerCase()}
                    showBucketBtn={p.status === "Approved"}
                    onAddToBucket={() => toggleBucket(p.id)}
                    bucketAdded={inBucket}
                    onView={() => setSelectedId(p.id)}
                    onScan={p.status === "Approved" ? () => setScanProduct(p) : undefined}
                    onEdit={p.status === "Submitted" ? () => onNavigate(`edit-product-${p.id}`) : undefined}
                    onDelete={busy ? undefined : () => setConfirmId(p.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedId !== null && (
        <div className={styles.detailModalBackdrop} onClick={() => setSelectedId(null)}>
          <div className={styles.detailModalSheet} onClick={e => e.stopPropagation()}>
            <ProductDetailPage
              productId={selectedId}
              onBack={() => setSelectedId(null)}
              onNavigate={onNavigate}
            />
          </div>
        </div>
      )}
    </>
  );
}