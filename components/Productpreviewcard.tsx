"use client";

import { useState } from "react";
import {
  Camera, Calendar,
  Repeat2, Box, ImageIcon, ShoppingBag, Check,
  Eye, Pencil, Trash2, Scan,
} from "lucide-react";
import styles from "@/styles/Productpreviewcard.module.css";

/* ─── Types ── */
export interface PreviewReplaceOption {
  title: string;
  icon?: string;
}

export type ProductStatus = "submitted" | "approved" | "banned" | string;

export interface ProductPreviewCardProps {
  title?: string;
  categoryName?: string;
  categoryIcon?: React.ElementType;
  condition?: string;
  conditionColor?: string;
  purchasePrice?: number | "";
  marketPrice?: number | "";
  purchaseYear?: number | "";
  imageUrls?: string[];
  replaceOptions?: PreviewReplaceOption[];
  tags?: string;
  status?: ProductStatus;

  /* ── Bucket ── */
  showBucketBtn?: boolean;
  onAddToBucket?: () => void;
  bucketAdded?: boolean;

  /* ── Hover action bar ──────────────────────────────────
     onView   → always pass — shown to everyone
     onEdit   → owner only (e.g. Submitted)
     onDelete → owner only
     onScan   → owner only (e.g. Approved)
  ─────────────────────────────────────────────────────── */
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onScan?: () => void;

  /** Click on the card body itself */
  onClick?: () => void;
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
const STATUS_CFG: Record<string, {
  label: string; dot: string; text: string; bg: string; border: string; pulse: boolean;
}> = {
  submitted: { label: "in review", dot: "var(--warning)", text: "var(--warning)", bg: "rgba(217,119,6,0.09)",  border: "rgba(217,119,6,0.22)",  pulse: true  },
  approved:  { label: "live",      dot: "var(--success)", text: "var(--success)", bg: "rgba(22,163,74,0.09)",  border: "rgba(22,163,74,0.22)",  pulse: false },
  banned:    { label: "banned",    dot: "var(--danger)",  text: "var(--danger)",  bg: "rgba(225,29,72,0.09)",  border: "rgba(225,29,72,0.22)",  pulse: false },
};

function getStatus(s?: string) {
  if (!s) return null;
  return STATUS_CFG[s.toLowerCase()] ?? {
    label: s.toLowerCase(), dot: "var(--text-muted)", text: "var(--text-muted)",
    bg: "var(--surface)", border: "var(--border)", pulse: false,
  };
}

/* ─── Value % badge ── */
function ValuePctBadge({ purchasePrice, marketPrice }: {
  purchasePrice: number | ""; marketPrice: number | "";
}) {
  if (!purchasePrice || !marketPrice || Number(purchasePrice) === 0) return null;
  const paid = Number(purchasePrice), market = Number(marketPrice);
  const diff = market - paid;
  const pct  = Math.abs(Math.round((diff / paid) * 100));
  const gain = diff > 0;
  if (diff === 0) return <span className={`${styles.vBadge} ${styles.vFlat}`}>↔ 0%</span>;
  return (
    <span className={`${styles.vBadge} ${gain ? styles.vUp : styles.vDown}`}>
      {gain ? "↑+" : "↓-"}{pct}%
    </span>
  );
}

/* ─── Image with fallback ── */
function CardImage({ src, alt }: { src: string; alt: string }) {
  const [err, setErr] = useState(false);
  if (err) return (
    <div className={styles.imgEmpty}><Camera size={28} /><span>no photo</span></div>
  );
  return <img src={src} alt={alt} className={styles.img} onError={() => setErr(true)} />;
}

/* ════════════════════════════
   MAIN EXPORT
════════════════════════════ */
export default function ProductPreviewCard({
  title,
  categoryName,
  categoryIcon: CatIcon,
  condition,
  conditionColor,
  purchasePrice,
  marketPrice,
  purchaseYear,
  imageUrls = [],
  replaceOptions = [],
  tags,
  status,
  showBucketBtn = false,
  onAddToBucket,
  bucketAdded = false,
  onView,
  onEdit,
  onDelete,
  onScan,
  onClick,
}: ProductPreviewCardProps) {
  const activeOpts = replaceOptions.filter(o => o.title?.trim()).slice(0, 2);
  const sc = getStatus(status);
  const hasActions = !!(onView || onEdit || onDelete || onScan);

  return (
    <article
      className={`${styles.card} ${onClick ? styles.clickable : ""} ${hasActions ? styles.hasActions : ""}`}
      onClick={onClick}
    >
      {/* ══ IMAGE ══ */}
      <div className={styles.imgWrap}>
        {imageUrls.length > 0
          ? <CardImage src={imageUrls[0]} alt={title || "product"} />
          : <div className={styles.imgEmpty}><Camera size={28} /><span>no photo yet</span></div>
        }

        <div className={styles.scrim} />

        {sc && (
          <div className={styles.statusWrap}>
            <span
              className={styles.statusPill}
              style={{ "--dot-color": sc.dot, color: sc.text, background: sc.bg, borderColor: sc.border } as React.CSSProperties}
              data-pulse={sc.pulse ? "true" : undefined}
            >
              <span className={styles.statusDot} />
              {sc.label}
            </span>
          </div>
        )}

        {imageUrls.length > 1 && (
          <span className={styles.imgMore}><ImageIcon size={9} /> {imageUrls.length}</span>
        )}

        {condition && (
          <span
            className={styles.condTag}
            style={conditionColor ? {
              color: conditionColor,
              background: conditionColor + "1a",
              borderColor: conditionColor + "40",
            } as React.CSSProperties : {}}
          >
            {condition}
          </span>
        )}

        {showBucketBtn && (
          <button
            className={`${styles.bucketCta} ${bucketAdded ? styles.bucketDone : ""}`}
            onClick={e => { e.stopPropagation(); onAddToBucket?.(); }}
          >
            {bucketAdded ? <><Check size={13} /> saved</> : <><ShoppingBag size={13} /> want this</>}
          </button>
        )}
      </div>

      {/* ══ BODY ══ */}
      <div className={styles.body}>
        {categoryName && (
          <p className={styles.cat}>
            {CatIcon && <CatIcon size={9} />}
            {categoryName}
          </p>
        )}

        <h3 className={styles.title}>
          {title || <em className={styles.noTitle}>untitled drop</em>}
        </h3>

        <div className={styles.chips}>
          {purchaseYear && (
            <span className={styles.chip}><Calendar size={9} /> {purchaseYear}</span>
          )}
          {purchasePrice && marketPrice && (
            <ValuePctBadge purchasePrice={purchasePrice} marketPrice={marketPrice} />
          )}
        </div>

        {activeOpts.length > 0 && (
          <div className={styles.wantsRow}>
            <Repeat2 size={10} className={styles.wantsIcon} />
            <div className={styles.wantsChips}>
              {activeOpts.map((o, i) => (
                <span key={i} className={styles.wantChip}>
                  {o.icon ? <iconify-icon icon={o.icon} width="10" height="10" /> : <Box size={9} />}
                  {o.title}
                </span>
              ))}
              {replaceOptions.filter(o => o.title?.trim()).length > 2 && (
                <span className={styles.wantMore}>
                  +{replaceOptions.filter(o => o.title?.trim()).length - 2}
                </span>
              )}
            </div>
          </div>
        )}

        {tags && (
          <div className={styles.tagsRow}>
            {tags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 3).map(t => (
              <span key={t} className={styles.tagChip}>#{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* ══ HOVER ACTION BAR ══
          Lives BELOW the body — expands downward on hover.
          Does NOT overlap the image at all.
          Order: View (everyone) → Scan → Edit → Delete
      */}
      {hasActions && (
        <div className={styles.hoverActions} onClick={e => e.stopPropagation()}>
          {onView && (
            <button className={`${styles.act} ${styles.actView}`} onClick={onView}>
              <Eye size={12} /> view
            </button>
          )}
          {onScan && (
            <button className={`${styles.act} ${styles.actScan}`} onClick={onScan}>
              <Scan size={12} /> scan
            </button>
          )}
          {onEdit && (
            <button className={`${styles.act} ${styles.actEdit}`} onClick={onEdit}>
              <Pencil size={12} /> edit
            </button>
          )}
          {onDelete && (
            <button className={`${styles.act} ${styles.actDel}`} onClick={onDelete}>
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}
    </article>
  );
}