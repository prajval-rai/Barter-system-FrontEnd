"use client";

import { useRouter } from "next/navigation";
import styles from "./Marketplace.module.css";
import { Product } from "./page";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const router = useRouter();

  return (
    <div
      className={styles.card}
      onClick={() => router.push(`/products/${product.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/products/${product.id}`)}
      aria-label={`View ${product.title}`}
    >
      {/* Image */}
      <div className={styles.cardImageWrap}>
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            className={styles.cardImage}
          />
        ) : (
          <div className={styles.cardImagePlaceholder}>
            <IconifyImg icon="noto:package" size={56} />
          </div>
        )}
        <span className={styles.cardCategory}>{product.category_name}</span>
      </div>

      {/* Title + description */}
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{product.title}</h3>
        {product.description && (
          <p className={styles.cardDesc}>{product.description}</p>
        )}
      </div>

      {/* Swap row: Offering ↔ Wants */}
      <div className={styles.swapRow}>
        <div className={styles.swapSide}>
          <span className={styles.swapLabel}>Offering</span>
          <div className={styles.swapItem}>
            <span className={styles.swapItemText}>{product.title}</span>
          </div>
        </div>

        <div className={styles.swapArrow}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 5.5H14M14 5.5L10.5 2M14 5.5L10.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 10.5H2M2 10.5L5.5 7M2 10.5L5.5 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className={`${styles.swapSide} ${styles.swapSideRight}`}>
          <span className={styles.swapLabel}>Wants</span>
          <div className={styles.swapWantsList}>
            {product.replace_options?.length > 0 ? (
              product.replace_options.slice(0, 3).map((opt) => (
                <div key={opt.id} className={styles.swapWantItem}>
                  <IconifyImg icon={opt.icon || "noto:package"} size={16} />
                  <span className={styles.swapItemText}>{opt.title}</span>
                </div>
              ))
            ) : (
              <span className={styles.swapItemText}>Open to offers</span>
            )}
            {product.replace_options?.length > 3 && (
              <span className={styles.swapMore}>+{product.replace_options.length - 3} more</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders any Iconify icon string (e.g. "noto:package", "mdi:book-open")
 * by calling the Iconify REST API as a plain <img>.
 * No package install needed. Works with any icon set OpenAI generates.
 *
 * API format: https://api.iconify.design/{prefix}/{name}.svg
 * e.g. "noto:package" → https://api.iconify.design/noto/package.svg
 */
function IconifyImg({
  icon,
  size = 16,
}: {
  icon: string;
  size?: number;
}) {
  const [prefix, ...rest] = icon.split(":");
  const name = rest.join(":");   // handles edge case if name itself has colons

  if (!prefix || !name) {
    // malformed string — render nothing
    return null;
  }

  const url = `https://api.iconify.design/${prefix}/${name}.svg`;

  return (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      aria-hidden="true"
      className={styles.wantIcon}
      // if iconify is unreachable, hide broken image
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}