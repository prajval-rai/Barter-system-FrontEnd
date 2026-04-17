// components/ProductDetail/ProductGallery.tsx
import { useState } from "react";
import {
  ChevronLeft, ChevronRight, Maximize2, ImageIcon,
  ShieldCheck, BookOpen, Eye, X,
} from "lucide-react";
import styles from "@/styles/Productdetail.module.css";

interface ProductImage { id: number; image: string; created_at: string; product: number; }

interface Props {
  images: ProductImage[];
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  StatusIcon: React.ElementType;
  hasBill: boolean;
  daysAgo: number;
}

export default function ProductGallery({
  images, statusLabel, statusColor, statusBg, StatusIcon, hasBill, daysAgo,
}: Props) {
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox]   = useState(false);

  const srcs  = images.map(i => i.image);
  const count = srcs.length;

  const prev = () => setActiveImg(i => (i - 1 + count) % count);
  const next = () => setActiveImg(i => (i + 1) % count);

  return (
    <>
      {/* ── Lightbox ── */}
      {lightbox && count > 0 && (
        <div className={styles.lightboxOverlay} onClick={() => setLightbox(false)}>
          <button className={styles.lightboxClose} onClick={() => setLightbox(false)}>
            <X size={20} />
          </button>
          <button className={styles.lightboxPrev} onClick={e => { e.stopPropagation(); prev(); }}>
            <ChevronLeft size={24} />
          </button>
          <img
            src={srcs[activeImg]}
            alt=""
            className={styles.lightboxImg}
            onClick={e => e.stopPropagation()}
          />
          <button className={styles.lightboxNext} onClick={e => { e.stopPropagation(); next(); }}>
            <ChevronRight size={24} />
          </button>
          <div className={styles.lightboxDots}>
            {srcs.map((_, i) => (
              <div
                key={i}
                className={`${styles.lightboxDot} ${i === activeImg ? styles.lightboxDotActive : ""}`}
                onClick={e => { e.stopPropagation(); setActiveImg(i); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Gallery column ── */}
      <div className={styles.galleryCol}>

        {/* Main image */}
        <div className={styles.mainImgWrap} onClick={() => count > 0 && setLightbox(true)}>
          {count > 0 ? (
            <>
              <img src={srcs[activeImg]} alt="" className={styles.mainImg} />
              <button className={styles.expandBtn}><Maximize2 size={14} /></button>
              {count > 1 && (
                <>
                  <button className={styles.galleryPrev} onClick={e => { e.stopPropagation(); prev(); }}>
                    <ChevronLeft size={18} />
                  </button>
                  <button className={styles.galleryNext} onClick={e => { e.stopPropagation(); next(); }}>
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

          {/* Status overlay */}
          <div
            className={styles.statusOverlay}
            style={{ color: statusColor, background: statusBg, borderColor: statusColor + "33" } as React.CSSProperties}
          >
            <StatusIcon size={11} /> {statusLabel}
          </div>
        </div>

        {/* Thumbnail strip */}
        {count > 1 && (
          <div className={styles.thumbRow}>
            {srcs.map((src, i) => (
              <div
                key={i}
                className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ""}`}
                onClick={() => setActiveImg(i)}
              >
                <img src={src} alt="" />
              </div>
            ))}
          </div>
        )}

        {/* Trust badges */}
        <div className={styles.trustRow}>
          <div className={styles.trustBadge}>
            <ShieldCheck size={13} color="var(--success)" /><span>Verified listing</span>
          </div>
          {hasBill && (
            <div className={styles.trustBadge}>
              <BookOpen size={13} color="var(--cyan)" /><span>Bill available</span>
            </div>
          )}
          <div className={styles.trustBadge}>
            <Eye size={13} color="var(--text-muted)" />
            <span>Listed {daysAgo === 0 ? "today" : `${daysAgo}d ago`}</span>
          </div>
        </div>

      </div>
    </>
  );
}