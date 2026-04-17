// components/ProductDetail/ProductInfo.tsx
import { Calendar, Star, TrendingUp, Tag } from "lucide-react";
import { Icon } from "@iconify/react";
import styles from "@/styles/Productdetail.module.css";

interface Props {
  title: string;
  category: string;
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  StatusIcon: React.ElementType;
  icon: string;
  purchaseYear?: number;
  condition?: string;
  purchasePrice?: number;
  marketPrice?: number;
  description?: string;
  tags?: string;
}

export default function ProductInfo({
  title, category, statusLabel, statusColor, statusBg, StatusIcon,
  icon, purchaseYear, condition, purchasePrice, marketPrice,
  description, tags,
}: Props) {
  return (
    <>
      {/* Category + status row */}
<div className={styles.catRow}>
  <span className={styles.catTag}><Tag size={10} /> {category}</span>
  <span
    className={`${styles.statusTag} ${styles.statusTagDesktop}`}  // ← add this class
    style={{ color: statusColor, background: statusBg, borderColor: statusColor + "33" } as React.CSSProperties}
  >
    <StatusIcon size={10} /> {statusLabel}
  </span>
</div>

      {/* Title */}
      <h1 className={styles.title}>{title}</h1>

      {/* Meta row */}
      <div className={styles.metaRow}>
        <div className={styles.metaItem}>
          <Icon icon={icon} width="20" height="20" />
        </div>
        {purchaseYear && (
          <div className={styles.metaItem}>
            <Calendar size={12} className={styles.metaIcon} />
            <span>Bought in {purchaseYear}</span>
          </div>
        )}
        {condition && (
          <div className={styles.metaItem}>
            <Star size={12} className={styles.metaIcon} />
            <span>{condition} condition</span>
          </div>
        )}
      </div>

      {/* Price box */}
      {(purchasePrice || marketPrice) && (
        <div className={styles.priceBox}>
          {purchasePrice && (
            <div className={styles.priceItem}>
              <span className={styles.priceLabel}>Paid</span>
              <span className={styles.priceValue}>₹{purchasePrice.toLocaleString()}</span>
            </div>
          )}
          {marketPrice && (
            <div className={styles.priceItem}>
              <span className={styles.priceLabel}>Market value</span>
              <span className={`${styles.priceValue} ${styles.priceMarket}`}>
                ₹{marketPrice.toLocaleString()}
              </span>
            </div>
          )}
          {purchasePrice && marketPrice && (() => {
            const diff = marketPrice - purchasePrice;
            const pct  = Math.abs(Math.round((diff / purchasePrice) * 100));
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

      {/* Description */}
      <div className={styles.descSection}>
        <p className={styles.descLabel}>About this item</p>
        <p className={styles.desc}>{description || "No description provided."}</p>
      </div>

      {/* Tags */}
      {tags && (
        <div className={styles.tagsRow}>
          {tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
            <span key={t} className={styles.tagChip}>#{t}</span>
          ))}
        </div>
      )}
    </>
  );
}