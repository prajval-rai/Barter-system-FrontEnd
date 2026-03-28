"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock, CheckCircle, Lock, XCircle, Ban,
  RefreshCw, Search, X, CheckCheck, AlertTriangle,
  Check, Loader2, Package, ChevronRight,
} from "lucide-react";
import styles from "@/styles/Managemarketplace.module.css";
import type { Product } from "./Productcard";
import { ProductModal } from "./Productmodal";
import type { CardAction, StatusMeta } from "./Productcard";

/* ── Types ── */
type StatusFilter = "submitted" | "approved" | "closed" | "rejected" | "banned";
type Action = "ban" | "reject" | "approve";

/* ── Status meta ── */
const STATUS_META: Record<StatusFilter, StatusMeta & { label: string; Icon: React.ElementType }> = {
  submitted: { label: "Submitted", Icon: Clock,       color: "#b45309", bg: "rgba(180,83,9,0.08)",   border: "rgba(180,83,9,0.3)"   },
  approved:  { label: "Approved",  Icon: CheckCircle, color: "#15803d", bg: "rgba(21,128,61,0.08)",  border: "rgba(21,128,61,0.3)"  },
  closed:    { label: "Closed",    Icon: Lock,        color: "#1d4ed8", bg: "rgba(29,78,216,0.08)",  border: "rgba(29,78,216,0.3)"  },
  rejected:  { label: "Rejected",  Icon: XCircle,     color: "#b91c1c", bg: "rgba(185,28,28,0.08)",  border: "rgba(185,28,28,0.3)"  },
  banned:    { label: "Banned",    Icon: Ban,         color: "#6b21a8", bg: "rgba(107,33,168,0.08)", border: "rgba(107,33,168,0.3)" },
};

const ALL_STATUSES: StatusFilter[] = ["submitted", "approved", "closed", "rejected", "banned"];

const getAvailableActions = (status: StatusFilter): Action[] => {
  if (status === "submitted") return ["approve", "reject"];
  if (status === "approved")  return ["ban"];
  return [];
};

/* ── API ── */
const BASE = "http://localhost:8000";

const fetchProducts = async (status: string): Promise<Product[]> => {
  const res = await fetch(`${BASE}/products/admin_products_by_status?status=${status}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
};

const fetchProductImages = async (productId: number): Promise<string[]> => {
  await new Promise(r => setTimeout(r, 800));
  return [
    `https://picsum.photos/seed/product${productId}a/600/400`,
    `https://picsum.photos/seed/product${productId}b/600/400`,
    `https://picsum.photos/seed/product${productId}c/600/400`,
  ];
};

const changeProductStatus = async (id: number, status: "approved" | "rejected" | "banned"): Promise<void> => {
  const res = await fetch(`${BASE}/products/change_product_status/?product_id=${id}&status=${status}`, {
    method: "POST", credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to set status to ${status}`);
};

const CONFIRM_META: Record<Action, { title: string; msg: string; label: string; danger: boolean }> = {
  ban:     { title: "Ban this product?",     msg: "This will remove it from the marketplace.",            label: "Ban It",   danger: true  },
  reject:  { title: "Reject this request?",  msg: "The request will be rejected and seller notified.",    label: "Reject",   danger: true  },
  approve: { title: "Place on marketplace?", msg: "Product will be approved and visible to all traders.", label: "Place It", danger: false },
};

const actionToStatus = (action: Action): "approved" | "rejected" | "banned" => {
  if (action === "approve") return "approved";
  if (action === "reject")  return "rejected";
  return "banned";
};

const fmt = (d?: string) => d
  ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  : "—";

/* ================================================================
   MANAGE MARKETPLACE — sub-panel (no outer header)
================================================================ */
export default function ManageMarketplace() {
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("submitted");
  const [cache, setCache]               = useState<Partial<Record<StatusFilter, Product[]>>>({});
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [busy, setBusy]                 = useState<Record<string, boolean>>({});
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [selected, setSelected]         = useState<Set<number>>(new Set());
  const [search, setSearch]             = useState("");
  const [confirm, setConfirm]           = useState<{ open: boolean; id: number; action: Action }>({
    open: false, id: 0, action: "ban",
  });

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadStatus = useCallback(async (status: StatusFilter, force = false) => {
    if (!force && cache[status] !== undefined) return;
    setLoading(true); setError(null);
    try {
      const data = await fetchProducts(status);
      setCache(p => ({ ...p, [status]: data }));
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [cache]);

  useEffect(() => {
    loadStatus(activeStatus);
    setSelected(new Set());
    setSearch("");
  }, [activeStatus]);

  const handleAction = async (id: number, action: Action) => {
    setBusy(p => ({ ...p, [`${action}_${id}`]: true }));
    try {
      await changeProductStatus(id, actionToStatus(action));
      showToast(
        action === "ban" ? "Product banned." : action === "reject" ? "Product rejected." : "Product approved!",
        true
      );
      setCache(p => {
        const next = { ...p };
        if (next[activeStatus]) next[activeStatus] = next[activeStatus]!.filter(x => x.id !== id);
        delete next[actionToStatus(action) as StatusFilter];
        return next;
      });
      setSelected(s => { const n = new Set(s); n.delete(id); return n; });
      setModalProduct(null);
    } catch (e: any) {
      showToast(e.message || "Action failed.", false);
    } finally {
      setBusy(p => { const n = { ...p }; delete n[`${action}_${id}`]; return n; });
    }
  };

  const availableActions = getAvailableActions(activeStatus);
  const currentProducts  = cache[activeStatus] ?? [];
  const filtered = currentProducts.filter(p =>
    !search ||
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    String(p.id).includes(search)
  );

  const allSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));
  const toggleAll   = () => setSelected(allSelected ? new Set() : new Set(filtered.map(p => p.id)));
  const toggleRow   = (id: number) => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const buildModalActions = (): CardAction[] => {
    const defs: Record<Action, CardAction> = {
      reject: {
        label: "Reject", busyLabel: "Loading…", variant: "danger", flex: 1,
        onClick: (p) => setConfirm({ open: true, id: p.id, action: "reject" }),
        isBusy: (p) => !!busy[`reject_${p.id}`],
        isDisabled: (p) => !!busy[`reject_${p.id}`] || !!busy[`approve_${p.id}`],
      },
      approve: {
        label: "Approve", busyLabel: "Loading…", variant: "success", flex: 2,
        onClick: (p) => setConfirm({ open: true, id: p.id, action: "approve" }),
        isBusy: (p) => !!busy[`approve_${p.id}`],
        isDisabled: (p) => !!busy[`approve_${p.id}`] || !!busy[`reject_${p.id}`],
      },
      ban: {
        label: "Ban", busyLabel: "Loading…", variant: "danger", flex: 1,
        onClick: (p) => setConfirm({ open: true, id: p.id, action: "ban" }),
        isBusy: (p) => !!busy[`ban_${p.id}`],
        isDisabled: (p) => !!busy[`ban_${p.id}`],
      },
    };
    return availableActions.map(a => defs[a]);
  };

  const meta = STATUS_META[activeStatus];
  const confirmMeta = CONFIRM_META[confirm.action];

  return (
    <>
      {/* Product modal */}
      {modalProduct && (
        <ProductModal
          product={modalProduct}
          statusMeta={STATUS_META[activeStatus]}
          fetchImages={fetchProductImages}
          onClose={() => setModalProduct(null)}
          actions={buildModalActions()}
        />
      )}

      {/* Confirm dialog */}
      {confirm.open && (
        <div className={styles.overlay} onClick={() => setConfirm(p => ({ ...p, open: false }))}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()}>
            <div className={`${styles.dialogIcon} ${confirmMeta.danger ? styles.dialogIconDanger : styles.dialogIconSuccess}`}>
              {confirmMeta.danger
                ? <AlertTriangle size={28} />
                : <CheckCircle size={28} />}
            </div>
            <h3 className={styles.dialogTitle}>{confirmMeta.title}</h3>
            <p className={styles.dialogMsg}>{confirmMeta.msg}</p>
            <div className={styles.dialogActions}>
              <button className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => setConfirm(p => ({ ...p, open: false }))}>
                Cancel
              </button>
              <button
                className={`${styles.btn} ${confirmMeta.danger ? styles.btnDanger : styles.btnSuccess}`}
                onClick={async () => {
                  const { id, action } = confirm;
                  setConfirm(p => ({ ...p, open: false }));
                  await handleAction(id, action);
                }}
              >
                {confirm.action === "ban"     && <Ban size={13} />}
                {confirm.action === "reject"  && <XCircle size={13} />}
                {confirm.action === "approve" && <CheckCircle size={13} />}
                {confirmMeta.label}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}>
          {toast.ok ? <Check size={14} /> : <X size={14} />}
          {toast.msg}
        </div>
      )}

      <div className={styles.shell}>

        {/* ── Status tabs + refresh ── */}
        <div className={styles.tabsRow}>
          <div className={styles.tabs}>
            {ALL_STATUSES.map(s => {
              const m = STATUS_META[s];
              const count = cache[s]?.length ?? null;
              const active = activeStatus === s;
              return (
                <button key={s} onClick={() => setActiveStatus(s)}
                  className={`${styles.tab} ${active ? styles.tabActive : ""}`}
                  style={active ? { color: m.color, borderColor: m.color, background: m.bg } as React.CSSProperties : {}}>
                  <m.Icon size={13} />
                  <span>{m.label}</span>
                  {count !== null && (
                    <span className={styles.tabBadge}
                      style={active ? { background: m.color, color: "#fff" } as React.CSSProperties : {}}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button className={`${styles.btn} ${styles.btnRefresh}`}
            onClick={() => loadStatus(activeStatus, true)} disabled={loading}>
            <RefreshCw size={13} className={loading ? styles.spinIcon : ""} />
            Refresh
          </button>
        </div>

        {/* ── Toolbar ── */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={13} className={styles.searchIcon} />
            <input className={styles.search}
              placeholder="Search by name or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)} />
            {search && (
              <button className={styles.clearSearch} onClick={() => setSearch("")}>
                <X size={11} />
              </button>
            )}
          </div>

          <div className={styles.toolbarRight}>
            {selected.size > 0 && availableActions.length > 0 && (
              <div className={styles.bulkBar}>
                <span className={styles.bulkCount}>{selected.size} selected</span>
                {availableActions.includes("approve") && (
                  <button className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSm}`}
                    onClick={async () => { for (const id of selected) await handleAction(id, "approve"); }}>
                    <CheckCheck size={12} /> Approve All
                  </button>
                )}
                {availableActions.includes("reject") && (
                  <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                    onClick={async () => { for (const id of selected) await handleAction(id, "reject"); }}>
                    <XCircle size={12} /> Reject All
                  </button>
                )}
                {availableActions.includes("ban") && (
                  <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                    onClick={async () => { for (const id of selected) await handleAction(id, "ban"); }}>
                    <Ban size={12} /> Ban All
                  </button>
                )}
              </div>
            )}
            <span className={styles.countLabel}>
              {loading
                ? "Loading…"
                : `${filtered.length} of ${currentProducts.length} product${currentProducts.length !== 1 ? "s" : ""}`}
            </span>
          </div>
        </div>

        {/* ── Table ── */}
        <div className={styles.tableWrap}>
          {loading ? (
            <div className={styles.skeletonWrap}>
              {[1,2,3,4,5].map(i => (
                <div key={i} className={styles.skeletonRow} style={{ animationDelay: `${i * 0.07}s` }} />
              ))}
            </div>
          ) : error ? (
            <div className={styles.stateBox}>
              <div className={styles.stateIcon}><AlertTriangle size={44} /></div>
              <p className={styles.stateTitle}>Failed to load</p>
              <p className={styles.stateMsg}>{error}</p>
              <button className={`${styles.btn} ${styles.btnRefresh}`}
                onClick={() => loadStatus(activeStatus, true)}>
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.stateBox}>
              <div className={styles.stateIcon}>
                {search ? <Search size={44} /> : <Package size={44} />}
              </div>
              <p className={styles.stateTitle}>
                {search ? "No results" : `No ${meta.label.toLowerCase()} products`}
              </p>
              <p className={styles.stateMsg}>
                {search ? `Nothing matched "${search}"` : "Products with this status will appear here."}
              </p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr className={styles.thead}>
                  {availableActions.length > 0 && (
                    <th className={styles.thCheck}>
                      <input type="checkbox" className={styles.checkbox}
                        checked={allSelected} onChange={toggleAll} />
                    </th>
                  )}
                  <th className={styles.th}>ID</th>
                  <th className={styles.th}>Product</th>
                  <th className={styles.th}>Category</th>
                  <th className={styles.th}>Price</th>
                  <th className={styles.th}>Seller</th>
                  <th className={styles.th}>Submitted</th>
                  {availableActions.length > 0 && (
                    <th className={`${styles.th} ${styles.thActions}`}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, idx) => {
                  const isBusy = availableActions.some(a => busy[`${a}_${product.id}`]);
                  const isSelected = selected.has(product.id);
                  return (
                    <tr key={product.id}
                      className={`${styles.row} ${isSelected ? styles.rowSelected : ""} ${isBusy ? styles.rowBusy : ""}`}
                      style={{ animationDelay: `${idx * 0.03}s` }}>

                      {availableActions.length > 0 && (
                        <td className={styles.tdCheck}
                          onClick={e => { e.stopPropagation(); toggleRow(product.id); }}>
                          <input type="checkbox" className={styles.checkbox}
                            checked={isSelected} onChange={() => toggleRow(product.id)} />
                        </td>
                      )}

                      <td className={styles.td}>
                        <span className={styles.idBadge}>#{product.id}</span>
                      </td>

                      <td className={styles.td}>
                        <button className={styles.productName} onClick={() => setModalProduct(product)}>
                          {product.title || "Untitled product"}
                        </button>
                        {product.description && (
                          <p className={styles.productDesc}>{product.description}</p>
                        )}
                      </td>

                      <td className={styles.td}>
  {product.category
    ? <span className={styles.catPill}>
        {typeof product.category === "object"
          ? (product.category as any).name
          : product.category}
      </span>
    : <span className={styles.dash}>—</span>}
</td>

                      <td className={styles.td}>
                        <span className={styles.price}>
                          {product.price != null ? `₹${Number(product.price).toLocaleString()}` : "—"}
                        </span>
                      </td>

                      <td className={styles.td}>
                        <span className={styles.seller}>
                          {product.seller_name ?? product.seller_id ?? "—"}
                        </span>
                      </td>

                      <td className={styles.td}>
                        <span className={styles.date}>{fmt(product.created_at)}</span>
                      </td>

                      {availableActions.length > 0 && (
                        <td className={styles.tdActions}>
                          <div className={styles.actionGroup}>
                            {isBusy ? (
                              <Loader2 size={15} className={styles.spinIcon} />
                            ) : (
                              <>
                                {availableActions.includes("approve") && (
                                  <button className={`${styles.actionBtn} ${styles.actionApprove}`}
                                    onClick={() => setConfirm({ open: true, id: product.id, action: "approve" })}
                                    title="Approve">
                                    <CheckCircle size={12} /> Approve
                                  </button>
                                )}
                                {availableActions.includes("reject") && (
                                  <button className={`${styles.actionBtn} ${styles.actionReject}`}
                                    onClick={() => setConfirm({ open: true, id: product.id, action: "reject" })}
                                    title="Reject">
                                    <XCircle size={12} /> Reject
                                  </button>
                                )}
                                {availableActions.includes("ban") && (
                                  <button className={`${styles.actionBtn} ${styles.actionBan}`}
                                    onClick={() => setConfirm({ open: true, id: product.id, action: "ban" })}
                                    title="Ban">
                                    <Ban size={12} /> Ban
                                  </button>
                                )}
                                <button className={`${styles.actionBtn} ${styles.actionView}`}
                                  onClick={() => setModalProduct(product)}
                                  title="View details">
                                  Details <ChevronRight size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}