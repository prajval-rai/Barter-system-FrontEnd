"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import styles from "./QRShareCard.module.css";

interface QRShareCardProps {
  productId: number | string;
  title: string;
  thumbnail?: string;
  price?: string | number;
  onClose?: () => void;
}

const SITE_URL = "https://www.lenden.co.in";

export default function QRShareCard({
  productId,
  title,
  thumbnail,
  price,
  onClose,
}: QRShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbFailed, setThumbFailed] = useState(false);

  const productUrl = `${SITE_URL}/products/${productId}`;

  // Routed through a same-origin proxy so the browser doesn't block it
  // (no CORS headers on the original host) and so html-to-image can
  // actually embed it into the exported PNG.
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
        // Desktop / unsupported browsers: fall back to download
        await handleDownload();
      }
    } catch (err) {
      // AbortError fires when the user just cancels the native share sheet
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

        {/* ---- This block is exactly what gets exported as the shared image ---- */}
        <div ref={cardRef} className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.logo}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 2l4 4-4 4" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <path d="M7 22l-4-4 4-4" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              <span className={styles.logoText}>
                Len<span className={styles.logoAccent}>Den</span>
              </span>
            </div>
            <span className={styles.tag}>Scan to Swap</span>
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
            </div>

            <div className={styles.info}>
              <h3 className={styles.productTitle}>{title}</h3>
              {price !== undefined && price !== null && (
                <p className={styles.price}>₹{price}</p>
              )}
            </div>
          </div>

          <div className={styles.qrRow}>
            <div className={styles.qrWrap}>
              <QRCodeSVG
                value={productUrl}
                size={104}
                bgColor="#ffffff"
                fgColor="#0c1b35"
                level="M"
              />
            </div>
            <div className={styles.qrHint}>
              <span className={styles.qrHintTitle}>Point your camera here</span>
              <span className={styles.url}>{productUrl.replace("https://", "")}</span>
            </div>
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
