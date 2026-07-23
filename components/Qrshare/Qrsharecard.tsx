"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { ScanLine, ArrowLeftRight, Link2 } from "lucide-react";
import styles from "./Qrsharecard.module.css";

interface QRShareCardProps {
  productId: number | string;
  title: string;
  thumbnail?: string;
  price?: string | number;
  category?: string;
  onClose?: () => void;
}

const SITE_URL = "https://www.lenden.co.in";

export default function QRShareCard({
  productId,
  title,
  thumbnail,
  price,
  category,
  onClose,
}: QRShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbFailed, setThumbFailed] = useState(false);

  const productUrl = `${SITE_URL}/products/${productId}`;

  const proxiedThumbnail = thumbnail
    ? `/api/image-proxy?url=${encodeURIComponent(thumbnail)}`
    : undefined;

  async function exportCardAsPng() {
    if (!cardRef.current) throw new Error("Card not ready");
    return toPng(cardRef.current, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: "#ffffff",
    });
  }

  async function handleDownload() {
    setError(null);
    setDownloading(true);
    try {
      const dataUrl = await exportCardAsPng();
      const link = document.createElement("a");
      link.download = `lenden-product-${productId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("QR export failed", err);
      setError("Couldn't generate the image. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    setError(null);
    try {
      const dataUrl = await exportCardAsPng();
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `lenden-product-${productId}.png`, {
        type: "image/png",
      });

      const canShareFiles =
        typeof navigator !== "undefined" &&
        !!navigator.share &&
        !!navigator.canShare?.({ files: [file] });

      if (canShareFiles) {
        await navigator.share({
          files: [file],
          title: `${title} · LenDen`,
          text: `Check out "${title}" on LenDen — ${productUrl}`,
        });
      } else {
        await handleDownload();
      }
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") {
        console.error("Share failed", err);
        setError("Sharing isn't supported here — try Download instead.");
      }
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Couldn't copy the link.");
    }
  }

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Share ${title}`}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}

        {/* ---- Everything inside cardRef is exactly what gets exported as the shared image ---- */}
        <div ref={cardRef} className={styles.card}>
          <div className={styles.cardTexture} aria-hidden="true" />

          <div className={styles.cardHeader}>
            <div className={styles.logo}>
              <span className={styles.logoIconWrap}>
                <ArrowLeftRight size={16} strokeWidth={2.5} />
              </span>
              <span className={styles.logoText}>
                Len<span className={styles.logoAccent}>Den</span>
              </span>
            </div>
            <span className={styles.tag}>
              <ScanLine size={12} strokeWidth={2.5} />
              Scan to Swap
            </span>
          </div>

          <div className={styles.body}>
            <div className={styles.thumbWrap}>
              {proxiedThumbnail && !thumbFailed ? (
                <img
                  src={proxiedThumbnail}
                  alt={title}
                  className={styles.thumb}
                  onError={() => setThumbFailed(true)}
                />
              ) : (
                <div className={styles.thumbFallback}>🖼️</div>
              )}
              {category && <span className={styles.categoryChip}>{category}</span>}
            </div>

            <div className={styles.info}>
              <h3 className={styles.productTitle}>{title}</h3>
              {price !== undefined && price !== null && (
                <p className={styles.price}>₹{price}</p>
              )}
              <p className={styles.cta}>Scan the code to view &amp; swap this item</p>
            </div>
          </div>

          <div className={styles.qrSection}>
            <div className={styles.qrFrame}>
              <span className={`${styles.corner} ${styles.cornerTL}`} />
              <span className={`${styles.corner} ${styles.cornerTR}`} />
              <span className={`${styles.corner} ${styles.cornerBL}`} />
              <span className={`${styles.corner} ${styles.cornerBR}`} />
              <div className={styles.qrGlow} aria-hidden="true" />
              <div className={styles.qrWrap}>
                <QRCodeSVG
                  value={productUrl}
                  size={128}
                  bgColor="#ffffff"
                  fgColor="#0c1b35"
                  level="M"
                />
              </div>
            </div>

            <div className={styles.qrDivider} aria-hidden="true" />

            <p className={styles.url}>
              <Link2 size={12} strokeWidth={2.5} />
              {productUrl.replace("https://", "")}
            </p>
          </div>

          <div className={styles.cardFooter}>
            <span>Swap what you don&apos;t need for what you do.</span>
          </div>
        </div>
        {/* ---- end exported card ---- */}

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={handleShare}>
            Share
          </button>
          <button
            className={styles.secondaryBtn}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? "Saving…" : "Download PNG"}
          </button>
          <button className={styles.secondaryBtn} onClick={handleCopyLink}>
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>
    </div>
  );
}
