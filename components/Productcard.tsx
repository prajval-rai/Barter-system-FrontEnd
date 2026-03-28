"use client";

import { Scan } from "lucide-react";
import styles from "@/styles/Pages.module.css";

/* ── Types ── */
export interface ReplaceOption {
  id: number;
  title: string;
  description: string;
  category: string;
  replace_type: string | null;
  point_value: number | null;
  meta: Record<string, unknown>;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  category?: { id: number; name: string } | string;
  created_at: string;
  product_replace_options: ReplaceOption[];
  purchase_year: number;
  purchase_bill: string | null;
  seller_name?: string;
  seller_id?: number;
  price?: number;
}

export interface StatusMeta {
  label: string;
  icon?: string;
  color: string;
  bg: string;
  border: string;
}

export interface CardAction {
  label: string;
  busyLabel?: string;
  variant: "danger" | "success" | "outline";
  flex?: number;
  onClick: (product: Product) => void;
  isBusy?: (product: Product) => boolean;
  isDisabled?: (product: Product) => boolean;
}

export interface ProductCardProps {
  product: Product;
  statusMeta: StatusMeta;
  /** Called when the "Show More" button is clicked */
  onShowMore: (product: Product) => void;
  /** Quick-action buttons rendered in the card footer */
  actions?: CardAction[];
  /**
   * If provided, a Scan button is rendered alongside "Show More".
   * Pass this only in owner/profile contexts — omit it everywhere else
   * and the button simply won't appear.
   */
  onScan?: (product: Product) => void;
}

/* ── Helpers ── */
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

const getCategoryName = (category: Product["category"]): string => {
  if (!category) return "";
  if (typeof category === "object") return category.name;
  return category;
};

const variantClass: Record<CardAction["variant"], string> = {
  danger:  styles.btnDanger,
  success: styles.btnSuccess,
  outline: styles.btnOutline,
};

/* ════════════════════════════
   PRODUCT CARD
════════════════════════════ */
export function ProductCard({
  product,
  statusMeta: meta,
  onShowMore,
  actions = [],
  onScan,
}: ProductCardProps) {
  const categoryName = getCategoryName(product.category);
  const uniqueCategories = [
    ...new Set(product.product_replace_options.map(o => o.category)),
  ];

  return (
    <div className={styles.productCard}>

      {/* ── Icon / header area ── */}
      <div
        className={styles.productEmoji}
        style={{ flexDirection: "column", gap: 4, position: "relative" }}
      >
        <span style={{ fontSize: 48 }}>📦</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>#{product.id}</span>

        {/* Status pill */}
        <span
          style={{
            position: "absolute", top: 10, right: 10,
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
            background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
          }}
        >
          {meta.icon} {meta.label}
        </span>

        {product.purchase_bill && (
          <span
            className="badge badge-gold"
            style={{ position: "absolute", top: 10, left: 10, fontSize: 10 }}
          >
            📄 Bill
          </span>
        )}

        <span style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
          {fmtDate(product.created_at)}
        </span>
      </div>

      {/* ── Body ── */}
      <div className={styles.productBody}>
        <div className={styles.productTitle}>{product.title}</div>
        <div className={styles.productDesc}>{product.description}</div>

        <div className={styles.productMeta}>
          <span className="badge badge-gold">📅 {product.purchase_year}</span>
          {categoryName && (
            <span className={styles.tag}>#{categoryName}</span>
          )}
        </div>

        {product.product_replace_options.length > 0 && (
          <div className={styles.lookingFor}>
            🔄 Accepts:{" "}
            <span>{product.product_replace_options.map(o => o.title).join(", ")}</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {uniqueCategories.map(cat => (
            <span key={cat} className={styles.tag}>#{cat}</span>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className={styles.productFooter} style={{ flexDirection: "column", gap: 8 }}>

        {/* Primary row: Show More + optional Scan */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
            style={{ flex: 1, justifyContent: "center" }}
            onClick={() => onShowMore(product)}
          >
            👁 Show More
          </button>

          {onScan && (
            <button
              className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
              style={{ justifyContent: "center", gap: 5 }}
              onClick={() => onScan(product)}
              title="Scan for barter matches"
            >
              <Scan size={13} /> Scan
            </button>
          )}
        </div>

        {/* Action buttons row (approve / reject / ban etc.) */}
        {actions.length > 0 && (
          <div style={{ display: "flex", gap: 8 }}>
            {actions.map((action, idx) => {
              const busy     = action.isBusy?.(product)     ?? false;
              const disabled = action.isDisabled?.(product) ?? busy;
              return (
                <button
                  key={idx}
                  className={`${styles.btn} ${variantClass[action.variant]} ${styles.btnSm}`}
                  style={{ flex: action.flex ?? 1 }}
                  disabled={disabled}
                  onClick={() => action.onClick(product)}
                >
                  {busy && action.busyLabel ? action.busyLabel : action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}