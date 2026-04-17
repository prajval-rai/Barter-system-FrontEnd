// components/ProductDetail/index.tsx  (was ProductDetailPage.tsx)
"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Heart, Share2, Flag, ChevronRight, Check, X, AlertTriangle } from "lucide-react";
import {
  Clock, CheckCircle, XCircle, Lock,
} from "lucide-react";

import styles from "@/styles/Productdetail.module.css";
import BarterLoader from "@/components/Barterloader";

import ProductGallery  from "./ProductGallery";
import ProductInfo     from "./ProductInfo";
import ExchangeSection from "./ExchangeSection";
import ProductCTA      from "./ProductCTA";
import ExchangeModal   from "./ExchangeModal";
import SimilarItems    from "./SimilarItems";

/* ─── Types ── */
interface ProductImage  { id: number; image: string; created_at: string; product: number; }
interface ReplaceOption { id: number; title: string; description: string; category: string; replace_type: null; point_value: null; meta: Record<string, unknown>; }

interface ProductDetail {
  id: number;
  title: string;
  description: string;
  category: { id: number; name: string };
  images: ProductImage[];
  status: string;
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

interface Props {
  productId: number;
  onBack: () => void;
  onNavigate?: (id: string) => void;
}

/* ─── Status config ── */
const STATUS_MAP: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  submitted: { label: "Under Review", color: "#b45309", bg: "rgba(217,119,6,0.08)",  Icon: Clock       },
  approved:  { label: "Available",    color: "#15803d", bg: "rgba(22,163,74,0.08)",  Icon: CheckCircle },
  rejected:  { label: "Rejected",     color: "#b91c1c", bg: "rgba(185,28,28,0.08)",  Icon: XCircle     },
  closed:    { label: "Traded Away",  color: "#1d4ed8", bg: "rgba(29,78,216,0.08)",  Icon: Lock        },
};
const getStatus = (s: string) => STATUS_MAP[s.toLowerCase()] ?? STATUS_MAP["submitted"];

/* ════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════ */
export default function ProductDetailPage({ productId, onBack, onNavigate }: Props) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [product, setProduct]         = useState<ProductDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [bookmarked, setBookmarked]   = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);

  const base_url = process.env.NEXT_PUBLIC_BACKEND_URL;

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  /* Fetch product */
  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`${base_url}products/${productId}`, { credentials: "include" });
        if (!res.ok) throw new Error("Product not found");
        setProduct(await res.json());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showModal) onBack();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showModal, onBack]);

  // Replace handleRequestSent:
const handleRequestSent = () => {
  setShowModal(false);
  document.body.style.overflow = ""; // ← add this line
  setRequestSent(true);
  showToast("Exchange request sent! 🎉", true);
};

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard!", true);
    }
  };

  const handleToggleBookmark = () => {
    setBookmarked(b => !b);
    showToast(bookmarked ? "Removed from saved" : "Saved to wishlist ❤️", true);
  };

  /* ── Loading / Error states ── */
  if (loading) return <BarterLoader text="Loading product…" />;

  if (error || !product) return (
    <div className={styles.errorPage}>
      <AlertTriangle size={40} color="var(--danger)" />
      <p className={styles.errorTitle}>Product not found</p>
      <p className={styles.errorSub}>{error}</p>
      <button className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={14} /> Go back
      </button>
    </div>
  );

  /* Derived values */
  const st      = getStatus(product.status);
  const isAvail = product.status.toLowerCase() === "approved";
  const hasBill = !!product.purchase_bill;
  const daysAgo = Math.floor((Date.now() - new Date(product.created_at).getTime()) / 86400000);

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}>
          {toast.ok ? <Check size={13} /> : <X size={13} />}
          {toast.msg}
        </div>
      )}

      {/* Exchange modal */}
      {showModal && (
        <ExchangeModal
          productId={product.id}
          productTitle={product.title}
          onClose={() => {
  setShowModal(false);
  document.body.style.overflow = "";
}}
          onSent={handleRequestSent}
        />
      )}

      <div className={styles.page} ref={pageRef}>

        {/* ── Top bar ── */}
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={onBack}>
            <X size={15} /> Close
          </button>
          <div className={styles.breadcrumb}>
            <span>Marketplace</span>
            <ChevronRight size={12} />
            <span>{product.category.name}</span>
            <ChevronRight size={12} />
            <span className={styles.breadcrumbActive}>{product.title}</span>
          </div>
          <div className={styles.topActions}>
            <button
              className={`${styles.iconBtn} ${bookmarked ? styles.iconBtnActive : ""}`}
              onClick={handleToggleBookmark}
              title="Save to wishlist"
            >
              <Heart size={16} fill={bookmarked ? "var(--danger)" : "none"} />
            </button>
            <button className={styles.iconBtn} onClick={handleShare} title="Share">
              <Share2 size={16} />
            </button>
            <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Report listing">
              <Flag size={15} />
            </button>
          </div>
        </div>

        {/* ── 2-col layout ── */}
        <div className={styles.layout}>

          {/* LEFT — gallery */}
          <ProductGallery
            images={product.images}
            statusLabel={st.label}
            statusColor={st.color}
            statusBg={st.bg}
            StatusIcon={st.Icon}
            hasBill={hasBill}
            daysAgo={daysAgo}
          />

          {/* RIGHT — info */}
          <div className={styles.infoCol}>
            <ProductInfo
              title={product.title}
              category={product.category.name}
              statusLabel={st.label}
              statusColor={st.color}
              statusBg={st.bg}
              StatusIcon={st.Icon}
              icon={product.icon}
              purchaseYear={product.purchase_year}
              condition={product.condition}
              purchasePrice={product.purchase_price}
              marketPrice={product.market_price}
              description={product.description}
              tags={product.tags}
            />

            <ExchangeSection
              replaceOptions={product.product_replace_options}
              productIcon={product.icon}
              purchaseBill={product.purchase_bill}
            />

            <ProductCTA
              isAvail={isAvail}
              requestSent={requestSent}
              bookmarked={bookmarked}
              productId={product.id}
              createdAt={product.created_at}
              hasBill={hasBill}
              onSendRequest={() => {
  // Scroll every possible container to top
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  // Scroll the ref's scrollable parents
  let el: HTMLElement | null = pageRef.current ?? null;
  while (el) {
    el.scrollTop = 0;
    el = el.parentElement;
  }

  document.body.style.overflow = "hidden";

  // Small delay so scroll completes before modal renders
  setTimeout(() => setShowModal(true), 50);
}}
              onToggleBookmark={handleToggleBookmark}
              onShare={handleShare}
            />
          </div>
        </div>

        {/* ── Similar items ── */}
        <SimilarItems
          categoryName={product.category.name}
          onNavigate={onNavigate}
        />

      </div>
    </>
  );
}