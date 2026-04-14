"use client";

import {
  useState, useEffect, useRef, useCallback, useReducer, memo,
} from "react";
import {
  MessageCircle, ArrowLeftRight, Package, Send, Loader2, RefreshCw,
  ChevronLeft, AlertCircle, Check, CheckCheck, Trophy,
  Lock, Sparkles, Ghost, MoreVertical, X, ShieldAlert, XCircle,
  Star, Copy, CheckCircle, HandshakeIcon, Clock, Inbox, Image, Video,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ProductDetailPage from "@/components/ProductDetail";
import styles from "../styles/Chat.module.css";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface RequestProduct { id: number; title: string; thumbnail: string | null; }
interface AcceptedRequest {
  id: number; from_user: string; to_user: string;
  request_product: RequestProduct; request_for_product: RequestProduct;
  status: "accepted" | "completed" | "cancelled" | "fraud"; created_at: string;
  last_message?:        string | null;
  last_message_time?:   string | null;
  last_message_sender?: string | null;
  unread_count?:        number;
}
interface BarterRequest {
  id: number; from_user: string; to_user: string;
  request_product: RequestProduct; request_for_product: RequestProduct;
  status: "pending" | "accepted" | "rejected" | "completed";
  created_at: string;
}
interface MediaAttachment {
  id: string; type: "image" | "video"; file: File;
  previewUrl: string; uploading?: boolean; uploadedUrl?: string;
}
interface Message {
  id: string; text: string; sender: string; created_at: string;
  seen: boolean; isSystem?: boolean; pending?: boolean; pendingKey?: string;
  media?: { type: "image" | "video"; url: string }[];
}
interface ChatMeta {
  unread: number;
  lastMsg: string;
  lastTime: string;
  lastSender: string;
}

type SidebarItem =
  | { kind: "chat";    data: AcceptedRequest }
  | { kind: "request"; data: BarterRequest };

type MsgAction =
  | { type: "HISTORY";    msgs: Message[] }
  | { type: "OPTIMISTIC"; msg: Message }
  | { type: "CONFIRM";    pendingKey: string; confirmed: Message }
  | { type: "ADD";        msg: Message }
  | { type: "SEEN_ONE";   id: string }
  | { type: "SEEN_ALL" };

interface MsgState { ids: Set<string>; pendingKeys: Set<string>; list: Message[]; }
const emptyMsgState = (): MsgState => ({ ids: new Set(), pendingKeys: new Set(), list: [] });

function msgReducer(s: MsgState, a: MsgAction): MsgState {
  switch (a.type) {
    case "HISTORY":
      return { ids: new Set(a.msgs.map(m => m.id)), pendingKeys: new Set(), list: a.msgs };
    case "OPTIMISTIC": {
      if (s.pendingKeys.has(a.msg.pendingKey!)) return s;
      return { ...s, pendingKeys: new Set([...s.pendingKeys, a.msg.pendingKey!]), list: [...s.list, a.msg] };
    }
    case "CONFIRM": {
      if (s.ids.has(a.confirmed.id)) {
        const newPK = new Set(s.pendingKeys); newPK.delete(a.pendingKey);
        return { ...s, pendingKeys: newPK, list: s.list.filter(m => !(m.pending && m.pendingKey === a.pendingKey)) };
      }
      const idx = s.list.findIndex(m => m.pending && m.pendingKey === a.pendingKey);
      const newIds = new Set([...s.ids, a.confirmed.id]);
      const newPK  = new Set(s.pendingKeys); newPK.delete(a.pendingKey);
      if (idx === -1) return { ids: newIds, pendingKeys: newPK, list: [...s.list, a.confirmed] };
      const next = [...s.list]; next[idx] = a.confirmed;
      return { ids: newIds, pendingKeys: newPK, list: next };
    }
    case "ADD": {
      if (s.ids.has(a.msg.id)) return s;
      return { ...s, ids: new Set([...s.ids, a.msg.id]), list: [...s.list, a.msg] };
    }
    case "SEEN_ONE": {
      const idx = s.list.findIndex(m => m.id === a.id);
      if (idx === -1 || s.list[idx].seen) return s;
      const next = [...s.list]; next[idx] = { ...next[idx], seen: true };
      return { ...s, list: next };
    }
    case "SEEN_ALL":
      if (s.list.every(m => m.seen)) return s;
      return { ...s, list: s.list.map(m => m.seen ? m : { ...m, seen: true }) };
    default: return s;
  }
}

/* ─────────────────────────────────────────
   CONSTANTS & HELPERS
───────────────────────────────────────── */
const BASE       = "http://localhost:8000";
const MAX_IMAGES = 4;
const MAX_VIDEO  = 1;

const QUIPS = [
  "This chat is retired like a sports jersey 🏅 No sending. No receiving. Just vibes.",
  "Deal's done. This chat has left the building 🕶️",
  "🔒 Archived. The items have physically left. Probably.",
  "Trade sealed. This conversation is now a museum exhibit 🏛️",
];
const randomQuip   = () => QUIPS[Math.floor(Math.random() * QUIPS.length)];
const fmtTime      = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
const fmtDateLabel = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today"; if (d === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long" });
};
const fmtAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};
const initials  = (e: string) => e.slice(0, 2).toUpperCase();
const isSameDay = (a: string, b: string) =>
  new Date(a).toDateString() === new Date(b).toDateString();
const uid      = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const truncate = (s: string, n = 38) => s.length > n ? s.slice(0, n) + "…" : s;

/* ─────────────────────────────────────────
   WS TOKEN
───────────────────────────────────────── */
async function fetchWsToken(): Promise<string | null> {
  try {
    const r = await fetch(`${BASE}/accounts/ws-token/`, { credentials: "include" });
    if (!r.ok) return null;
    return (await r.json()).token ?? null;
  } catch { return null; }
}

/* ─────────────────────────────────────────
   BROWSER NOTIFICATION HELPER
───────────────────────────────────────── */
async function requestNotifPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

function showBrowserNotif(title: string, body: string, icon?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return; // only when tab is hidden
  new Notification(title, { body, icon: icon ?? "/favicon.ico", tag: "trade-chat" });
}

/* ─────────────────────────────────────────
   CHAT SOCKET HOOK
───────────────────────────────────────── */
interface SocketCbs {
  onMessage:  (msg: Message, pendingKey?: string) => void;
  onHistory:  (msgs: Message[]) => void;
  onPresence: (online: boolean) => void;
  onSeenAck:  (id: string) => void;
  onAllSeen:  () => void;
}

function useChatSocket(
  requestId: number | null,
  userEmail: string | undefined,
  isLocked: boolean,
  cbs: SocketCbs,
) {
  const wsRef      = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const cbRef      = useRef(cbs);
  useEffect(() => { cbRef.current = cbs; });

  const connect = useCallback(async () => {
    if (!requestId || !userEmail) return;
    if (wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
       wsRef.current.readyState === WebSocket.CONNECTING)) return;
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    const token = await fetchWsToken();
    const qs    = token ? `?token=${encodeURIComponent(token)}` : "";
    const ws    = new WebSocket(`ws://localhost:8000/ws/chat/${requestId}/${qs}`);
    wsRef.current = ws;
    ws.onopen  = () => { if (mountedRef.current) setConnected(true); };
    ws.onmessage = (e) => {
      if (!mountedRef.current) return;
      const d = JSON.parse(e.data);
      if (d.type === "history")
        cbRef.current.onHistory(d.messages.map((m: any) => ({
          id: String(m.id), text: m.text, sender: m.sender_email,
          created_at: m.created_at, seen: m.seen ?? false, media: m.media ?? [],
        })));
      else if (d.type === "message")
        cbRef.current.onMessage({
          id: String(d.id), text: d.text, sender: d.sender_email,
          created_at: d.created_at, seen: d.seen ?? false, media: d.media ?? [],
        }, d.pending_key ?? undefined);
      else if (d.type === "presence") cbRef.current.onPresence(d.status === "online");
      else if (d.type === "seen_ack") cbRef.current.onSeenAck(String(d.message_id));
      else if (d.type === "all_seen") cbRef.current.onAllSeen();
    };
    ws.onerror  = () => {};
    ws.onclose  = () => {
      if (!mountedRef.current) return;
      setConnected(false); cbRef.current.onPresence(false);
      if (!isLocked) reconnRef.current = setTimeout(connect, 3000);
    };
  }, [requestId, userEmail, isLocked]);

  useEffect(() => {
    mountedRef.current = true; connect();
    return () => {
      mountedRef.current = false;
      if (reconnRef.current) clearTimeout(reconnRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [connect]);

  const sendWs   = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify(payload));
  }, []);
  const sendSeen = useCallback((mid: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify({ type: "seen", message_id: mid }));
  }, []);
  return { connected, sendWs, sendSeen };
}

/* ─────────────────────────────────────────
   MEDIA UPLOAD (dummy)
───────────────────────────────────────── */
async function uploadMediaDummy(file: File): Promise<string> {
  return new Promise(resolve =>
    setTimeout(() => resolve(URL.createObjectURL(file)), 800 + Math.random() * 600),
  );
}

/* ─────────────────────────────────────────
   PRODUCT THUMBNAIL
───────────────────────────────────────── */
function ProductThumb({ product, imgClassName, emptyClassName, onProductClick }: {
  product: RequestProduct; imgClassName?: string;
  emptyClassName?: string; onProductClick?: (id: number) => void;
}) {
  const handleClick = (e: React.MouseEvent) => { e.stopPropagation(); onProductClick?.(product.id); };
  return product.thumbnail ? (
    <img src={product.thumbnail} alt={product.title} className={imgClassName}
      onClick={handleClick} title={`View ${product.title}`}
      style={{ cursor: "pointer", transition: "opacity 0.15s, transform 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.opacity = "0.78"; e.currentTarget.style.transform = "scale(1.07)"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
    />
  ) : (
    <div className={emptyClassName} onClick={handleClick} title={`View ${product.title}`} style={{ cursor: "pointer" }}>
      <Package size={14} />
    </div>
  );
}

/* ─────────────────────────────────────────
   PRODUCT DETAIL MODAL
───────────────────────────────────────── */
function ProductModal({ productId, onClose }: { productId: number; onClose: () => void; }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 4000, background: "rgba(0,0,0,0.45)",
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
    }} onClick={onClose}>
      <div style={{
        background: "var(--bg-page, #fff)", borderRadius: 20, width: "100%",
        maxWidth: 900, maxHeight: "90vh", overflowY: "auto", position: "relative",
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: "sticky", top: 12, float: "right", marginRight: 12, zIndex: 10,
          width: 34, height: 34, borderRadius: 9, border: "1px solid rgba(0,0,0,0.1)",
          background: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#555",
        }} title="Close (Esc)"><X size={16} /></button>
        <ProductDetailPage productId={productId} onBack={onClose} onNavigate={(_id: string) => {}} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MEDIA GRID
───────────────────────────────────────── */
function MediaGrid({ media }: { media: { type: "image" | "video"; url: string }[] }) {
  const images = media.filter(m => m.type === "image");
  const videos = media.filter(m => m.type === "video");
  return (
    <div className={styles.mediaGrid}>
      {images.length > 0 && (
        <div className={styles.imgGrid} data-count={Math.min(images.length, 4)}>
          {images.slice(0, 4).map((m, i) => (
            <a key={i} href={m.url} target="_blank" rel="noopener noreferrer">
              <img src={m.url} alt={`attachment-${i}`} className={styles.gridImg} />
              {i === 3 && images.length > 4 && <div className={styles.moreOverlay}>+{images.length - 4}</div>}
            </a>
          ))}
        </div>
      )}
      {videos.map((m, i) => <video key={i} src={m.url} controls className={styles.videoAttach} />)}
    </div>
  );
}

/* ─────────────────────────────────────────
   ATTACH PREVIEW STRIP
───────────────────────────────────────── */
function AttachStrip({ attachments, onRemove }: { attachments: MediaAttachment[]; onRemove: (id: string) => void; }) {
  if (attachments.length === 0) return null;
  return (
    <div className={styles.attachStrip}>
      {attachments.map(a => (
        <div key={a.id} className={styles.attachThumb}>
          {a.type === "image" ? <img src={a.previewUrl} alt="" /> : <video src={a.previewUrl} muted />}
          <span className={styles.attachTypeBadge}>{a.type === "image" ? "IMG" : "VID"}</span>
          {a.uploading && <div className={styles.attachUploadingRing} />}
          <button className={styles.attachRemove} onClick={() => onRemove(a.id)}><X size={9} /></button>
        </div>
      ))}
      <div className={styles.attachCount}>
        {attachments.filter(a => a.type === "image").length}/{MAX_IMAGES} imgs
        {attachments.some(a => a.type === "video") ? " · 1/1 vid" : ""}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   RATING MODAL
───────────────────────────────────────── */
function RatingModal({ req, userEmail, onDone }: { req: AcceptedRequest; userEmail: string; onDone: () => void; }) {
  const [rating, setRating] = useState(0); const [hover, setHover] = useState(0);
  const [review, setReview] = useState(""); const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);
  const otherUser = req.from_user === userEmail ? req.to_user : req.from_user;
  const labels    = ["", "Terrible 😬", "Bad 😕", "Okay 😐", "Good 😊", "Excellent 🤩"];
  const submit    = async () => {
    if (rating === 0) return; setLoading(true);
    try {
      await fetch(`${BASE}/barter/rate/${req.id}/`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ rating, review, rated_user: otherUser }),
      });
      setDone(true); setTimeout(onDone, 1800);
    } catch { setLoading(false); }
  };
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBox} style={{ maxWidth: 420 }}>
        {done ? (
          <div className={styles.modalDone}>
            <div className={styles.modalDoneIcon}>⭐</div>
            <h3>Thanks for rating!</h3><p>Your feedback helps build trust in the community.</p>
          </div>
        ) : (
          <>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon} style={{ background: "#fef3c7" }}>⭐</div>
              <div>
                <h3 className={styles.modalTitle}>Rate this trade</h3>
                <p className={styles.modalSub}>How was your experience with <b>{otherUser.split("@")[0]}</b>?</p>
              </div>
            </div>
            <div className={styles.starsRow}>
              {[1,2,3,4,5].map(n => (
                <button key={n} className={styles.starBtn}
                  onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}>
                  <Star size={36} fill={(hover || rating) >= n ? "#f59e0b" : "none"}
                    color={(hover || rating) >= n ? "#f59e0b" : "#d1d5db"} strokeWidth={1.5} />
                </button>
              ))}
            </div>
            <p className={styles.ratingLabel}>{labels[hover || rating]}</p>
            <textarea className={styles.reviewInput} placeholder="Leave a short review (optional)…"
              value={review} onChange={e => setReview(e.target.value)} rows={3} />
            <div className={styles.modalActions}>
              <button className={`${styles.btn} ${styles.btnOutline}`} onClick={onDone}>Skip</button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={submit} disabled={rating === 0 || loading}>
                {loading ? <Loader2 size={14} className={styles.spin} /> : <Star size={14} />} Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   OTP MODAL
───────────────────────────────────────── */
function OtpModal({ req, userEmail, onComplete, onClose }: {
  req: AcceptedRequest; userEmail: string; onComplete: () => void; onClose: () => void;
}) {
  const isInitiator = req.from_user === userEmail;
  const [otp, setOtp]         = useState<string | null>(null);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [copied, setCopied]   = useState(false);
  useEffect(() => {
    if (!isInitiator) return; setLoading(true);
    fetch(`${BASE}/chat/request/${req.id}/otp/generate/`, { method: "POST", credentials: "include" })
      .then(r => r.json()).then(d => { setOtp(d.otp); setLoading(false); })
      .catch(() => { setError("Failed to generate OTP"); setLoading(false); });
  }, [isInitiator, req.id]);
  const copyOtp = () => {
    if (!otp) return; navigator.clipboard.writeText(otp);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  const submitOtp = async () => {
    if (!input.trim()) return; setLoading(true); setError(null);
    try {
      const res  = await fetch(`${BASE}/chat/request/${req.id}/otp/verify/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ otp: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Invalid OTP. Try again."); setLoading(false); return; }
      onComplete();
    } catch { setError("Network error. Try again."); setLoading(false); }
  };
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBox} style={{ maxWidth: 400 }}>
        <button className={styles.modalClose} onClick={onClose}><X size={16} /></button>
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon} style={{ background: "#dcfce7" }}>
            <CheckCircle size={22} color="#16a34a" />
          </div>
          <div>
            <h3 className={styles.modalTitle}>Complete the Deal</h3>
            <p className={styles.modalSub}>{isInitiator ? "Share this OTP with the other party." : "Enter the OTP from the other party."}</p>
          </div>
        </div>
        {isInitiator ? (
          loading ? <div className={styles.otpLoading}><Loader2 size={24} className={styles.spin} /><span>Generating OTP…</span></div>
            : otp ? (
              <div className={styles.otpDisplay}>
                <div className={styles.otpCode}>{otp}</div>
                <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={copyOtp}>
                  {copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "Copied!" : "Copy OTP"}
                </button>
                <p className={styles.otpHint}>⚠️ Share only with your trade partner. Valid for 10 minutes.</p>
              </div>
            ) : <p className={styles.otpErr}>{error}</p>
        ) : (
          <div className={styles.otpEntry}>
            <input className={styles.otpInput} placeholder="Enter OTP from other party"
              value={input} maxLength={8}
              onChange={e => setInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && submitOtp()} />
            {error && <p className={styles.otpErr}>{error}</p>}
            <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ width: "100%" }}
              onClick={submitOtp} disabled={!input.trim() || loading}>
              {loading ? <Loader2 size={14} className={styles.spin} /> : <CheckCircle size={14} />} Confirm Trade
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   DEAL ACTIONS MENU
───────────────────────────────────────── */
function DealActionsMenu({ onCompleteDeal, onCancelDeal, onFraudDeal, onClose }: {
  req: AcceptedRequest; userEmail: string;
  onCompleteDeal: () => void; onCancelDeal: () => void; onFraudDeal: () => void; onClose: () => void;
}) {
  return (
    <div className={styles.actionsOverlay} onClick={onClose}>
      <div className={styles.actionsMenu} onClick={e => e.stopPropagation()}>
        <div className={styles.actionsHeader}>Deal Options</div>
        <button className={`${styles.actionItem} ${styles.actionGreen}`} onClick={() => { onClose(); onCompleteDeal(); }}>
          <div className={styles.actionIcon} style={{ background: "#dcfce7" }}><HandshakeIcon size={18} color="#16a34a" /></div>
          <div className={styles.actionText}><span>Complete Deal</span><small>Verify with OTP and close the trade</small></div>
          <CheckCircle size={16} color="#16a34a" />
        </button>
        <button className={`${styles.actionItem} ${styles.actionRed}`} onClick={() => { onClose(); onCancelDeal(); }}>
          <div className={styles.actionIcon} style={{ background: "#fee2e2" }}><XCircle size={18} color="#dc2626" /></div>
          <div className={styles.actionText}><span>Cancel Deal</span><small>Back out — both items return to listings</small></div>
        </button>
        <button className={`${styles.actionItem} ${styles.actionAmber}`} onClick={() => { onClose(); onFraudDeal(); }}>
          <div className={styles.actionIcon} style={{ background: "#fef3c7" }}><ShieldAlert size={18} color="#d97706" /></div>
          <div className={styles.actionText}><span>Mark as Fraud</span><small>Report this trade as suspicious</small></div>
        </button>
        <button className={styles.actionCancel} onClick={onClose}>Dismiss</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   CONFIRM DIALOG
───────────────────────────────────────── */
function ConfirmDialog({ title, body, confirmLabel, confirmColor, loading, onConfirm, onCancel }: {
  title: string; body: string; confirmLabel: string; confirmColor: string;
  loading: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBox} style={{ maxWidth: 360 }}>
        <h3 className={styles.modalTitle} style={{ marginBottom: 10 }}>{title}</h3>
        <p className={styles.modalSub} style={{ marginBottom: 22 }}>{body}</p>
        <div className={styles.modalActions}>
          <button className={`${styles.btn} ${styles.btnOutline}`} onClick={onCancel} disabled={loading}>Cancel</button>
          <button className={styles.btn} style={{ background: confirmColor, color: "#fff" }} onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 size={14} className={styles.spin} /> : null}{confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PENDING REQUEST CARD
───────────────────────────────────────── */
function PendingRequestCard({ req, isReceived, accepting, rejecting, onAccept, onReject, onProductClick }: {
  req: BarterRequest; isReceived: boolean;
  accepting: number | null; rejecting: number | null;
  onAccept: (id: number) => void; onReject: (id: number) => void;
  onProductClick: (id: number) => void;
}) {
  const counterparty = isReceived ? req.from_user : req.to_user;
  const shortName    = counterparty.split("@")[0];
  const inits        = shortName.slice(0, 2).toUpperCase();
  const isBusy       = accepting === req.id || rejecting === req.id;
  return (
    <div className={`${styles.pendingCard} ${isBusy ? styles.pendingCardBusy : ""}`}>
      <div className={styles.pendingCardAccent} />
      <div className={styles.pendingCardHeader}>
        <div className={styles.pendingAvatar}>{inits}</div>
        <div className={styles.pendingMeta}>
          <span className={styles.pendingName}>{shortName}</span>
          <span className={styles.pendingTime}>{fmtAgo(req.created_at)}</span>
        </div>
        <div className={styles.pendingBadge}><Clock size={9} /> Pending</div>
      </div>
      <div className={styles.pendingTradeRow}>
        <div className={styles.pendingProduct}>
          <ProductThumb product={req.request_product} imgClassName={styles.pendingProductImg} emptyClassName={styles.pendingProductEmpty} onProductClick={onProductClick} />
          <span>{req.request_product.title}</span>
        </div>
        <div className={styles.pendingSwapIcon}><ArrowLeftRight size={11} /></div>
        <div className={styles.pendingProduct}>
          <ProductThumb product={req.request_for_product} imgClassName={styles.pendingProductImg} emptyClassName={styles.pendingProductEmpty} onProductClick={onProductClick} />
          <span>{req.request_for_product.title}</span>
        </div>
      </div>
      {isReceived ? (
        <div className={styles.pendingActions}>
          <button className={styles.pendingAccept} onClick={() => onAccept(req.id)} disabled={isBusy}>
            {accepting === req.id ? <Loader2 size={12} className={styles.spin} /> : <Check size={12} />}
            {accepting === req.id ? "Accepting…" : "Accept 🤝"}
          </button>
          <button className={styles.pendingReject} onClick={() => onReject(req.id)} disabled={isBusy}>
            {rejecting === req.id ? <Loader2 size={12} className={styles.spin} /> : <X size={12} />}
            {rejecting === req.id ? "Passing…" : "Nope 👋"}
          </button>
        </div>
      ) : (
        <div className={styles.pendingSentLabel}><Send size={10} /> Waiting for their response…</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   SEEN TICK
───────────────────────────────────────── */
const SeenTick = memo(function SeenTick({ seen, pending }: { seen: boolean; pending?: boolean }) {
  if (pending) return <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>⏱</span>;
  return (
    <CheckCheck size={12} style={{ color: seen ? "#60a5fa" : "rgba(255,255,255,0.5)", transition: "color 0.3s ease", flexShrink: 0 }} />
  );
});

/* ─────────────────────────────────────────
   MESSAGE BUBBLE
───────────────────────────────────────── */
const MessageBubble = memo(function MessageBubble({ msg, isMe, showAvatar, showDate, isLocked, userEmail, registerSeenObserver }: {
  msg: Message; isMe: boolean; showAvatar: boolean; showDate: boolean;
  isLocked: boolean; userEmail: string;
  registerSeenObserver: (el: HTMLElement | null, msg: Message) => void;
}) {
  return (
    <div>
      {showDate && (
        <div className={styles.dateDivider}>
          <span className={styles.dateDividerLabel}>{fmtDateLabel(msg.created_at)}</span>
        </div>
      )}
      <div
        className={`${styles.msgRow} ${isMe ? styles.msgRowMe : ""} ${msg.isSystem ? styles.msgRowSystem : ""} ${msg.pending ? styles.msgRowPending : ""}`}
        ref={el => registerSeenObserver(el, msg)}
        data-msg-id={msg.id} data-sender={msg.sender}
      >
        {!isMe && !msg.isSystem && (
          showAvatar ? <div className={styles.msgAvatar}>{initials(msg.sender)}</div>
            : <div className={styles.msgAvatarSpacer} />
        )}
        <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : msg.isSystem ? styles.bubbleSystem : styles.bubbleThem} ${isLocked ? styles.bubbleFaded : ""}`}>
          {msg.media && msg.media.length > 0 && <MediaGrid media={msg.media} />}
          {msg.text && <div className={styles.bubbleText}>{msg.text}</div>}
          <div className={styles.bubbleTime}>
            {fmtTime(msg.created_at)}
            {isMe && <SeenTick seen={msg.seen} pending={msg.pending} />}
          </div>
        </div>
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────
   COMPLETED BANNER
───────────────────────────────────────── */
function CompletedBanner({ req, onProductClick }: { req: AcceptedRequest; onProductClick: (id: number) => void; }) {
  const [quip] = useState(randomQuip);
  const [boom, setBoom] = useState(true);
  useEffect(() => { const t = setTimeout(() => setBoom(false), 3200); return () => clearTimeout(t); }, []);
  return (
    <div className={styles.completedBanner}>
      {boom && (
        <div className={styles.confettiWrap} aria-hidden>
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className={styles.confettiPiece} style={{
              left: `${5 + Math.random() * 90}%`, animationDelay: `${Math.random() * 0.6}s`,
              width: `${6 + Math.random() * 6}px`, height: `${6 + Math.random() * 6}px`,
              background: ["#7c3aed","#f59e0b","#10b981","#ef4444","#3b82f6","#8b5cf6","#fbbf24"][i % 7],
            }} />
          ))}
        </div>
      )}
      <div className={styles.completedTrophy}>🏆</div>
      <div className={styles.completedBadgeRow}><span className={styles.completedBadge}><Trophy size={11} />Trade Complete</span></div>
      <h3 className={styles.completedTitle}>This trade is sealed in history!</h3>
      <p className={styles.completedQuip}>{quip}</p>
      <div className={styles.completedTradeRow}>
        <div className={styles.completedProduct}>
          <ProductThumb product={req.request_product} imgClassName={styles.completedThumb} emptyClassName={styles.completedThumbEmpty} onProductClick={onProductClick} />
          <span>{req.request_product.title}</span>
        </div>
        <span className={styles.completedArrow}>⇌</span>
        <div className={styles.completedProduct}>
          <ProductThumb product={req.request_for_product} imgClassName={styles.completedThumb} emptyClassName={styles.completedThumbEmpty} onProductClick={onProductClick} />
          <span>{req.request_for_product.title}</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   LOCKED INPUT BAR
───────────────────────────────────────── */
function LockedInputBar() {
  const [wiggle, setWiggle] = useState(false); const [count, setCount] = useState(0);
  const jokes = ["Nice try 😏","Still no 😄","Persistence! But still no 🙅","Still locked 🔒","LEGENDARY CLICKING 🤣"];
  const doClick = () => { setWiggle(true); setCount(c => c + 1); setTimeout(() => setWiggle(false), 500); };
  return (
    <div className={styles.lockedBar}>
      <div className={`${styles.lockedInner} ${wiggle ? styles.wiggle : ""}`} onClick={doClick}>
        <Lock size={14} className={styles.lockIcon} />
        <div className={styles.lockedText}>
          <span>Chat is archived — trade complete 🎖️</span>
          <span className={styles.lockedHint}>{count === 0 ? "Click me if you dare 😏" : jokes[Math.min(count - 1, jokes.length - 1)]}</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   CHAT INPUT BAR
───────────────────────────────────────── */
function ChatInputBar({ connected, onSend }: { connected: boolean; onSend: (text: string, media: MediaAttachment[]) => void; }) {
  const [text, setText]               = useState("");
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const vidInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageCount  = attachments.filter(a => a.type === "image").length;
  const videoCount  = attachments.filter(a => a.type === "video").length;
  const canSend     = (text.trim().length > 0 || attachments.length > 0) && connected;
  const autoResize  = () => {
    const el = textareaRef.current; if (!el) return;
    el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 100) + "px";
  };
  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - imageCount; if (remaining <= 0) return;
    Array.from(files).slice(0, remaining).forEach(file => {
      const id = uid(); const url = URL.createObjectURL(file);
      setAttachments(prev => [...prev, { id, type: "image", file, previewUrl: url }]);
    });
  };
  const handleVideo = (files: FileList | null) => {
    if (!files || !files[0] || videoCount >= MAX_VIDEO) return;
    const file = files[0]; const id = uid(); const url = URL.createObjectURL(file);
    setAttachments(prev => [...prev, { id, type: "video", file, previewUrl: url }]);
  };
  const removeAttachment = (id: string) => {
    setAttachments(prev => { const a = prev.find(x => x.id === id); if (a) URL.revokeObjectURL(a.previewUrl); return prev.filter(x => x.id !== id); });
  };
  const submit = () => {
    if (!canSend) return;
    onSend(text.trim(), attachments);
    setText(""); setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };
  return (
    <div className={styles.inputArea}>
      <AttachStrip attachments={attachments} onRemove={removeAttachment} />
      <div className={styles.inputRow}>
        <button className={styles.attachBtn} title={imageCount >= MAX_IMAGES ? "Max 4 images" : "Attach images"} onClick={() => imgInputRef.current?.click()} disabled={imageCount >= MAX_IMAGES}>
          <Image size={15} />{imageCount > 0 && <span className={styles.attachBadge}>{imageCount}</span>}
        </button>
        <input ref={imgInputRef} type="file" accept="image/*" multiple hidden onChange={e => { handleImages(e.target.files); e.target.value = ""; }} />
        <button className={styles.attachBtn} title={videoCount >= MAX_VIDEO ? "Max 1 video" : "Attach a video"} onClick={() => vidInputRef.current?.click()} disabled={videoCount >= MAX_VIDEO}>
          <Video size={15} />{videoCount > 0 && <span className={styles.attachBadge}>1</span>}
        </button>
        <input ref={vidInputRef} type="file" accept="video/*" hidden onChange={e => { handleVideo(e.target.files); e.target.value = ""; }} />
        <textarea ref={textareaRef} className={styles.inputField}
          placeholder={connected ? "Type a message…" : "Reconnecting…"} value={text} disabled={!connected} rows={1}
          onChange={e => { setText(e.target.value); autoResize(); }}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} />
        <button className={styles.sendBtn} onClick={submit} disabled={!canSend}>
          {connected ? <Send size={15} /> : <Loader2 size={15} className={styles.spin} />}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   CHAT VIEW
───────────────────────────────────────── */
type Modal = "none" | "actions" | "otp" | "cancel_confirm" | "fraud_confirm" | "rating";

function ChatView({
  req, userEmail, onDealAction, onBack, otherOnline, onOtherOnline,
  onProductClick, onIncomingMessage, onHistoryPreview, onMarkRead,
}: {
  req: AcceptedRequest; userEmail: string;
  onDealAction: (action: "completed" | "cancelled" | "fraud") => void;
  onBack: () => void; otherOnline: boolean; onOtherOnline: (v: boolean) => void;
  onProductClick: (id: number) => void;
  onIncomingMessage: (reqId: number, msg: Message) => void;
  onHistoryPreview:  (reqId: number, msg: Message) => void;
  onMarkRead: (reqId: number) => void;
}) {
  const [msgState, dispatch] = useReducer(msgReducer, undefined, emptyMsgState);
  const [modal, setModal]    = useState<Modal>("none");
  const [actionLoading, setActionLoading] = useState(false);
  const endRef  = useRef<HTMLDivElement>(null);
  const boxRef  = useRef<HTMLDivElement>(null);

  const isCompleted = req.status === "completed";
  const isLocked    = req.status !== "accepted";
  const messages    = msgState.list;

  // Clear unread badge when chat opens
  useEffect(() => { onMarkRead(req.id); }, [req.id, onMarkRead]);

  const onMessage = useCallback((msg: Message, pk?: string) => {
    dispatch(pk ? { type: "CONFIRM", pendingKey: pk, confirmed: msg } : { type: "ADD", msg });
    // Only notify parent for real incoming messages (not our own confirms)
    if (!pk) onIncomingMessage(req.id, msg);
  }, [req.id, onIncomingMessage]);

  // ── History: update preview only, never increment unread ──────────────────
  const onHistory = useCallback((msgs: Message[]) => {
    dispatch({ type: "HISTORY", msgs });
    if (msgs.length > 0) onHistoryPreview(req.id, msgs[msgs.length - 1]);
  }, [req.id, onHistoryPreview]);

  const onPresence = useCallback((v: boolean) => onOtherOnline(v), [onOtherOnline]);
  const onSeenAck  = useCallback((id: string) => dispatch({ type: "SEEN_ONE", id }), []);
  const onAllSeen  = useCallback(() => dispatch({ type: "SEEN_ALL" }), []);

  const { connected, sendWs, sendSeen } = useChatSocket(
    req.id, userEmail, isLocked,
    { onMessage, onHistory, onPresence, onSeenAck, onAllSeen },
  );

  const prevLenRef = useRef(0);
  useEffect(() => {
    if (messages.length === prevLenRef.current) return;
    prevLenRef.current = messages.length;
    const box = boxRef.current; if (!box) return;
    if (box.scrollHeight - box.scrollTop - box.clientHeight < 150)
      endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    observerRef.current = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const msgId = el.dataset.msgId; const sender = el.dataset.sender;
        if (msgId && sender && sender !== userEmail)
          { sendSeen(msgId); observerRef.current?.unobserve(el); }
      });
    }, { threshold: 0.5 });
    return () => observerRef.current?.disconnect();
  }, [userEmail, sendSeen]);

  const registerSeenObserver = useCallback((el: HTMLElement | null, msg: Message) => {
    if (!el || msg.sender === userEmail || msg.seen || isLocked || msg.pending) return;
    observerRef.current?.observe(el);
  }, [userEmail, isLocked]);

  const handleSend = useCallback(async (text: string, attachments: MediaAttachment[]) => {
    const pk = `pk-${uid()}`; const now = new Date().toISOString();
    const optimisticMedia = attachments.map(a => ({ type: a.type, url: a.previewUrl }));
    const optimistic: Message = { id: pk, text, sender: userEmail, created_at: now, seen: false, pending: true, pendingKey: pk, media: optimisticMedia };
    dispatch({ type: "OPTIMISTIC", msg: optimistic });
    // Update sidebar preview immediately (won't increment unread since it's our own message)
    onIncomingMessage(req.id, { ...optimistic, pending: false });
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    const uploadedMedia = await Promise.all(attachments.map(async a => ({ type: a.type, url: await uploadMediaDummy(a.file) })));
    sendWs({ type: "message", text, pending_key: pk, media: uploadedMedia });
  }, [userEmail, sendWs, req.id, onIncomingMessage]);

  const patchDeal = async (status: "cancelled" | "fraud") => {
    setActionLoading(true);
    try {
      const res = await fetch(`${BASE}/barter/request/${req.id}/`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      onDealAction(status);
    } catch { setActionLoading(false); }
  };

  const handleOtpComplete = () => { setModal("rating"); onDealAction("completed"); };
  const otherUser = req.from_user === userEmail ? req.to_user : req.from_user;

  return (
    <>
      {modal === "actions" && <DealActionsMenu req={req} userEmail={userEmail} onCompleteDeal={() => setModal("otp")} onCancelDeal={() => setModal("cancel_confirm")} onFraudDeal={() => setModal("fraud_confirm")} onClose={() => setModal("none")} />}
      {modal === "otp"     && <OtpModal req={req} userEmail={userEmail} onComplete={handleOtpComplete} onClose={() => setModal("none")} />}
      {modal === "cancel_confirm" && <ConfirmDialog title="Cancel this deal?" body="Both items will return to active listings and this chat will be archived. This cannot be undone." confirmLabel="Yes, Cancel Deal" confirmColor="#dc2626" loading={actionLoading} onConfirm={() => patchDeal("cancelled")} onCancel={() => setModal("none")} />}
      {modal === "fraud_confirm"  && <ConfirmDialog title="Report as Fraud?" body="This will flag the trade for review. Only use if the other party is acting fraudulently." confirmLabel="Yes, Report Fraud" confirmColor="#d97706" loading={actionLoading} onConfirm={() => patchDeal("fraud")} onCancel={() => setModal("none")} />}
      {modal === "rating"  && <RatingModal req={req} userEmail={userEmail} onDone={() => setModal("none")} />}

      {/* ── Header ── */}
      <div className={styles.chatHeader}>
        <button className={styles.backBtn} onClick={onBack}><ChevronLeft size={18} /></button>
        <div className={styles.headerAvatarWrap}>
          <div className={`${styles.headerAvatar} ${isCompleted ? styles.headerAvatarCompleted : ""}`}>
            {isCompleted ? "🏆" : initials(otherUser)}
          </div>
          {!isLocked && <span className={styles.headerOnlineDot} style={{ background: otherOnline ? "#10b981" : "#f87171" }} />}
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.headerName}>
            {otherUser.split("@")[0]}
            {isCompleted && <span className={styles.completedPill}><Trophy size={10} />Done</span>}
            {req.status === "cancelled" && <span className={styles.cancelledPill}><XCircle size={10} />Cancelled</span>}
            {req.status === "fraud"     && <span className={styles.fraudPill}><ShieldAlert size={10} />Fraud</span>}
          </div>
          <div className={styles.headerSub}>
            {isLocked
              ? <><Lock size={10} style={{ marginRight: 4 }} />Archived · read-only</>
              : <><span className={styles.connDot} style={{ background: otherOnline ? "#10b981" : "#f87171" }} />{otherOnline ? "Online" : "Offline"}</>}
          </div>
        </div>
        {!isLocked && <button className={styles.moreBtn} onClick={() => setModal("actions")} title="Deal options"><MoreVertical size={18} /></button>}
        {isCompleted && <button className={`${styles.btn} ${styles.btnSm} ${styles.btnOutline}`} onClick={() => setModal("rating")} style={{ flexShrink: 0 }}><Star size={13} /> Rate</button>}
      </div>

      {/* ── Trade banner ── */}
      <div className={`${styles.tradeBanner} ${isCompleted ? styles.tradeBannerCompleted : ""}`}>
        <div className={styles.bannerProduct}>
          <ProductThumb product={req.request_product} imgClassName={styles.bannerThumb} emptyClassName={styles.bannerThumbEmpty} onProductClick={onProductClick} />
          <span>{req.request_product.title}</span>
        </div>
        <div className={styles.bannerArrow}><ArrowLeftRight size={13} /></div>
        <div className={styles.bannerProduct}>
          <ProductThumb product={req.request_for_product} imgClassName={styles.bannerThumb} emptyClassName={styles.bannerThumbEmpty} onProductClick={onProductClick} />
          <span>{req.request_for_product.title}</span>
        </div>
        {isCompleted && <div className={styles.bannerCompletedTag}><Trophy size={11} />Deal Sealed</div>}
      </div>

      {isCompleted && <CompletedBanner req={req} onProductClick={onProductClick} />}

      {/* ── Messages ── */}
      <div className={styles.messages} ref={boxRef}>
        {messages.length === 0 && !isLocked && <div className={styles.noMessages}>Say hello to kick off the trade 👋</div>}
        {messages.length === 0 && isLocked  && (
          <div className={styles.noMessages}><Ghost size={20} style={{ opacity: 0.5, marginRight: 6 }} />No messages were sent… ghosted your own trade 👻</div>
        )}
        {messages.map((msg, idx) => {
          const isMe       = msg.sender === userEmail;
          const prev       = messages[idx - 1];
          const showAvatar = !isMe && !msg.isSystem && (!prev || prev.sender !== msg.sender || !!prev.isSystem);
          const showDate   = !prev || !isSameDay(prev.created_at, msg.created_at);
          return <MessageBubble key={msg.id} msg={msg} isMe={isMe} showAvatar={showAvatar} showDate={showDate} isLocked={isLocked} userEmail={userEmail} registerSeenObserver={registerSeenObserver} />;
        })}
        <div ref={endRef} />
      </div>

      {isLocked ? <LockedInputBar /> : <ChatInputBar connected={connected} onSend={handleSend} />}
    </>
  );
}

/* ─────────────────────────────────────────
   CHAT LIST ITEM
───────────────────────────────────────── */
function ChatListItem({ req, other, isActive, isDone, isOnline, unread, lastMsg, lastTime, lastSender, userEmail, onSelect, onProductClick }: {
  req: AcceptedRequest; other: string;
  isActive: boolean; isDone: boolean; isOnline: boolean;
  unread: number; lastMsg: string; lastTime: string; lastSender: string;
  userEmail: string;
  onSelect: () => void; onProductClick: (id: number) => void;
}) {
  const hasUnread   = unread > 0 && !isActive;
  const previewText = lastMsg
    ? (lastSender === userEmail ? `You: ${lastMsg}` : lastMsg)
    : "Start the conversation…";
  const previewTime = lastTime || req.created_at;

  return (
    <button
      className={`${styles.chatItem} ${isActive ? styles.chatItemActive : ""} ${isDone ? styles.chatItemDone : ""} ${hasUnread ? styles.chatItemUnread : ""}`}
      onClick={onSelect}
    >
      {isDone && <div className={styles.chatItemDoneStripe} />}

      <div className={styles.chatItemAvatarWrap}>
        <div className={`${styles.chatItemAvatar} ${isDone ? styles.chatItemAvatarDone : ""}`}>
          {req.status === "completed" ? "🏆"
            : req.status === "cancelled" ? "❌"
            : req.status === "fraud"     ? "🚨"
            : initials(other)}
        </div>
        {!isDone && isOnline && <span className={styles.onlineDot} />}
      </div>

      <div className={styles.chatItemBody}>
        {/* Row 1: name + badge + time */}
        <div className={styles.chatItemTop}>
          <span className={`${styles.chatItemName} ${hasUnread ? styles.chatItemNameBold : ""}`}>
            {other.split("@")[0]}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {req.status === "completed"
              ? <span className={styles.chatItemDoneBadge}><Trophy size={9} />Done</span>
              : req.status === "cancelled"
              ? <span className={styles.chatItemCancelledBadge}><XCircle size={9} />Cancelled</span>
              : req.status === "fraud"
              ? <span className={styles.chatItemFraudBadge}><ShieldAlert size={9} />Fraud</span>
              : <span className={styles.chatItemActiveBadge}><Sparkles size={9} />Active</span>}
            <span className={`${styles.chatItemTime} ${hasUnread ? styles.chatItemTimeUnread : ""}`}>
              {fmtAgo(previewTime)}
            </span>
          </div>
        </div>

        {/* Row 2: preview + unread badge */}
        <div className={styles.chatItemPreviewRow}>
          <span className={`${styles.chatItemPreview} ${hasUnread ? styles.chatItemPreviewBold : ""}`}>
            {lastMsg === "__media__"
              ? <><Image size={10} style={{ flexShrink: 0, marginRight: 3 }} />Photo</>
              : previewText}
          </span>
          {hasUnread && (
            <span className={styles.chatItemUnreadBadge}>
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>

        {/* Row 3: trade products */}
        <div className={styles.chatItemTrade}>
          <span className={styles.chatItemProduct}>
            <ProductThumb product={req.request_product} imgClassName={styles.chatItemProductImg} emptyClassName={styles.chatItemProductEmpty} onProductClick={onProductClick} />
            {req.request_product.title}
          </span>
          <ArrowLeftRight size={9} style={{ color: "var(--purple)", flexShrink: 0 }} />
          <span className={styles.chatItemProduct}>
            <ProductThumb product={req.request_for_product} imgClassName={styles.chatItemProductImg} emptyClassName={styles.chatItemProductEmpty} onProductClick={onProductClick} />
            {req.request_for_product.title}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────
   ROOT COMPONENT
───────────────────────────────────────── */
export default function Chats() {
  const { user } = useAuth();

  const [requests, setRequests]             = useState<AcceptedRequest[]>([]);
  const [chatLoading, setChatLoading]       = useState(true);
  const [chatError, setChatError]           = useState<string | null>(null);
  const [selected, setSelected]             = useState<AcceptedRequest | null>(null);
  const [online, setOnline]                 = useState<Record<number, boolean>>({});
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [filter, setFilter]                 = useState<"all" | "active" | "completed">("all");
  const [barterRequests, setBarterRequests] = useState<BarterRequest[]>([]);
  const [accepting, setAccepting]           = useState<number | null>(null);
  const [rejecting, setRejecting]           = useState<number | null>(null);
  const [toast, setToast]                   = useState<{ msg: string; ok: boolean } | null>(null);
  const [productModalId, setProductModalId] = useState<number | null>(null);
  const [chatMeta, setChatMeta]             = useState<Record<number, ChatMeta>>({});

  // Request browser notification permission on mount
  useEffect(() => { requestNotifPermission(); }, []);

  const handleProductClick = useCallback((id: number) => setProductModalId(id), []);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 4000);
  };

  // Stable ref to selected so callbacks don't go stale
  const selectedRef = useRef<AcceptedRequest | null>(null);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // Stable ref to requests list (for looking up chat names in notifs)
  const requestsRef = useRef<AcceptedRequest[]>([]);
  useEffect(() => { requestsRef.current = requests; }, [requests]);

  /* ── Called for LIVE incoming messages (increments unread if chat not open) */
  const handleIncomingMessage = useCallback((reqId: number, msg: Message) => {
    setChatMeta(prev => {
      const cur         = prev[reqId];
      const isNewer     = !cur?.lastTime || msg.created_at >= cur.lastTime;
      const isFromOther = msg.sender !== user?.email;
      const isOpen      = selectedRef.current?.id === reqId;

      // Fire browser notification for messages from others when chat is not focused
      if (isFromOther && !isOpen) {
        const req  = requestsRef.current.find(r => r.id === reqId);
        const name = req
          ? (req.from_user === user?.email ? req.to_user : req.from_user).split("@")[0]
          : "Trade Chat";
        const body = msg.media?.length && !msg.text ? "📷 Sent a photo" : msg.text;
        showBrowserNotif(`New message from ${name}`, body);
      }

      return {
        ...prev,
        [reqId]: {
          unread: (isFromOther && !isOpen)
            ? (cur?.unread ?? 0) + 1
            : (cur?.unread ?? 0),
          lastMsg: isNewer
            ? (msg.media?.length && !msg.text ? "__media__" : truncate(msg.text || ""))
            : (cur?.lastMsg ?? ""),
          lastTime:   isNewer ? msg.created_at  : (cur?.lastTime   ?? ""),
          lastSender: isNewer ? msg.sender      : (cur?.lastSender ?? ""),
        },
      };
    });
  }, [user?.email]);

  /* ── Called for history load — updates preview but NEVER increments unread */
  const handleHistoryPreview = useCallback((reqId: number, msg: Message) => {
    setChatMeta(prev => {
      const cur     = prev[reqId];
      const isNewer = !cur?.lastTime || msg.created_at >= cur.lastTime;
      if (!isNewer) return prev;
      return {
        ...prev,
        [reqId]: {
          unread:     cur?.unread ?? 0,  // never touched here
          lastMsg:    msg.media?.length && !msg.text
                        ? "__media__"
                        : truncate(msg.text || ""),
          lastTime:   msg.created_at,
          lastSender: msg.sender,
        },
      };
    });
  }, []);

  /* ── Called when user opens a chat — zeros the badge */
  const handleMarkRead = useCallback((reqId: number) => {
    setChatMeta(prev => {
      if (!prev[reqId] || prev[reqId].unread === 0) return prev;
      return { ...prev, [reqId]: { ...prev[reqId], unread: 0 } };
    });
  }, []);

  /* ── Load chats from API, seed chatMeta from annotations */
  const loadChats = async () => {
    setChatLoading(true); setChatError(null);
    try {
      const res  = await fetch(`${BASE}/barter/get_accepted_request/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load chats");
      const data: AcceptedRequest[] = await res.json();
      setRequests(data);

      setChatMeta(prev => {
        const next = { ...prev };
        data.forEach(r => {
          if (!next[r.id]) {
            next[r.id] = {
              unread:     r.unread_count           ?? 0,
              lastMsg:    r.last_message           ? truncate(r.last_message) : "",
              lastTime:   r.last_message_time      ?? r.created_at,
              lastSender: r.last_message_sender    ?? "",
            };
          }
        });
        return next;
      });

      if (data.length > 0 && !selected) setSelected(data[0]);
    } catch (e: any) { setChatError(e.message); }
    finally { setChatLoading(false); }
  };

  const loadBarterRequests = async () => {
    try {
      const res  = await fetch(`${BASE}/barter/requests/`, { credentials: "include" });
      if (!res.ok) return;
      const data: BarterRequest[] = await res.json();
      setBarterRequests(data.filter(r => r.status === "pending"));
    } catch {}
  };

  const loadAll = () => { loadChats(); loadBarterRequests(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll(); }, []);

  const handleAccept = async (id: number) => {
    setAccepting(id);
    try {
      const res = await fetch(`${BASE}/barter/request/${id}/`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ status: "accepted" }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || err.detail || "Failed to accept"); }
      setBarterRequests(prev => prev.filter(r => r.id !== id));
      showToast("Deal accepted! 🎉 Loading chat…", true);
      await loadChats();
    } catch (e: any) { showToast(e.message || "Failed to accept", false); }
    finally { setAccepting(null); }
  };

  const handleReject = async (id: number) => {
    setRejecting(id);
    try {
      const res = await fetch(`${BASE}/barter/request/${id}/`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ status: "rejected" }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      setBarterRequests(prev => prev.filter(r => r.id !== id));
      showToast("Request passed. Their loss! 😅", true);
    } catch (e: any) { showToast(e.message || "Failed to decline", false); }
    finally { setRejecting(null); }
  };

  const setOtherOnline = useCallback((reqId: number, isOnline: boolean) => {
    setOnline(prev => prev[reqId] === isOnline ? prev : { ...prev, [reqId]: isOnline });
  }, []);

  const handleDealAction = useCallback((reqId: number, action: "completed" | "cancelled" | "fraud") => {
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: action } : r));
    setSelected(prev => prev?.id === reqId ? { ...prev, status: action } : prev);
    const msgs: Record<string, string> = {
      completed: "🎉 Deal sealed! Hope you got the better end of the bargain 😄",
      cancelled: "Deal cancelled. Items are back in listings.",
      fraud:     "⚠️ Fraud report submitted. Our team will review it.",
    };
    showToast(msgs[action], action === "completed");
  }, []);

  const activeCount     = requests.filter(r => r.status === "accepted").length;
  const completedCount  = requests.filter(r => r.status === "completed").length;
  const receivedPending = barterRequests.filter(r => r.to_user   === user?.email);
  const sentPending     = barterRequests.filter(r => r.from_user === user?.email);
  const totalPending    = barterRequests.length;

  const filteredChats = requests.filter(r =>
    filter === "active"    ? r.status === "accepted"  :
    filter === "completed" ? r.status === "completed" : true,
  );

  const sidebarItems: SidebarItem[] = [
    ...(filter === "all" ? [
      ...receivedPending.map(r => ({ kind: "request" as const, data: r })),
      ...sentPending.map(r => ({ kind: "request" as const, data: r })),
    ] : []),
    ...filteredChats.map(r => ({ kind: "chat" as const, data: r })),
  ];

  return (
    <div className={styles.shell}>
      {toast && (
        <div className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}>
          {toast.ok ? <Check size={13} /> : <AlertCircle size={13} />} {toast.msg}
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <div className={`${styles.sidebar} ${mobileShowChat ? styles.sidebarHidden : ""}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}><MessageCircle size={18} />Trade Chats</div>
          <button className={styles.refreshBtn} onClick={loadAll} disabled={chatLoading}>
            <RefreshCw size={13} className={chatLoading ? styles.spin : ""} />
          </button>
        </div>

        <div className={styles.filterTabs}>
          {(["all", "active", "completed"] as const).map(f => (
            <button key={f}
              className={`${styles.filterTab} ${filter === f ? styles.filterTabActive : ""}`}
              onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f === "active" ? "Active" : "Done"}{" "}
              <span className={f === "all" ? styles.filterCount : f === "active" ? styles.filterCountGreen : styles.filterCountAmber}>
                {f === "all" ? requests.length + totalPending : f === "active" ? activeCount : completedCount}
              </span>
              {f === "all" && totalPending > 0 && <span className={styles.pendingDot}>{totalPending}</span>}
            </button>
          ))}
        </div>

        <div className={styles.chatList}>
          {chatLoading ? (
            <div className={styles.sidebarState}>
              <Loader2 size={22} className={styles.spin} style={{ color: "var(--purple)" }} /><span>Loading chats…</span>
            </div>
          ) : chatError ? (
            <div className={styles.sidebarState}>
              <AlertCircle size={20} style={{ color: "#dc2626" }} /><span>{chatError}</span>
            </div>
          ) : sidebarItems.length === 0 ? (
            <div className={styles.sidebarState}>
              <MessageCircle size={24} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontWeight: 600 }}>Nothing here!</span>
              <p>{filter === "completed" ? "No completed trades yet 🤝" : filter === "active" ? "No active trades." : "Accept an exchange request to start trading"}</p>
            </div>
          ) : (
            <>
              {filter === "all" && totalPending > 0 && (
                <div className={styles.sectionLabel}><Inbox size={11} /> Pending Requests · {totalPending}</div>
              )}
              {sidebarItems.map((item, idx) => {
                if (item.kind === "request") {
                  const isReceived = item.data.to_user === user?.email;
                  return (
                    <PendingRequestCard key={`req-${item.data.id}`} req={item.data} isReceived={isReceived}
                      accepting={accepting} rejecting={rejecting}
                      onAccept={handleAccept} onReject={handleReject} onProductClick={handleProductClick} />
                  );
                }
                const prevItem      = sidebarItems[idx - 1];
                const showChatLabel = filter === "all" && totalPending > 0 && prevItem?.kind === "request";
                const req    = item.data;
                const other  = req.from_user === user?.email ? req.to_user : req.from_user;
                const meta   = chatMeta[req.id];
                return (
                  <div key={`chat-${req.id}`}>
                    {showChatLabel && (
                      <div className={styles.sectionLabel}><MessageCircle size={11} /> Active Chats · {filteredChats.length}</div>
                    )}
                    <ChatListItem
                      req={req} other={other}
                      isActive={selected?.id === req.id}
                      isDone={req.status !== "accepted"}
                      isOnline={online[req.id] ?? false}
                      unread={meta?.unread ?? 0}
                      lastMsg={meta?.lastMsg ?? ""}
                      lastTime={meta?.lastTime ?? ""}
                      lastSender={meta?.lastSender ?? ""}
                      userEmail={user?.email ?? ""}
                      onSelect={() => { setSelected(req); setMobileShowChat(true); handleMarkRead(req.id); }}
                      onProductClick={handleProductClick}
                    />
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ── MAIN PANEL ── */}
      <div className={`${styles.chatWindow} ${!mobileShowChat ? styles.chatWindowHidden : ""}`}>
        {!selected ? (
          <div className={styles.emptyWindow}>
            <div className={styles.emptyIconWrap}><MessageCircle size={34} /></div>
            <h3 className={styles.emptyTitle}>Pick a trade chat</h3>
            <p className={styles.emptyText}>Select a conversation — or just stare at this screen. Your call 🐸</p>
          </div>
        ) : (
          <ChatView
            key={selected.id}
            req={selected}
            userEmail={user?.email ?? ""}
            onDealAction={action => handleDealAction(selected.id, action)}
            onBack={() => setMobileShowChat(false)}
            otherOnline={online[selected.id] ?? false}
            onOtherOnline={v => setOtherOnline(selected.id, v)}
            onProductClick={handleProductClick}
            onIncomingMessage={handleIncomingMessage}
            onHistoryPreview={handleHistoryPreview}
            onMarkRead={handleMarkRead}
          />
        )}
      </div>

      {/* ── PRODUCT DETAIL MODAL ── */}
      {productModalId !== null && (
        <ProductModal key={productModalId} productId={productModalId} onClose={() => setProductModalId(null)} />
      )}
    </div>
  );
}