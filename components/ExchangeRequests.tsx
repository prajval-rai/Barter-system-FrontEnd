"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeftRight, Clock, CheckCircle2, XCircle, Package,
  Loader2, RefreshCw, Inbox, Send, AlertCircle,
  Check, X, MessageCircle, ChevronRight, Hash, Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "../styles/Exchangerequests.module.css";
import ProductDetailPage from "./ProductDetail/ProductDetail";

/* ─── Types ── */
interface RequestProduct {
  id: number;
  title: string;
  thumbnail: string | null;
}

interface BarterRequest {
  id: number;
  from_user: string;
  to_user: string;
  request_product: RequestProduct;
  request_for_product: RequestProduct;
  status: "pending" | "accepted" | "rejected" | "completed";
  created_at: string;
}

interface RequestsProps {
  onNavigate: (id: string) => void;
}

/* ─── Helpers ── */
const fmtDate = (iso: string) => {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "var(--amber)",   bg: "rgba(217,119,6,0.09)",  border: "rgba(217,119,6,0.22)",  Icon: Clock        },
  accepted:  { label: "Accepted",  color: "var(--success)", bg: "rgba(22,163,74,0.09)",  border: "rgba(22,163,74,0.22)",  Icon: CheckCircle2 },
  rejected:  { label: "Rejected",  color: "var(--danger)",  bg: "rgba(225,29,72,0.09)",  border: "rgba(225,29,72,0.22)",  Icon: XCircle      },
  completed: { label: "Completed", color: "var(--purple)",  bg: "rgba(124,58,237,0.09)", border: "rgba(124,58,237,0.22)", Icon: CheckCircle2 },
};

/* ─── Funny rotating one-liners shown in the banner ── */
const FUN_LINES = [
  { emoji: "🔄", text: <>No cash? No problem. <strong>Welcome to the vibe economy.</strong></> },
  { emoji: "🤝", text: <>Trading since before Bitcoin was cool. <strong>Way before.</strong></> },
  { emoji: "🧠", text: <>Your clutter is someone else's <strong>treasure (maybe).</strong></> },
  { emoji: "🎲", text: <>Bartering: like shopping, but <strong>with more plot twists.</strong></> },
  { emoji: "🪄", text: <>One person's old headphones = another person's <strong>new jam.</strong></> },
];

/* ─── Product tile (clickable) ── */
function ProductTile({
  product, label, onClick,
}: {
  product: RequestProduct;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={styles.productTile} onClick={onClick} type="button">
      <div className={styles.tileImg}>
        {product.thumbnail
          ? <img src={product.thumbnail} alt={product.title} />
          : <Package size={20} />}
      </div>
      <div className={styles.tileInfo}>
        <span className={styles.tileLabel}>{label}</span>
        <span className={styles.tileTitle}>{product.title}</span>
        <span className={styles.tileHint}>tap to peek →</span>
      </div>
    </button>
  );
}

/* ─── Request card ── */
function RequestCard({
  req, isReceived, onAccept, onReject, accepting, rejecting,
  onNavigate, onProductClick,
}: {
  req: BarterRequest;
  isReceived: boolean;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  accepting: number | null;
  rejecting: number | null;
  onNavigate: (id: string) => void;
  onProductClick: (productId: number) => void;
}) {
  const st           = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
  const counterparty = isReceived ? req.from_user : req.to_user;
  const shortEmail   = counterparty.split("@")[0];
  const initials     = shortEmail.slice(0, 2).toUpperCase();
  const sysMsg       = `Hi! I'd like to exchange my "${req.request_product.title}" for your "${req.request_for_product.title}". Let me know if you're interested!`;
  const isBusy       = accepting === req.id || rejecting === req.id;

  return (
    <div className={styles.card} style={{ animationDelay: `${req.id * 0.04}s` }}>

      {/* Top bar */}
      <div className={styles.cardTop}>
        <div className={styles.cardMeta}>
          <div className={styles.avatarRing}>{initials}</div>
          <div>
            <div className={styles.counterparty}>{shortEmail}</div>
            <div className={styles.timestamp}>{fmtDate(req.created_at)}</div>
          </div>
        </div>
        <div className={styles.cardTopRight}>
          <span className={styles.requestId}><Hash size={9} />{req.id}</span>
          <div
            className={styles.statusPill}
            style={{ color: st.color, background: st.bg, borderColor: st.border } as React.CSSProperties}
          >
            <st.Icon size={11} /> {st.label}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={styles.cardBody}>
        {/* Trade visual */}
        <div className={styles.tradeRow}>
          <ProductTile
            product={req.request_product}
            label="Offering"
            onClick={() => onProductClick(req.request_product.id)}
          />
          <div className={styles.tradeArrow}>
            <ArrowLeftRight size={16} />
          </div>
          <ProductTile
            product={req.request_for_product}
            label="Wants"
            onClick={() => onProductClick(req.request_for_product.id)}
          />
        </div>

        {/* Speech-bubble message */}
        <div className={styles.msgBox}>
          <MessageCircle size={13} className={styles.msgIcon} />
          <p className={styles.msgText}>{sysMsg}</p>
        </div>
      </div>

      {/* Footer */}
      {((isReceived && req.status === "pending") || req.status === "accepted") && (
        <div className={styles.cardFooter}>
          {isReceived && req.status === "pending" && (
            <div className={styles.actions}>
              <button className={styles.acceptBtn} onClick={() => onAccept(req.id)} disabled={isBusy}>
                {accepting === req.id
                  ? <Loader2 size={14} className={styles.spin} />
                  : <Check size={14} />}
                {accepting === req.id ? "Sealing deal…" : "Accept 🤝"}
              </button>
              <button className={styles.rejectBtn} onClick={() => onReject(req.id)} disabled={isBusy}>
                {rejecting === req.id
                  ? <Loader2 size={14} className={styles.spin} />
                  : <X size={14} />}
                {rejecting === req.id ? "Passing…" : "Nope 👋"}
              </button>
            </div>
          )}
          {req.status === "accepted" && (
            <button className={styles.chatBtn} onClick={() => onNavigate("chats")}>
              <MessageCircle size={14} />
              Let's Talk 💬
              <ChevronRight size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════
   MAIN COMPONENT
════════════════════════════ */
export default function ExchangeRequests({ onNavigate }: RequestsProps) {
  const { user } = useAuth();

  const [tab, setTab]             = useState<"received" | "sent">("received");
  const [requests, setRequests]   = useState<BarterRequest[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [accepting, setAccepting] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);
  const [funIdx, setFunIdx]       = useState(0);
  const base_url = process.env.NEXT_PUBLIC_BACKEND_URL

  /* Product detail sheet */
  const [detailProductId, setDetailProductId] = useState<number | null>(null);

  /* Cycle fun banners every 4s */
  useEffect(() => {
    const t = setInterval(() => setFunIdx(i => (i + 1) % FUN_LINES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch( `${base_url}barter/requests/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load requests");
      setRequests(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const received = requests.filter(r => r.to_user   === user?.email);
  const sent     = requests.filter(r => r.from_user === user?.email);
  const pending  = requests.filter(r => r.status === "pending").length;
  const active   = tab === "received" ? received : sent;

  const changeStatus = async (id: number, status: "accepted" | "rejected") => {
    const res = await fetch(`${base_url}barter/request/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || `Failed to ${status}`);
    }
    return res.json();
  };

  const handleAccept = async (id: number) => {
    setAccepting(id);
    try {
      await changeStatus(id, "accepted");
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "accepted" as const } : r));
      showToast("Deal accepted! 🎉 Opening chat…", true);
      setTimeout(() => onNavigate("chats"), 1400);
    } catch (e: any) {
      showToast(e.message || "Failed to accept", false);
    } finally { setAccepting(null); }
  };

  const handleReject = async (id: number) => {
    setRejecting(id);
    try {
      await changeStatus(id, "rejected");
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" as const } : r));
      showToast("Request passed. Their loss! 😅", true);
    } catch (e: any) {
      showToast(e.message || "Failed to decline", false);
    } finally { setRejecting(null); }
  };

  const funLine = FUN_LINES[funIdx];

  return (
    <div className={styles.shell}>

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}>
          {toast.ok ? <Check size={13} /> : <AlertCircle size={13} />}
          {toast.msg}
        </div>
      )}

      {/* Product detail bottom sheet */}
      {detailProductId !== null && (
        <div className={styles.detailOverlay} onClick={() => setDetailProductId(null)}>
          <div className={styles.detailSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.detailPill} />
            <ProductDetailPage
              productId={detailProductId}
              onBack={() => setDetailProductId(null)}
              onNavigate={onNavigate}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}><ArrowLeftRight size={24} /></div>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>
              Exchange Requests <span className={styles.titleEmoji}>🔃</span>
            </h1>
            <p className={styles.subtitle}>// swap stuff · no cash needed · just vibes</p>
          </div>
        </div>
        <button className={styles.refreshBtn} onClick={load} disabled={loading} title="Refresh">
          <RefreshCw size={15} className={loading ? styles.spin : ""} />
        </button>
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "rgba(124,58,237,0.09)" }}>
              <Inbox size={20} style={{ color: "var(--purple)" }} />
            </div>
            <div>
              <div className={styles.statNum}>{received.length}</div>
              <div className={styles.statLabel}>Received</div>
            </div>
            <span className={styles.statMood}>{received.length > 0 ? "🥳" : "😴"}</span>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "rgba(8,145,178,0.09)" }}>
              <Send size={18} style={{ color: "var(--cyan)" }} />
            </div>
            <div>
              <div className={styles.statNum}>{sent.length}</div>
              <div className={styles.statLabel}>Sent</div>
            </div>
            <span className={styles.statMood}>{sent.length > 0 ? "🚀" : "🦗"}</span>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "rgba(217,119,6,0.09)" }}>
              <Clock size={20} style={{ color: "var(--amber)" }} />
            </div>
            <div>
              <div className={styles.statNum}>{pending}</div>
              <div className={styles.statLabel}>Pending</div>
            </div>
            <span className={styles.statMood}>{pending > 0 ? "⏳" : "✅"}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabWrap}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "received" ? styles.tabActive : ""}`}
            onClick={() => setTab("received")}
          >
            <Inbox size={14} /> Received
            {received.length > 0 && <span className={styles.tabBadge}>{received.length}</span>}
          </button>
          <button
            className={`${styles.tab} ${tab === "sent" ? styles.tabActive : ""}`}
            onClick={() => setTab("sent")}
          >
            <Send size={14} /> Sent
            {sent.length > 0 && <span className={styles.tabBadge}>{sent.length}</span>}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>

        {/* Rotating fun banner (only shown when there are items) */}
        {!loading && !error && active.length > 0 && (
          <div className={styles.funBanner}>
            <span className={styles.funBannerEmoji}>{funLine.emoji}</span>
            <span className={styles.funBannerText}>{funLine.text}</span>
            <Zap size={13} style={{ color: "var(--purple)", opacity: 0.5 }} />
          </div>
        )}

        {loading ? (
          <div className={styles.stateBox}>
            <Loader2 size={32} className={styles.spin} style={{ color: "var(--purple)" }} />
            <p className={styles.stateText}>Fetching your deals… hang tight 🕐</p>
          </div>
        ) : error ? (
          <div className={styles.stateBox}>
            <AlertCircle size={32} style={{ color: "var(--danger)" }} />
            <p className={styles.stateTitle}>Oops, something fumbled 🤦</p>
            <p className={styles.stateText}>{error}</p>
            <button className={styles.retryBtn} onClick={load}><RefreshCw size={13} /> Try again</button>
          </div>
        ) : active.length === 0 ? (
          <div className={styles.stateBox}>
            <div className={styles.emptyIconWrap}>
              {tab === "received" ? <Inbox size={32} /> : <Send size={28} />}
            </div>
            <p className={styles.stateTitle}>
              {tab === "received" ? "Nobody's knocked yet 🚪" : "No shots fired yet 🎯"}
            </p>
            <p className={styles.stateText}>
              {tab === "received"
                ? "When someone wants to trade with you, they'll show up here. Try listing something interesting!"
                : "You haven't sent any swap requests yet. Go find something worth trading for!"}
            </p>
            {tab === "sent" && (
              <button className={styles.retryBtn} onClick={() => onNavigate("marketplace")}>
                Browse the Swap Shop <ChevronRight size={13} />
              </button>
            )}
          </div>
        ) : (
          <div className={styles.list}>
            {active.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                isReceived={tab === "received"}
                onAccept={handleAccept}
                onReject={handleReject}
                accepting={accepting}
                rejecting={rejecting}
                onNavigate={onNavigate}
                onProductClick={setDetailProductId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}