// components/ProductDetail/ProductCTA.tsx
import { Heart, Share2, Repeat2, CheckCircle, Package, Calendar } from "lucide-react";
import styles from "@/styles/Productdetail.module.css";

interface Props {
  isAvail: boolean;
  requestSent: boolean;
  bookmarked: boolean;
  productId: number;
  createdAt: string;
  hasBill: boolean;
  onSendRequest: () => void;
  onToggleBookmark: () => void;
  onShare: () => void;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

export default function ProductCTA({
  isAvail, requestSent, bookmarked, productId, createdAt, hasBill,
  onSendRequest, onToggleBookmark, onShare,
}: Props) {
  return (
    <>
      <div className={styles.ctaBlock}>
        {!requestSent ? (
          <button
            className={styles.ctaPrimary}
            onClick={onSendRequest}
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
          onClick={onToggleBookmark}
        >
          <Heart size={15} fill={bookmarked ? "var(--danger)" : "none"} />
          {bookmarked ? "Saved" : "Save to Wishlist"}
        </button>

        <button className={styles.ctaGhost} onClick={onShare}>
          <Share2 size={14} /> Share Listing
        </button>
      </div>

      <div className={styles.listingMeta}>
        <div className={styles.listingMetaItem}><Package size={11} /><span>Listing #{productId}</span></div>
        <div className={styles.listingMetaItem}><Calendar size={11} /><span>Listed on {fmtDate(createdAt)}</span></div>
        {hasBill && (
          <div className={styles.listingMetaItem}>
            <CheckCircle size={11} color="var(--success)" />
            <span style={{ color: "var(--success)" }}>Purchase bill attached</span>
          </div>
        )}
      </div>
    </>
  );
}