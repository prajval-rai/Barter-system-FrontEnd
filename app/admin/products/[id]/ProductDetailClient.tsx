"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../AdminProducts.module.css";

type Status = "submitted" | "approved" | "closed" | "rejected" | "banned";

interface ProductImage {
  id: number;
  image: string;
  created_at: string;
  product: number;
}

interface Owner {
  id: number;
  contact_number: string;
  address: string;
  rating: number | null;
  description: string | null;
}

interface Detail {
  id: number;
  title: string;
  description: string;
  category: { id: number; name: string };
  images: ProductImage[];
  status: Status;
  created_at: string;
  purchase_year: number | null;
  purchase_bill: string | null;
  product_replace_options: any[];
  owner: Owner;
  is_bookmarked: boolean;
}

const TABS: { key: Status; label: string }[] = [
  { key: "submitted", label: "Submitted" },
  { key: "approved",  label: "Approved" },
  { key: "closed",    label: "Closed" },
  { key: "rejected",  label: "Rejected" },
  { key: "banned",    label: "Banned" },
];

const STATUS_CLASS: Record<Status, string> = {
  submitted: styles.badgeSubmitted,
  approved:  styles.badgeApproved,
  closed:    styles.badgeClosed,
  rejected:  styles.badgeRejected,
  banned:    styles.badgeBanned,
};

export default function ProductDetailClient({ productId }: { productId: string }) {
  const router = useRouter();

  const [detail, setDetail]         = useState<Detail | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [activeImg, setActiveImg]   = useState(0);
  const [actionLoading, setActionLoading] = useState<Status | null>(null);
  const [toast, setToast]           = useState<string | null>(null);

  const fetchDetail = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/products/${productId}`)
      .then((r) => {
        if (r.status === 401) { window.location.href = "/login"; return null; }
        if (r.status === 404) throw new Error("not_found");
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => data && setDetail(data))
      .catch((e) => setError(e.message === "not_found" ? "Product not found." : "Could not load product."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDetail(); /* eslint-disable-next-line */ }, [productId]);

  const changeStatus = async (newStatus: Status) => {
    setActionLoading(newStatus);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.status === 401) { window.location.href = "/login"; return; }
      if (res.status === 403) { setError("You are not allowed to change status."); return; }
      if (!res.ok) throw new Error("Failed");

      setDetail((d) => (d ? { ...d, status: newStatus } : d));
      setToast(`Marked as ${newStatus}`);
      setTimeout(() => setToast(null), 2500);
    } catch {
      setError("Could not update status. Try again.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.stateBox}>
          <span className={styles.spinner} />
          <p>Loading product…</p>
        </div>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.stateBox}>
          <p>{error}</p>
          <button className={styles.actionBtn} onClick={() => router.push("/admin/products")}>
            Back to list
          </button>
        </div>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.closeBtn}
        style={{ marginBottom: 16 }}
        onClick={() => router.push("/admin/products")}
        aria-label="Back"
      >
        ←
      </button>

      {toast && <div className={styles.errorBanner} style={{ background: "#F0FDF4", borderColor: "#86EFAC", color: "#15803D" }}>{toast}</div>}
      {error && <div className={styles.errorBanner}>{error}</div>}

      <div style={{ maxWidth: 640 }}>
        <div className={styles.gallery}>
          {detail.images.length > 0 ? (
            <img
              src={detail.images[activeImg]?.image}
              alt={detail.title}
              className={styles.galleryMain}
              style={{ height: 320 }}
            />
          ) : (
            <div className={styles.cardImgPlaceholder} style={{ height: 320 }}>📦</div>
          )}
          {detail.images.length > 1 && (
            <div className={styles.thumbRow}>
              {detail.images.map((img, i) => (
                <img
                  key={img.id}
                  src={img.image}
                  onClick={() => setActiveImg(i)}
                  className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ""}`}
                  alt=""
                />
              ))}
            </div>
          )}
        </div>

        <div className={styles.drawerBadgeRow}>
          <span className={styles.categoryBadge}>{detail.category?.name}</span>
          <span className={`${styles.statusBadge} ${STATUS_CLASS[detail.status]}`}>
            {detail.status}
          </span>
        </div>

        <h2 className={styles.drawerTitle}>{detail.title}</h2>

        <div className={styles.metaRow}>
          <div>
            <span className={styles.metaLabel}>Purchase Year</span>
            <span className={styles.metaValue}>{detail.purchase_year ?? "—"}</span>
          </div>
          <div>
            <span className={styles.metaLabel}>Bill Available</span>
            <span className={styles.metaValue}>{detail.purchase_bill ? "Yes" : "No"}</span>
          </div>
          <div>
            <span className={styles.metaLabel}>Listed</span>
            <span className={styles.metaValue}>
              {new Date(detail.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <h4 className={styles.sectionLabel}>Description</h4>
        <p className={styles.description}>{detail.description}</p>

        <h4 className={styles.sectionLabel}>Owner</h4>
        <div className={styles.ownerBox}>
          <span className={styles.ownerName}>Owner #{detail.owner.id}</span>
          <span className={styles.ownerAddress}>📍 {detail.owner.address}</span>
          {detail.owner.rating != null && (
            <span className={styles.ownerRating}>⭐ {detail.owner.rating}</span>
          )}
        </div>

        <h4 className={styles.sectionLabel}>Change status</h4>
        <div className={styles.actionRow}>
          {TABS.filter((t) => t.key !== detail.status).map((t) => (
            <button
              key={t.key}
              className={`${styles.actionBtn} ${styles[`action_${t.key}`]}`}
              disabled={actionLoading !== null}
              onClick={() => changeStatus(t.key)}
            >
              {actionLoading === t.key ? "…" : t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}