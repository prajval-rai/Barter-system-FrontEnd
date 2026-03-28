"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/Pages.module.css";
import type { Product, StatusMeta, CardAction } from "./Productcard";

/* ── Types ── */
export interface ProductModalProps {
  product: Product;
  statusMeta: StatusMeta;
  /** Fetch images for the product — inject your own implementation */
  fetchImages: (productId: number) => Promise<string[]>;
  onClose: () => void;
  /** Action buttons rendered in the modal footer (same CardAction shape) */
  actions?: CardAction[];
}

/* ── Helper ── */
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

const variantClass: Record<CardAction["variant"], string> = {
  danger:  styles.btnDanger,
  success: styles.btnSuccess,
  outline: styles.btnOutline,
};

export function ProductModal({
  product,
  statusMeta: meta,
  fetchImages,
  onClose,
  actions = [],
}: ProductModalProps) {
  const [images, setImages]         = useState<string[]>([]);
  const [imgLoading, setImgLoading] = useState(true);
  const [activeImg, setActiveImg]   = useState(0);

  useEffect(() => {
    setImgLoading(true);
    fetchImages(product.id)
      .then(imgs => { setImages(imgs); setActiveImg(0); })
      .catch(() => setImages([]))
      .finally(() => setImgLoading(false));
  }, [product.id]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--black-light)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", width: "100%", maxWidth: 760,
          maxHeight: "90vh", overflowY: "auto", display: "flex",
          flexDirection: "column", boxShadow: "0 32px 100px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", borderBottom: "1px solid var(--border)",
          position: "sticky", top: 0, background: "var(--black-light)", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--gold)", fontFamily: "'Cinzel', serif" }}>
              {product.title}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
              #{product.id} · Listed {fmtDate(product.created_at)}
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700,
                background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
              }}>
                {meta.icon} {meta.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
              borderRadius: 8, color: "var(--text-muted)", width: 32, height: 32,
              cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center",
              justifyContent: "center", fontFamily: "inherit",
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Image gallery */}
          <div>
            <div style={{
              width: "100%", height: 300, borderRadius: "var(--radius-lg)",
              background: "var(--surface)", border: "1px solid var(--border)",
              overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 10,
            }}>
              {imgLoading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, border: "3px solid var(--gold)",
                    borderTopColor: "transparent", borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }} />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading images...</span>
                </div>
              ) : images.length > 0 ? (
                <img
                  src={images[activeImg]}
                  alt={`Product image ${activeImg + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
                  <div style={{ fontSize: 12 }}>No images available</div>
                </div>
              )}
            </div>
            {!imgLoading && images.length > 1 && (
              <div style={{ display: "flex", gap: 8 }}>
                {images.map((src, idx) => (
                  <button key={idx} onClick={() => setActiveImg(idx)} style={{
                    width: 64, height: 48, borderRadius: 8, overflow: "hidden", padding: 0,
                    border: `2px solid ${activeImg === idx ? "var(--gold)" : "var(--border)"}`,
                    cursor: "pointer", flexShrink: 0, background: "var(--surface)",
                    transition: "border-color 0.15s",
                  }}>
                    <img src={src} alt={`thumb ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Description</div>
              <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.65, background: "var(--surface)", padding: "12px 14px", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                {product.description}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Purchase Year</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--gold)" }}>📅 {product.purchase_year}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Purchase Bill</div>
              {product.purchase_bill ? (
                <a href={product.purchase_bill} target="_blank" rel="noreferrer"
                  style={{ fontSize: 13, color: "var(--gold)", textDecoration: "underline" }}>
                  📄 View Bill
                </a>
              ) : (
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Not provided</span>
              )}
            </div>
            {product.product_replace_options.length > 0 && (
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
                  🔄 Exchange Options ({product.product_replace_options.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {product.product_replace_options.map(opt => (
                    <div key={opt.id} style={{
                      background: "var(--surface)", border: "1px solid var(--border)",
                      borderRadius: "var(--radius)", padding: "10px 14px",
                      display: "flex", flexDirection: "column", gap: 4,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{opt.title}</span>
                        <span className="badge badge-gold" style={{ fontSize: 10 }}>{opt.category}</span>
                      </div>
                      {opt.description && (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{opt.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: "16px 24px", borderTop: "1px solid var(--border)",
          display: "flex", gap: 10, justifyContent: "flex-end",
          position: "sticky", bottom: 0, background: "var(--black-light)",
        }}>
          <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={onClose}>
            Close
          </button>
          {actions.map((action, idx) => {
            const busy     = action.isBusy?.(product)     ?? false;
            const disabled = action.isDisabled?.(product) ?? busy;
            return (
              <button
                key={idx}
                className={`${styles.btn} ${variantClass[action.variant]} ${styles.btnSm}`}
                disabled={disabled}
                onClick={() => { action.onClick(product); onClose(); }}
              >
                {busy && action.busyLabel ? action.busyLabel : action.label}
              </button>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}