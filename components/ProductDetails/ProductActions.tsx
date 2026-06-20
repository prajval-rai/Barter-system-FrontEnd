'use client';

import { useState } from 'react';
import styles from './ProductActions.module.css';
import ExchangeModal from '@/components/ProductDetails/ExchangeModal';

interface Props {
  productId: number;
  productTitle: string;
  IsBookMarked: boolean;
}

export default function ProductActions({ productId, productTitle, IsBookMarked }: Props) {
  const [saved,        setSaved     ] = useState(IsBookMarked);  // ← init from prop
  const [requested,    setRequested ] = useState(false);
  const [copied,       setCopied    ] = useState(false);
  const [showModal,    setShowModal ] = useState(false);
  const [bookmarking,  setBookmarking] = useState(false);        // ← loading state
  const base_url    = process.env.NEXT_PUBLIC_BACKEND_URL;

const handleSave = async () => {
    if (bookmarking) return;
    setBookmarking(true);

    try {
      const url = saved
        ? `${base_url}products/bookmark/${productId}/remove/`  // ← DELETE if saved
        : `${base_url}products/bookmark/${productId}/`;         // ← POST if not saved

      const res = await fetch(url, {
        method: saved ? 'DELETE' : 'POST',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to toggle bookmark');

      setSaved((prev) => !prev);
    } catch (err) {
      console.error('Bookmark error:', err);
    } finally {
      setBookmarking(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/products/${productId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: productTitle, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // user dismissed share sheet — no-op
    }
  };

  return (
    <div className={styles.actions}>

      {/* Primary CTA */}
      <button
        className={`${styles.btn} ${styles.btnPrimary} ${requested ? styles.btnRequested : ''}`}
        onClick={() => !requested && setShowModal(true)}
        disabled={requested}
      >
        {requested ? (
          <><CheckIcon /> Request Sent</>
        ) : (
          <><SwapIcon /> Send Exchange Request</>
        )}
      </button>

      {/* Secondary row */}
      <div className={styles.secondaryRow}>
        <button
          className={`${styles.btn} ${styles.btnSecondary} ${saved ? styles.btnSaved : ''}`}
          onClick={handleSave}
          disabled={bookmarking}
        >
          {bookmarking ? (
            <SpinnerIcon />
          ) : (
            <HeartIcon filled={saved} />
          )}
          {bookmarking ? 'Saving...' : saved ? 'Saved' : 'Save Item'}
        </button>

        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleShare}>
          <ShareIcon />
          {copied ? 'Link Copied!' : 'Share'}
        </button>
      </div>

      {/* Exchange modal */}
      {showModal && (
        <ExchangeModal
          productId={productId}
          productTitle={productTitle}
          onClose={() => setShowModal(false)}
          onSent={() => {
            setShowModal(false);
            setRequested(true);
          }}
        />
      )}

    </div>
  );
}

/* ── Inline SVG icons ── */
function SwapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4m0 0L3 8m4-4 4 4"/><path d="M17 8v12m0 0 4-4m-4 4-4-4"/>
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}