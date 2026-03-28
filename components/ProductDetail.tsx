"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft, Heart, Share2, Flag, Calendar, Package,
  Repeat2, CheckCircle, Clock, XCircle, Lock, ShieldCheck,
  Star, MessageCircle, Zap, BookOpen, Tag, ImageIcon,
  ChevronLeft, ChevronRight, Maximize2, Check, X,
  Send, Eye, TrendingUp, AlertTriangle, Loader2, ChevronDown,
} from "lucide-react";
import styles from "@/styles/Productdetail.module.css";
import BarterLoader from "@/components/Barterloader";

/* ─── Types ── */
interface ProductImage {
  id: number;
  image: string;
  created_at: string;
  product: number;
}

interface ReplaceOption {
  id: number;
  title: string;
  description: string;
  category: string;
  replace_type: null;
  point_value: null;
  meta: Record<string, unknown>;
}

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
  owner?: { id: number; name: string; avatar?: string; rating?: number; trades?: number };
}

interface MyProduct {
  id: number;
  title: string;
  thumbnail: string | null;
}

interface ProductDetailProps {
  productId: number;
  onBack: () => void;
  onNavigate?: (id: string) => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "iconify-icon": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          icon?: string; width?: string | number; height?: string | number;
        },
        HTMLElement
      >;
    }
  }
}

/* ─── Status config ── */
const STATUS_MAP: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  submitted: { label: "Under Review",  color: "#b45309", bg: "rgba(217,119,6,0.08)",  Icon: Clock         },
  approved:  { label: "Available",     color: "#15803d", bg: "rgba(22,163,74,0.08)",  Icon: CheckCircle   },
  rejected:  { label: "Rejected",      color: "#b91c1c", bg: "rgba(185,28,28,0.08)",  Icon: XCircle       },
  closed:    { label: "Traded Away",   color: "#1d4ed8", bg: "rgba(29,78,216,0.08)",  Icon: Lock          },
};
const getStatus = (s: string) => STATUS_MAP[s.toLowerCase()] ?? STATUS_MAP["submitted"];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

/* ─── Exchange Request Modal ── */
function ExchangeModal({
  product,
  onClose,
  onSent,
}: {
  product: ProductDetail;
  onClose: () => void;
  onSent: () => void;
}) {
  const [myProducts, setMyProducts]     = useState<MyProduct[]>([]);
  const [loadingMine, setLoadingMine]   = useState(true);
  const [myProductsErr, setMyProductsErr] = useState<string | null>(null);
  const [selectedId, setSelectedId]     = useState<number | "">("");
  const [dropOpen, setDropOpen]         = useState(false);
  const [sending, setSending]           = useState(false);
  const [sendErr, setSendErr]           = useState<string | null>(null);

  /* Load user's own products */
  useEffect(() => {
    const load = async () => {
      setLoadingMine(true);
      try {
        const res = await fetch("http://localhost:8000/products/my_product", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load your products");
        const data: MyProduct[] = await res.json();
        setMyProducts(data);
      } catch (e: any) {
        setMyProductsErr(e.message);
      } finally {
        setLoadingMine(false);
      }
    };
    load();
  }, []);

  const selected = myProducts.find(p => p.id === selectedId);

  /* System-generated message */
  const systemMsg = selected
    ? `Hi! I'd like to exchange my "${selected.title}" for your "${product.title}". Let me know if you're interested!`
    : "";

  const handleSend = async () => {
    if (!selectedId) return;
    setSending(true);
    setSendErr(null);
    try {
      const res = await fetch("http://localhost:8000/barter/request/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          request_product: selectedId,        // user's own product they're offering
          request_for_product: product.id,    // the product they want
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.detail || "Failed to send request");
      }
      onSent();
    } catch (e: any) {
      setSendErr(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <Repeat2 size={18} className={styles.modalTitleIcon} />
            Send Exchange Request
          </div>
          <button className={styles.modalClose} onClick={onClose}><X size={16} /></button>
        </div>

        <div className={styles.modalBody}>

          {/* What they want */}
          <div className={styles.modalSection}>
            <p className={styles.modalLabel}>They're looking for</p>
            <div className={styles.wantsGrid}>
              {product.product_replace_options.length > 0 ? (
                product.product_replace_options.map(opt => (
                  <div key={opt.id} className={styles.wantCard}>
                    <iconify-icon icon={product.icon || "noto:package"} width="22" height="22" />
                    <div>
                      <p className={styles.wantTitle}>{opt.title}</p>
                      {opt.description && <p className={styles.wantDesc}>{opt.description}</p>}
                      <span className={styles.wantCat}>{opt.category}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                  Open to any reasonable offer
                </p>
              )}
            </div>
          </div>

          {/* Offer selector */}
          <div className={styles.modalSection}>
            <p className={styles.modalLabel}>
              Offer one of your listings <span style={{ color: "var(--danger)" }}>*</span>
            </p>

            {loadingMine ? (
              <div className={styles.offerSkeleton}>
                <Loader2 size={14} className={styles.spin} />
                <span>Loading your products…</span>
              </div>
            ) : myProductsErr ? (
              <div className={styles.offerError}>
                <AlertTriangle size={13} /> {myProductsErr}
              </div>
            ) : myProducts.length === 0 ? (
              <div className={styles.offerEmpty}>
                You have no approved listings to offer. Add a product first.
              </div>
            ) : (
              <div className={styles.offerDropWrap}>
                {/* Trigger */}
                <button
                  type="button"
                  className={`${styles.offerDropTrigger} ${dropOpen ? styles.offerDropTriggerOpen : ""}`}
                  onClick={() => setDropOpen(p => !p)}
                >
                  {selected ? (
                    <div className={styles.offerSelected}>
                      {selected.thumbnail ? (
                        <img src={selected.thumbnail} alt="" className={styles.offerThumb} />
                      ) : (
                        <div className={styles.offerThumbEmpty}><Package size={14} /></div>
                      )}
                      <span className={styles.offerSelectedTitle}>{selected.title}</span>
                    </div>
                  ) : (
                    <span className={styles.offerPlaceholder}>Select a product to offer…</span>
                  )}
                  <ChevronDown
                    size={14}
                    className={styles.offerChevron}
                    style={{ transform: dropOpen ? "rotate(180deg)" : "none" }}
                  />
                </button>

                {/* Dropdown list */}
                {dropOpen && (
                  <div className={styles.offerDropList}>
                    {myProducts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className={`${styles.offerDropItem} ${selectedId === p.id ? styles.offerDropItemActive : ""}`}
                        onClick={() => { setSelectedId(p.id); setDropOpen(false); setSendErr(null); }}
                      >
                        {p.thumbnail ? (
                          <img src={p.thumbnail} alt="" className={styles.offerThumb} />
                        ) : (
                          <div className={styles.offerThumbEmpty}><Package size={14} /></div>
                        )}
                        <span className={styles.offerDropTitle}>{p.title}</span>
                        {selectedId === p.id && <Check size={13} className={styles.offerDropCheck} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* System-generated message preview */}
          {selected && (
            <div className={styles.modalSection}>
              <p className={styles.modalLabel}>
                Message preview
                <span className={styles.optLabel}> · auto-generated</span>
              </p>
              <div className={styles.sysMsgBox}>
                <MessageCircle size={13} className={styles.sysMsgIcon} />
                <p className={styles.sysMsgText}>{systemMsg}</p>
              </div>
              <p className={styles.sysMsgHint}>
                You can chat with the trader once they accept your request.
              </p>
            </div>
          )}

          {/* Notice */}
          <div className={styles.modalNotice}>
            <ShieldCheck size={13} />
            Requests are reviewed before the other party sees them. No personal info shared.
          </div>

          {/* Send error */}
          {sendErr && (
            <div className={styles.modalSendErr}>
              <AlertTriangle size={13} /> {sendErr}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.modalCancelBtn} onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button
            className={styles.modalSendBtn}
            onClick={handleSend}
            disabled={sending || !selectedId || loadingMine}
          >
            {sending
              ? <><Loader2 size={14} className={styles.spin} /> Sending…</>
              : <><Send size={14} /> Send Request</>
            }
          </button>
        </div>

      </div>
    </div>
  );
}

/* ════════════════════════════
   MAIN COMPONENT
════════════════════════════ */
export default function ProductDetailPage({ productId, onBack, onNavigate }: ProductDetailProps) {
  const [product, setProduct]         = useState<ProductDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activeImg, setActiveImg]     = useState(0);
  const [lightbox, setLightbox]       = useState(false);
  const [bookmarked, setBookmarked]   = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`http://localhost:8000/products/${productId}`, { credentials: "include" });
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showModal && !lightbox) onBack();
      if (e.key === "Escape" && lightbox) setLightbox(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showModal, lightbox, onBack]);

  const handleRequestSent = () => {
    setShowModal(false);
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

  const prevImg = () => {
    if (!product) return;
    setActiveImg(i => (i - 1 + product.images.length) % product.images.length);
  };
  const nextImg = () => {
    if (!product) return;
    setActiveImg(i => (i + 1) % product.images.length);
  };

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

  const st      = getStatus(product.status);
  const images  = product.images.map(i => i.image);
  const isAvail = product.status.toLowerCase() === "approved";
  const hasBill = !!product.purchase_bill;
  const daysAgo = Math.floor((Date.now() - new Date(product.created_at).getTime()) / 86400000);

  return (
    <>
      {toast && (
        <div className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}>
          {toast.ok ? <Check size={13} /> : <X size={13} />}
          {toast.msg}
        </div>
      )}

      {showModal && (
        <ExchangeModal
          product={product}
          onClose={() => setShowModal(false)}
          onSent={handleRequestSent}
        />
      )}

      {/* Lightbox */}
      {lightbox && images.length > 0 && (
        <div className={styles.lightboxOverlay} onClick={() => setLightbox(false)}>
          <button className={styles.lightboxClose} onClick={() => setLightbox(false)}><X size={20} /></button>
          <button className={styles.lightboxPrev} onClick={e => { e.stopPropagation(); prevImg(); }}><ChevronLeft size={24} /></button>
          <img src={images[activeImg]} alt="" className={styles.lightboxImg} onClick={e => e.stopPropagation()} />
          <button className={styles.lightboxNext} onClick={e => { e.stopPropagation(); nextImg(); }}><ChevronRight size={24} /></button>
          <div className={styles.lightboxDots}>
            {images.map((_, i) => (
              <div key={i}
                className={`${styles.lightboxDot} ${i === activeImg ? styles.lightboxDotActive : ""}`}
                onClick={e => { e.stopPropagation(); setActiveImg(i); }}
              />
            ))}
          </div>
        </div>
      )}

      <div className={styles.page}>

        {/* Top bar */}
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
              onClick={() => { setBookmarked(b => !b); showToast(bookmarked ? "Removed from saved" : "Saved to wishlist ❤️", true); }}
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

        {/* 2-col layout */}
        <div className={styles.layout}>

          {/* LEFT — gallery */}
          <div className={styles.galleryCol}>
            <div className={styles.mainImgWrap} onClick={() => images.length > 0 && setLightbox(true)}>
              {images.length > 0 ? (
                <>
                  <img src={images[activeImg]} alt={product.title} className={styles.mainImg} />
                  <button className={styles.expandBtn}><Maximize2 size={14} /></button>
                  {images.length > 1 && (
                    <>
                      <button className={styles.galleryPrev} onClick={e => { e.stopPropagation(); prevImg(); }}>
                        <ChevronLeft size={18} />
                      </button>
                      <button className={styles.galleryNext} onClick={e => { e.stopPropagation(); nextImg(); }}>
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className={styles.noImg}>
                  <ImageIcon size={40} />
                  <span>No photos uploaded</span>
                </div>
              )}
              <div
                className={styles.statusOverlay}
                style={{ color: st.color, background: st.bg, borderColor: st.color + "33" } as React.CSSProperties}
              >
                <st.Icon size={11} /> {st.label}
              </div>
            </div>

            {images.length > 1 && (
              <div className={styles.thumbRow}>
                {images.map((src, i) => (
                  <div key={i}
                    className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ""}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={src} alt="" />
                  </div>
                ))}
              </div>
            )}

            <div className={styles.trustRow}>
              <div className={styles.trustBadge}><ShieldCheck size={13} color="var(--success)" /><span>Verified listing</span></div>
              {hasBill && <div className={styles.trustBadge}><BookOpen size={13} color="var(--cyan)" /><span>Bill available</span></div>}
              <div className={styles.trustBadge}><Eye size={13} color="var(--text-muted)" /><span>Listed {daysAgo === 0 ? "today" : `${daysAgo}d ago`}</span></div>
            </div>
          </div>

          {/* RIGHT — info */}
          <div className={styles.infoCol}>

            <div className={styles.catRow}>
              <span className={styles.catTag}><Tag size={10} /> {product.category.name}</span>
              <span className={styles.statusTag}
                style={{ color: st.color, background: st.bg, borderColor: st.color + "33" } as React.CSSProperties}
              >
                <st.Icon size={10} /> {st.label}
              </span>
            </div>

            <h1 className={styles.title}>{product.title}</h1>

            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <iconify-icon icon={product.icon} width="20" height="20" />
              </div>
              {product.purchase_year && (
                <div className={styles.metaItem}>
                  <Calendar size={12} className={styles.metaIcon} />
                  <span>Bought in {product.purchase_year}</span>
                </div>
              )}
              {product.condition && (
                <div className={styles.metaItem}>
                  <Star size={12} className={styles.metaIcon} />
                  <span>{product.condition} condition</span>
                </div>
              )}
            </div>

            {(product.purchase_price || product.market_price) && (
              <div className={styles.priceBox}>
                {product.purchase_price && (
                  <div className={styles.priceItem}>
                    <span className={styles.priceLabel}>Paid</span>
                    <span className={styles.priceValue}>₹{product.purchase_price.toLocaleString()}</span>
                  </div>
                )}
                {product.market_price && (
                  <div className={styles.priceItem}>
                    <span className={styles.priceLabel}>Market value</span>
                    <span className={`${styles.priceValue} ${styles.priceMarket}`}>
                      ₹{product.market_price.toLocaleString()}
                    </span>
                  </div>
                )}
                {product.purchase_price && product.market_price && (() => {
                  const diff = product.market_price - product.purchase_price;
                  const pct  = Math.abs(Math.round((diff / product.purchase_price) * 100));
                  const up   = diff > 0;
                  return (
                    <div className={`${styles.valueDelta} ${up ? styles.valueDeltaUp : styles.valueDeltaDown}`}>
                      <TrendingUp size={12} />
                      {up ? `+${pct}% appreciated` : `-${pct}% depreciated`} vs original price
                    </div>
                  );
                })()}
              </div>
            )}

            <div className={styles.descSection}>
              <p className={styles.descLabel}>About this item</p>
              <p className={styles.desc}>{product.description || "No description provided."}</p>
            </div>

            {product.tags && (
              <div className={styles.tagsRow}>
                {product.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
                  <span key={t} className={styles.tagChip}>#{t}</span>
                ))}
              </div>
            )}

            <div className={styles.exchangeSection}>
              <div className={styles.exchangeHeader}>
                <Repeat2 size={15} /><span>Will exchange for</span>
              </div>
              <div className={styles.exchangeList}>
                {product.product_replace_options.length > 0 ? (
                  product.product_replace_options.map(opt => (
                    <div key={opt.id} className={styles.exchangeItem}>
                      <div className={styles.exchangeItemIcon}>
                        <iconify-icon icon={product.icon || "noto:package"} width="18" height="18" />
                      </div>
                      <div className={styles.exchangeItemInfo}>
                        <p className={styles.exchangeItemTitle}>{opt.title}</p>
                        {opt.description && <p className={styles.exchangeItemDesc}>{opt.description}</p>}
                        <span className={styles.exchangeItemCat}>{opt.category}</span>
                      </div>
                      <Zap size={12} className={styles.exchangeZap} />
                    </div>
                  ))
                ) : (
                  <p className={styles.noExchange}>Open to any reasonable offer</p>
                )}
              </div>
            </div>

            {hasBill && (
              <a href={product.purchase_bill!} target="_blank" rel="noopener noreferrer" className={styles.billLink}>
                <BookOpen size={14} /> View purchase bill / receipt
              </a>
            )}

            <div className={styles.ctaBlock}>
              {!requestSent ? (
                <button
                  className={styles.ctaPrimary}
                  onClick={() => setShowModal(true)}
                  disabled={!isAvail}
                >
                  <Repeat2 size={16} />
                  {isAvail ? "Send Exchange Request" : "Not Available for Trade"}
                </button>
              ) : (
                <div className={styles.ctaSent}>
                  <CheckCircle size={16} />
                  Request Sent! They'll respond soon.
                </div>
              )}

              <button
                className={`${styles.ctaSecondary} ${bookmarked ? styles.ctaSecondaryActive : ""}`}
                onClick={() => { setBookmarked(b => !b); showToast(bookmarked ? "Removed from saved" : "Saved to wishlist ❤️", true); }}
              >
                <Heart size={15} fill={bookmarked ? "var(--danger)" : "none"} />
                {bookmarked ? "Saved" : "Save to Wishlist"}
              </button>

              <button className={styles.ctaGhost} onClick={handleShare}>
                <Share2 size={14} /> Share Listing
              </button>
            </div>

            <div className={styles.listingMeta}>
              <div className={styles.listingMetaItem}><Package size={11} /><span>Listing #{product.id}</span></div>
              <div className={styles.listingMetaItem}><Calendar size={11} /><span>Listed on {fmtDate(product.created_at)}</span></div>
              {hasBill && (
                <div className={styles.listingMetaItem}>
                  <CheckCircle size={11} color="var(--success)" />
                  <span style={{ color: "var(--success)" }}>Purchase bill attached</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Similar items */}
        <div className={styles.similarSection}>
          <div className={styles.similarHeader}>
            <h2 className={styles.similarTitle}>More from {product.category.name}</h2>
            <button className={styles.similarMore} onClick={() => onNavigate?.("marketplace")}>
              Browse all <ChevronRight size={14} />
            </button>
          </div>
          <div className={styles.similarPlaceholder}>
            {[1,2,3,4].map(i => (
              <div key={i} className={styles.similarCard} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className={styles.similarCardImg} />
                <div className={styles.similarCardBody}>
                  <div className={styles.similarSkelLine} style={{ width: "60%" }} />
                  <div className={styles.similarSkelLine} style={{ width: "85%", height: 13 }} />
                  <div className={styles.similarSkelLine} style={{ width: "45%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}