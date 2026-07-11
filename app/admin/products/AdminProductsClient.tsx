"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./AdminProducts.module.css";

type Status = "submitted" | "approved" | "closed" | "rejected" | "banned";

interface ListItem {
  id: number;
  title: string;
  description: string;
  category: { id: number; name: string };
  thumbnail: string | null;
  status: Status;
  created_at: string;
  purchase_year: number | null;
  purchase_bill: string | null;
  product_replace_options: any[];
}

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

interface Detail extends Omit<ListItem, "thumbnail"> {
  images: ProductImage[];
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

export default function AdminProductsClient() {
  const [activeTab, setActiveTab]   = useState<Status>("submitted");
  const [items, setItems]           = useState<ListItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail]         = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeImg, setActiveImg]   = useState(0);
  const [actionLoading, setActionLoading] = useState<Status | null>(null);

  const fetchList = useCallback((status: Status) => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/products?status=${status}`)
      .then((r) => {
        if (r.status === 401) { window.location.href = "/login"; return null; }
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => {
        if (data) setItems(Array.isArray(data) ? data : data.results ?? []);
      })
      .catch(() => setError("Could not load products."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchList(activeTab); }, [activeTab, fetchList]);

  const openDetail = (id: number) => {
    setSelectedId(id);
    setDetail(null);
    setActiveImg(0);
    setDetailLoading(true);
    fetch(`/api/admin/products/${id}`)
      .then((r) => {
        if (r.status === 401) { window.location.href = "/login"; return null; }
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => data && setDetail(data))
      .catch(() => setError("Could not load product detail."))
      .finally(() => setDetailLoading(false));
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const changeStatus = async (newStatus: Status) => {
    if (!selectedId) return;
    setActionLoading(newStatus);
    try {
      const res = await fetch(`/api/admin/products/${selectedId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.status === 401) { window.location.href = "/login"; return; }
      if (!res.ok) throw new Error("Failed");

      setDetail((d) => (d ? { ...d, status: newStatus } : d));
      setItems((list) => list.filter((p) => p.id !== selectedId));
      closeDetail();
    } catch {
      setError("Could not update status. Try again.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.title}>Product Moderation</h1>
        <p className={styles.subtitle}>Review, approve, or reject listed items</p>
      </header>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.stateBox}>
          <span className={styles.spinner} />
          <p>Loading listings…</p>
        </div>
      ) : items.length === 0 ? (
        <div className={styles.stateBox}>
          <p>No {activeTab} listings.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((p) => (
            <button
              key={p.id}
              className={styles.card}
              onClick={() => openDetail(p.id)}
            >
              <div className={styles.cardImgWrap}>
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt={p.title} className={styles.cardImg} />
                ) : (
                  <div className={styles.cardImgPlaceholder}>📦</div>
                )}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardBadgeRow}>
                  <span className={styles.categoryBadge}>{p.category?.name}</span>
                  <span className={`${styles.statusBadge} ${STATUS_CLASS[p.status]}`}>
                    {p.status}
                  </span>
                </div>
                <h3 className={styles.cardTitle}>{p.title}</h3>
                <p className={styles.cardDesc}>{p.description}</p>
                <span className={styles.cardDate}>
                  {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedId !== null && (
        <>
          <div className={styles.overlay} onClick={closeDetail} />
          <div className={styles.drawer}>
            <button className={styles.closeBtn} onClick={closeDetail} aria-label="Close">✕</button>

            {detailLoading || !detail ? (
              <div className={styles.stateBox}>
                <span className={styles.spinner} />
                <p>Loading details…</p>
              </div>
            ) : (
              <>
                <div className={styles.gallery}>
                  {detail.images.length > 0 ? (
                    <img
                      src={detail.images[activeImg]?.image}
                      alt={detail.title}
                      className={styles.galleryMain}
                    />
                  ) : (
                    <div className={styles.cardImgPlaceholder}>📦</div>
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
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}