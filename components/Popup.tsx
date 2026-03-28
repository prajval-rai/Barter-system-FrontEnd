import styles from "@/styles/AddProduct.module.css";
import pageStyles from "@/styles/Pages.module.css";

interface PopupProps {
  type: "success" | "error";
  title: string;
  message: string;
  productName?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  primaryLabel: string;
  secondaryLabel?: string;
}

export default function Popup({
  type,
  title,
  message,
  productName,
  onPrimary,
  onSecondary,
  primaryLabel,
  secondaryLabel,
}: PopupProps) {
  const isSuccess = type === "success";

  return (
    <div className={styles.popupOverlay}>
      <div className={`${styles.popupCard} ${!isSuccess ? styles.popupCardError : ""}`}>
        {/* Sparkles (success only) */}
        {isSuccess && (
          <>
            <span className={styles.sparkle}>✦</span>
            <span className={styles.sparkle}>✦</span>
            <span className={styles.sparkle}>✦</span>
            <span className={styles.sparkle}>✦</span>
          </>
        )}

        {/* Icon ring */}
        <div className={`${styles.popupRing} ${!isSuccess ? styles.popupRingError : ""}`}>
          {isSuccess ? "🎉" : "⚠️"}
        </div>

        {/* Title */}
        <div className={`${styles.popupTitle} ${!isSuccess ? styles.popupTitleError : ""}`}>
          {title}
        </div>

        {/* Product name badge (success) */}
        {isSuccess && productName && (
          <div className={styles.popupProductName}>⚖️ {productName}</div>
        )}

        {/* Message */}
        <div className={styles.popupMessage}>{message}</div>

        {/* Divider */}
        <div className={styles.popupDivider} />

        {/* Actions */}
        <div className={styles.popupActions}>
          {secondaryLabel && onSecondary && (
            <button
              className={`${pageStyles.btn} ${pageStyles.btnOutline}`}
              onClick={onSecondary}
            >
              {secondaryLabel}
            </button>
          )}
          <button
            className={`${pageStyles.btn} ${isSuccess ? pageStyles.btnGold : pageStyles.btnDanger}`}
            onClick={onPrimary}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}