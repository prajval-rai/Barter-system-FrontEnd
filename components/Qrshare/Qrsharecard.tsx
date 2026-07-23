"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import {
  Scan,
  ShieldCheck,
  Smartphone,
  Lock,
  Sparkles,
  Download,
  Share2,
  Link2,
  Check,
} from "lucide-react";
import styles from "./Qrsharecard.module.css";

interface QRShareCardProps {
  productId: number | string;
  title: string;
  thumbnail?: string;
  price?: string | number;
  description?: string;
  category?: string;
  onClose?: () => void;
}

const SITE_URL = "https://www.lenden.co.in";

export default function QRShareCard({
  productId,
  title,
  thumbnail,
  price,
  description,
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

  const displayDescription =
    description?.trim() ||
    "Great quality, ready to swap. Check it out and connect instantly.";

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

  // ── Opens the native share sheet with the card image attached.
  // On mobile this is where WhatsApp, Instagram, etc. show up as
  // share targets automatically — no per-app integration needed. ──
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
        // Desktop / unsupported browsers: fall back to downloading
        // the image so the user can attach it manually.
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

          {/* ── Header: logo + tagline (top) ── */}
          <div className={styles.headerRow}>
            <div className={styles.logoBlock}>
              <img src="/logo.png" alt="LenDen" className={styles.logoImg} />
              <p className={styles.tagline}>Swap More. Save More.</p>
            </div>

            <div className={styles.headerRight}>
              <span className={styles.scanPill}>
                <Scan size={16} strokeWidth={2.5} />
                Scan to Swap
              </span>
              <p className={styles.microTag}>
                Easy. Quick. Secure. <ShieldCheck size={14} strokeWidth={2.5} />
              </p>
            </div>
          </div>

          {/* ── Product info (top) ── */}
          <div className={styles.productRow}>
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

            <div className={styles.productInfo}>
              <h3 className={styles.productTitle}>{title}</h3>
              <p className={styles.productDesc}>{displayDescription}</p>
              <div className={styles.badgeRow}>
                <span className={styles.qualityBadge}>
                  <ShieldCheck size={14} strokeWidth={2.5} />
                  Quality Checked
                </span>
                {price !== undefined && price !== null && (
                  <span className={styles.priceBadge}>₹{price}</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Steps (top, text content) ── */}
          <div className={styles.stepsSection}>
            <div className={styles.qrRightHeader}>
              <span className={styles.phoneIconWrap}>
                <Smartphone size={20} strokeWidth={2.5} />
              </span>
              <p className={styles.qrHeadline}>
                Point your camera below to <span className={styles.swapWord}>swap!</span>
              </p>
            </div>

            <div className={styles.stepsDivider} />

            <ol className={styles.stepsList}>
              <li className={styles.step}>
                <span className={styles.stepNumber}>1</span>
                <div>
                  <p className={styles.stepTitle}>Scan the QR code</p>
                  <p className={styles.stepDesc}>Open your camera and scan this code.</p>
                </div>
              </li>
              <li className={styles.step}>
                <span className={styles.stepNumber}>2</span>
                <div>
                  <p className={styles.stepTitle}>Open LenDen</p>
                  <p className={styles.stepDesc}>You&apos;ll be redirected to the product page.</p>
                </div>
              </li>
              <li className={styles.step}>
                <span className={styles.stepNumber}>3</span>
                <div>
                  <p className={styles.stepTitle}>Start Swapping</p>
                  <p className={styles.stepDesc}>Connect, chat &amp; swap with ease.</p>
                </div>
              </li>
            </ol>
          </div>

          {/* ── Footer (top, text content) ── */}
          <div className={styles.footerBar}>
            <div className={styles.footerLeft}>
              <span className={styles.lockIconWrap}>
                <Lock size={16} strokeWidth={2.5} />
              </span>
              <div>
                <p className={styles.footerTitle}>Safe &amp; Secure Swaps</p>
                <p className={styles.footerSub}>Your privacy and safety are our priority.</p>
              </div>
            </div>
            <p className={styles.footerRight}>
              <Sparkles size={14} strokeWidth={2.5} />
              Happy Swapping!
            </p>
          </div>

          {/* ── QR panel: bigger, standalone, bottom ── */}
          <div className={styles.qrPanel}>
            <div className={styles.qrFrame}>
              <span className={`${styles.corner} ${styles.cornerTL}`} />
              <span className={`${styles.corner} ${styles.cornerTR}`} />
              <span className={`${styles.corner} ${styles.cornerBL}`} />
              <span className={`${styles.corner} ${styles.cornerBR}`} />
              <div className={styles.qrWrap}>
                <QRCodeSVG
                  value={productUrl}
                  size={220}
                  bgColor="#ffffff"
                  fgColor="#0c1b35"
                  level="M"
                />
              </div>
            </div>
          </div>
        </div>
        {/* ---- end exported card ---- */}

        {error && <p className={styles.errorText}>{error}</p>}

        {/* ── Icon-only action buttons ── */}
        <div className={styles.actions}>
          <button
            className={styles.iconBtn}
            onClick={handleShare}
            aria-label="Share"
            title="Share to WhatsApp, Instagram & more"
          >
            <Share2 size={20} strokeWidth={2.2} />
            <span className={styles.iconBtnLabel}>Share</span>
          </button>

          <button
            className={styles.iconBtn}
            onClick={handleDownload}
            disabled={downloading}
            aria-label="Download image"
            title="Download PNG"
          >
            {downloading ? (
              <span className={styles.miniSpinner} />
            ) : (
              <Download size={20} strokeWidth={2.2} />
            )}
            <span className={styles.iconBtnLabel}>
              {downloading ? "Saving…" : "Download"}
            </span>
          </button>

          <button
            className={styles.iconBtn}
            onClick={handleCopyLink}
            aria-label="Copy link"
            title="Copy product link"
          >
            {copied ? (
              <Check size={20} strokeWidth={2.4} className={styles.iconCheck} />
            ) : (
              <Link2 size={20} strokeWidth={2.2} />
            )}
            <span className={styles.iconBtnLabel}>{copied ? "Copied!" : "Copy Link"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
