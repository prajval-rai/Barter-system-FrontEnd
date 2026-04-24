"use client";

import { useState } from "react";
import {
  Camera, Calendar, Repeat2, Box, ImageIcon,
  Heart, Check, Pencil, Trash2, Scan,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown,
  AlertCircle,
} from "lucide-react";
import styles from "@/styles/Productpreviewcard.module.css";
import { Icon } from '@iconify/react';

/* ─── Types ── */
export interface PreviewReplaceOption {
  title: string;
  icon?: string;
  description?: string;
  categoryName?: string;
}

export type ProductStatus = "submitted" | "approved" | "banned" | "rejected" | string;

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
  date?: string;

  showBucketBtn?: boolean;
  onAddToBucket?: () => void;
  bucketAdded?: boolean;

  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onScan?: () => void;
  onResubmit?: () => void;

  onClick?: () => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "Icon": React.DetailedHTMLProps<
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
  label: string; cls: string; pulse: boolean;
}> = {
  submitted: { label: "in review",  cls: "review",    pulse: true  },
  approved:  { label: "live",       cls: "live",      pulse: false },
  banned:    { label: "banned",     cls: "rejected",  pulse: false },
  rejected:  { label: "rejected",   cls: "rejected",  pulse: false },
};

function getStatus(s?: string) {
  if (!s) return null;
  return STATUS_CFG[s.toLowerCase()] ?? {
    label: s.toLowerCase(), cls: "default", pulse: false,
  };
}

/* ─── Condition class map ── */
const COND_CLS: Record<string, string> = {
  "brand new": "condNew", "new": "condNew",
  "like new": "condLike",
  "good": "condGood",
  "fair": "condFair",
};

function condClass(label?: string) {
  if (!label) return "";
  return COND_CLS[label.toLowerCase()] || "condGood";
}

/* ─── Value badge ── */
function ValueBadge({ purchasePrice, marketPrice }: {
  purchasePrice: number | ""; marketPrice: number | "";
}) {
  if (!purchasePrice || !marketPrice || Number(purchasePrice) === 0) return null;
  const paid = Number(purchasePrice), market = Number(marketPrice);
  const diff = market - paid;
  if (diff === 0) return <span className={`${styles.metaChip} ${styles.valFlat}`}>↔ 0%</span>;
  const pct = Math.abs(Math.round((diff / paid) * 100));
  const gain = diff > 0;
  return (
    <span className={`${styles.metaChip} ${gain ? styles.valUp : styles.valDown}`}>
      {gain ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {gain ? `+${pct}%` : `-${pct}%`} vs paid
    </span>
  );
}

/* ─── Image with fallback ── */
function CardImage({ src, alt }: { src: string; alt: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className={styles.imgEmpty}>
        <Camera size={28} />
        <span>photo unavailable</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={styles.img}
      onError={() => setErr(true)}
      loading="lazy"
    />
  );
}

/* ─── Exchange chips with expand ── */
const VISIBLE_CHIPS = 2;

function ExchangeSection({ options }: { options: PreviewReplaceOption[] }) {
  const [expanded, setExpanded] = useState(false);
  const active = options.filter(o => o.title?.trim());
  if (active.length === 0) return null;

  const visible = active.slice(0, VISIBLE_CHIPS);
  const overflow = active.slice(VISIBLE_CHIPS);
  const hasMore = overflow.length > 0;

  return (
    <div className={styles.exchangeSection}>
      <div className={styles.exchangeLabel}>
        <Repeat2 size={10} />
        Wants in exchange
      </div>

      <div className={styles.exchangeChips}>
        {visible.map((o, i) => (
          <span key={i} className={styles.exChip}>
            {o.icon
              ? <Icon icon={o.icon} width="11" height="11" />
              : <Box size={9} />}
            {o.title}
          </span>
        ))}
        {hasMore && !expanded && (
          <button
            className={styles.exMore}
            onClick={e => { e.stopPropagation(); setExpanded(true); }}
          >
            +{overflow.length} more <ChevronDown size={10} />
          </button>
        )}
      </div>

      {expanded && (
        <div className={styles.expandPanel}>
          <div className={styles.expandHeader}>
            <span>All {active.length} exchange options</span>
            <button
              className={styles.expandClose}
              onClick={e => { e.stopPropagation(); setExpanded(false); }}
            >
              Close <ChevronUp size={10} />
            </button>
          </div>
          {active.map((o, i) => (
            <div key={i} className={styles.expandRow}>
              <div className={styles.expandIcon}>
                {o.icon
                  ? <Icon icon={o.icon} width="14" height="14" />
                  : <Box size={13} />}
              </div>
              <div className={styles.expandInfo}>
                <div className={styles.expandTitle}>{o.title}</div>
                {(o.categoryName || o.description) && (
                  <div className={styles.expandSub}>
                    {[o.categoryName, o.description].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
  date,
  showBucketBtn = false,
  onAddToBucket,
  bucketAdded = false,
  onView,
  onEdit,
  onDelete,
  onScan,
  onResubmit,
  onClick,
}: ProductPreviewCardProps) {
  const sc = getStatus(status);
  const hasActions = !!(onEdit || onDelete || onScan || onResubmit);
  const isRejected = status?.toLowerCase() === "rejected" || status?.toLowerCase() === "banned";

  const condLabel = condition?.toLowerCase() || "";
  const cCls = condLabel ? condClass(condLabel) : "";

  return (
    <article
      className={`${styles.card} ${onClick ? styles.clickable : ""} ${hasActions ? styles.hasActions : ""} ${isRejected ? styles.cardRejected : ""}`}
      onClick={onClick}
    >
      {/* ══ IMAGE ══ */}
      <div
        className={`${styles.imgWrap} ${onView ? styles.imgClickable : ""}`}
        onClick={onView ? (e) => { e.stopPropagation(); onView(); } : undefined}
      >
        {imageUrls.length > 0
          ? <CardImage src={imageUrls[0]} alt={title || "product"} />
          : (
            <div className={styles.imgEmpty}>
              <Camera size={28} />
              <span>{title || "no photo yet"}</span>
            </div>
          )}

        <div className={styles.scrim} />

        {/* Status badge — top left */}
        {sc && (
          <div className={`${styles.statusBadge} ${styles[`badge_${sc.cls}`]}`}>
            <span className={`${styles.statusDot} ${sc.pulse ? styles.statusDotPulse : ""}`} />
            {sc.label}
          </div>
        )}

        {/* Heart / bucket — top right */}
        {showBucketBtn && (
          <button
            className={`${styles.heartBtn} ${bucketAdded ? styles.heartActive : ""}`}
            onClick={e => { e.stopPropagation(); onAddToBucket?.(); }}
            aria-label={bucketAdded ? "Saved" : "Save item"}
          >
            {bucketAdded
              ? <Check size={13} strokeWidth={2.5} />
              : <Heart size={13} strokeWidth={2} />}
          </button>
        )}

        {/* Image count — top right (when no bucket btn) */}
        {imageUrls.length > 1 && !showBucketBtn && (
          <span className={styles.imgCount}>
            <ImageIcon size={9} /> {imageUrls.length}
          </span>
        )}

        {/* Condition — bottom left */}
        {condition && (
          <span
            className={`${styles.condTag} ${cCls ? styles[cCls] : ""}`}
            style={conditionColor && !cCls ? {
              color: conditionColor,
              background: conditionColor + "22",
              borderColor: conditionColor + "50",
            } : undefined}
          >
            {condition.toLowerCase()}
          </span>
        )}

        {/* Date — bottom right */}
        {date && <span className={styles.dateTag}>{date}</span>}
      </div>

      {/* ══ BODY ══ */}
      <div className={styles.body}>
        <div className={styles.bodyTopRow}>
          <div className={styles.bodyLeft}>
            {categoryName && (
              <p className={styles.cat}>
                <span className={styles.catDot} />
                {CatIcon && <CatIcon size={9} />}
                {categoryName}
              </p>
            )}

            <h3 className={styles.title}>
              {title || <em className={styles.noTitle}>untitled drop</em>}
            </h3>
          </div>

          {/* Inline icon actions — edit / scan / resubmit / delete */}
          {hasActions && (
            <div className={styles.iconActions} onClick={e => e.stopPropagation()}>
              {onScan && (
                <button className={`${styles.iconBtn} ${styles.iconScan}`} onClick={onScan} title="Scan">
                  <Scan size={13} />
                </button>
              )}
              {onResubmit && (
                <button className={`${styles.iconBtn} ${styles.iconResubmit}`} onClick={onResubmit} title="Resubmit">
                  <Pencil size={13} />
                </button>
              )}
              {onEdit && (
                <button className={`${styles.iconBtn} ${styles.iconEdit}`} onClick={onEdit} title="Edit">
                  <Pencil size={13} />
                </button>
              )}
              {onDelete && (
                <button className={`${styles.iconBtn} ${styles.iconDel}`} onClick={onDelete} title="Delete">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className={styles.metaRow}>
          {purchaseYear && (
            <span className={styles.metaChip}>
              <Calendar size={9} /> {purchaseYear}
            </span>
          )}
          <ValueBadge purchasePrice={purchasePrice ?? ""} marketPrice={marketPrice ?? ""} />
          {isRejected && (
            <span className={styles.rejectChip}>
              <AlertCircle size={9} /> Resubmit required
            </span>
          )}
        </div>

        {tags && (
          <div className={styles.tagsRow}>
            {tags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 3).map(t => (
              <span key={t} className={styles.tagChip}>#{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* ══ EXCHANGE ══ */}
      <ExchangeSection options={replaceOptions} />
    </article>
  );
}