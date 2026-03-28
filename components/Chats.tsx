"use client";

import {
  useState, useEffect, useRef, useCallback, useReducer, memo,
} from "react";
import {
  MessageCircle, ArrowLeftRight, Package, Send, Loader2, RefreshCw,
  ChevronLeft, AlertCircle, Check, CheckCheck, Wifi, WifiOff, Trophy,
  Lock, Sparkles, Ghost, MoreVertical, X, ShieldAlert, XCircle,
  Star, Copy, CheckCircle, HandshakeIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "../styles/Chat.module.css";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════════ */
interface RequestProduct { id: number; title: string; thumbnail: string | null; }
interface AcceptedRequest {
  id: number; from_user: string; to_user: string;
  request_product: RequestProduct; request_for_product: RequestProduct;
  status: "accepted" | "completed" | "cancelled" | "fraud"; created_at: string;
}
interface Message {
  id: string; text: string; sender: string; created_at: string;
  seen: boolean; isSystem?: boolean; pending?: boolean; pendingKey?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MESSAGE REDUCER  (O(1) dedup, no cascading re-renders)
═══════════════════════════════════════════════════════════════════════════ */
type MsgAction =
  | { type: "HISTORY";   msgs: Message[] }
  | { type: "OPTIMISTIC"; msg: Message }
  | { type: "CONFIRM";   pendingKey: string; confirmed: Message }
  | { type: "ADD";       msg: Message }
  | { type: "SEEN_ONE";  id: string }
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
      const idx = s.list.findIndex(m => m.pending && m.pendingKey === a.pendingKey);
      const newIds = new Set([...s.ids, a.confirmed.id]);
      const newPK  = new Set(s.pendingKeys); newPK.delete(a.pendingKey);
      if (idx === -1) {
        if (s.ids.has(a.confirmed.id)) return s;
        return { ids: newIds, pendingKeys: newPK, list: [...s.list, a.confirmed] };
      }
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

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */
const QUIPS = [
  "This chat is retired like a sports jersey 🏅 No sending. No receiving. Just vibes.",
  "Deal's done. This chat has left the building 🕶️",
  "🔒 Archived. The items have physically left. Probably.",
  "Trade sealed. This conversation is now a museum exhibit 🏛️",
];
const randomQuip = () => QUIPS[Math.floor(Math.random() * QUIPS.length)];
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
const fmtDateLabel = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today"; if (d === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long" });
};
const fmtAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};
const initials  = (e: string) => e.slice(0, 2).toUpperCase();
const isSameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();

async function fetchWsToken(): Promise<string | null> {
  try {
    const r = await fetch("http://localhost:8000/accounts/ws-token/", { credentials: "include" });
    if (!r.ok) return null;
    return (await r.json()).token ?? null;
  } catch { return null; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   useChatSocket
═══════════════════════════════════════════════════════════════════════════ */
interface SocketCbs {
  onMessage:  (msg: Message, pendingKey?: string) => void;
  onHistory:  (msgs: Message[]) => void;
  onPresence: (online: boolean) => void;
  onSeenAck:  (id: string) => void;
  onAllSeen:  () => void;
}
function useChatSocket(requestId: number|null, userEmail: string|undefined, isCompleted: boolean, cbs: SocketCbs) {
  const wsRef        = useRef<WebSocket|null>(null);
  const [connected, setConnected] = useState(false);
  const reconnRef    = useRef<ReturnType<typeof setTimeout>|null>(null);
  const mountedRef   = useRef(true);
  const cbRef        = useRef(cbs);
  useEffect(() => { cbRef.current = cbs; });

  const connect = useCallback(async () => {
    if (!requestId || !userEmail) return;
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    const token = await fetchWsToken();
    const qs    = token ? `?token=${encodeURIComponent(token)}` : "";
    const ws    = new WebSocket(`ws://localhost:8000/ws/chat/${requestId}/${qs}`);
    wsRef.current = ws;
    ws.onopen = () => { if (mountedRef.current) setConnected(true); };
    ws.onmessage = (e) => {
      if (!mountedRef.current) return;
      const d = JSON.parse(e.data);
      if (d.type === "history")
        cbRef.current.onHistory(d.messages.map((m: any) => ({ id: String(m.id), text: m.text, sender: m.sender_email, created_at: m.created_at, seen: m.seen ?? false })));
      else if (d.type === "message")
        cbRef.current.onMessage({ id: String(d.id), text: d.text, sender: d.sender_email, created_at: d.created_at, seen: d.seen ?? false }, d.pending_key ?? undefined);
      else if (d.type === "presence") cbRef.current.onPresence(d.status === "online");
      else if (d.type === "seen_ack") cbRef.current.onSeenAck(String(d.message_id));
      else if (d.type === "all_seen") cbRef.current.onAllSeen();
    };
    ws.onerror = () => {};
    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false); cbRef.current.onPresence(false);
      if (!isCompleted) reconnRef.current = setTimeout(connect, 3000);
    };
  }, [requestId, userEmail, isCompleted]);

  useEffect(() => {
    mountedRef.current = true; connect();
    return () => {
      mountedRef.current = false;
      if (reconnRef.current) clearTimeout(reconnRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [connect]);

  const sendWs   = useCallback((text: string, pendingKey: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify({ type: "message", text, pending_key: pendingKey }));
  }, []);
  const sendSeen = useCallback((mid: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify({ type: "seen", message_id: mid }));
  }, []);
  return { connected, sendWs, sendSeen };
}

/* ═══════════════════════════════════════════════════════════════════════════
   RATING MODAL
═══════════════════════════════════════════════════════════════════════════ */
function RatingModal({ req, userEmail, onDone }: { req: AcceptedRequest; userEmail: string; onDone: () => void }) {
  const [rating, setRating]   = useState(0);
  const [hover, setHover]     = useState(0);
  const [review, setReview]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const otherUser = req.from_user === userEmail ? req.to_user : req.from_user;

  const submit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      await fetch(`http://localhost:8000/barter/rate/${req.id}/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, review, rated_user: otherUser }),
      });
      setDone(true);
      setTimeout(onDone, 1800);
    } catch { setLoading(false); }
  };

  const labels = ["", "Terrible 😬", "Bad 😕", "Okay 😐", "Good 😊", "Excellent 🤩"];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBox} style={{ maxWidth: 420 }}>
        {done ? (
          <div className={styles.modalDone}>
            <div className={styles.modalDoneIcon}>⭐</div>
            <h3>Thanks for rating!</h3>
            <p>Your feedback helps build trust in the community.</p>
          </div>
        ) : (
          <>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon} style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)" }}>⭐</div>
              <div>
                <h3 className={styles.modalTitle}>Rate this trade</h3>
                <p className={styles.modalSub}>How was your experience with <b>{otherUser.split("@")[0]}</b>?</p>
              </div>
            </div>

            <div className={styles.starsRow}>
              {[1,2,3,4,5].map(n => (
                <button key={n} className={styles.starBtn}
                  onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                >
                  <Star size={36} fill={(hover||rating) >= n ? "#f59e0b" : "none"} color={(hover||rating) >= n ? "#f59e0b" : "rgba(0,0,0,0.18)"} strokeWidth={1.5}/>
                </button>
              ))}
            </div>
            <p className={styles.ratingLabel}>{labels[hover || rating]}</p>

            <textarea
              className={styles.reviewInput}
              placeholder="Leave a short review (optional)…"
              value={review} onChange={e => setReview(e.target.value)}
              rows={3}
            />

            <div className={styles.modalActions}>
              <button className={`${styles.btn} ${styles.btnOutline}`} onClick={onDone}>Skip</button>
              <button className={`${styles.btn} ${styles.btnGold}`} onClick={submit} disabled={rating === 0 || loading}>
                {loading ? <Loader2 size={14} className={styles.spin}/> : <Star size={14}/>}
                Submit Rating
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   OTP MODAL  (Complete Deal flow)
   Initiator gets an OTP code → shares with other party → other party enters it
═══════════════════════════════════════════════════════════════════════════ */
function OtpModal({
  req, userEmail, onComplete, onClose,
}: {
  req: AcceptedRequest; userEmail: string; onComplete: () => void; onClose: () => void;
}) {
  const isInitiator = req.from_user === userEmail;

  // Initiator: request OTP from server and show it
  const [otp, setOtp]         = useState<string|null>(null);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string|null>(null);
  const [copied, setCopied]   = useState(false);

  // Initiator fetches OTP on mount
  useEffect(() => {
    if (!isInitiator) return;
    setLoading(true);
    fetch(`http://localhost:8000/chat/request/${req.id}/otp/generate/`, {
      method: "POST", credentials: "include",
    })
      .then(r => r.json())
      .then(d => { setOtp(d.otp); setLoading(false); })
      .catch(() => { setError("Failed to generate OTP"); setLoading(false); });
  }, [isInitiator, req.id]);

  const copyOtp = () => {
    if (!otp) return;
    navigator.clipboard.writeText(otp);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const submitOtp = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`http://localhost:8000/chat/request/${req.id}/otp/verify/`, {
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
        <button className={styles.modalClose} onClick={onClose}><X size={16}/></button>
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon} style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)" }}>
            <CheckCircle size={22} color="#fff"/>
          </div>
          <div>
            <h3 className={styles.modalTitle}>Complete the Deal</h3>
            <p className={styles.modalSub}>
              {isInitiator
                ? "Share this OTP with the other party to confirm the trade."
                : "Enter the OTP shared by the other party to confirm the trade."}
            </p>
          </div>
        </div>

        {isInitiator ? (
          loading ? (
            <div className={styles.otpLoading}><Loader2 size={24} className={styles.spin}/><span>Generating OTP…</span></div>
          ) : otp ? (
            <div className={styles.otpDisplay}>
              <div className={styles.otpCode}>{otp}</div>
              <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={copyOtp}>
                {copied ? <Check size={13}/> : <Copy size={13}/>}
                {copied ? "Copied!" : "Copy OTP"}
              </button>
              <p className={styles.otpHint}>⚠️ Share this only with your trade partner. Valid for 10 minutes.</p>
            </div>
          ) : (
            <p className={styles.otpErr}>{error}</p>
          )
        ) : (
          <div className={styles.otpEntry}>
            <input
              className={styles.otpInput}
              placeholder="Enter OTP from other party"
              value={input} maxLength={8}
              onChange={e => setInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && submitOtp()}
            />
            {error && <p className={styles.otpErr}>{error}</p>}
            <button className={`${styles.btn} ${styles.btnGold}`} style={{ width: "100%" }} onClick={submitOtp} disabled={!input.trim() || loading}>
              {loading ? <Loader2 size={14} className={styles.spin}/> : <CheckCircle size={14}/>}
              Confirm Trade
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEAL ACTIONS MENU
═══════════════════════════════════════════════════════════════════════════ */
function DealActionsMenu({
  req, userEmail, onCompleteDeal, onCancelDeal, onFraudDeal, onClose,
}: {
  req: AcceptedRequest; userEmail: string;
  onCompleteDeal: () => void; onCancelDeal: () => void; onFraudDeal: () => void; onClose: () => void;
}) {
  return (
    <div className={styles.actionsOverlay} onClick={onClose}>
      <div className={styles.actionsMenu} onClick={e => e.stopPropagation()}>
        <div className={styles.actionsHeader}>Deal Options</div>

        <button className={`${styles.actionItem} ${styles.actionGreen}`} onClick={() => { onClose(); onCompleteDeal(); }}>
          <div className={styles.actionIcon} style={{ background: "rgba(22,163,74,0.1)" }}>
            <HandshakeIcon size={18} color="var(--success)"/>
          </div>
          <div className={styles.actionText}>
            <span>Complete Deal</span>
            <small>Verify with OTP and close the trade</small>
          </div>
          <CheckCircle size={16} color="var(--success)"/>
        </button>

        <button className={`${styles.actionItem} ${styles.actionRed}`} onClick={() => { onClose(); onCancelDeal(); }}>
          <div className={styles.actionIcon} style={{ background: "rgba(225,29,72,0.08)" }}>
            <XCircle size={18} color="var(--danger)"/>
          </div>
          <div className={styles.actionText}>
            <span>Cancel Deal</span>
            <small>Back out — both items return to listings</small>
          </div>
        </button>

        <button className={`${styles.actionItem} ${styles.actionAmber}`} onClick={() => { onClose(); onFraudDeal(); }}>
          <div className={styles.actionIcon} style={{ background: "rgba(217,119,6,0.08)" }}>
            <ShieldAlert size={18} color="var(--warning)"/>
          </div>
          <div className={styles.actionText}>
            <span>Mark as Fraud</span>
            <small>Report this trade as suspicious or fraudulent</small>
          </div>
        </button>

        <button className={styles.actionCancel} onClick={onClose}>Dismiss</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONFIRM DIALOG  (for cancel / fraud — irreversible)
═══════════════════════════════════════════════════════════════════════════ */
function ConfirmDialog({
  title, body, confirmLabel, confirmColor, loading, onConfirm, onCancel,
}: {
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
          <button className={`${styles.btn}`} style={{ background: confirmColor, color: "#fff" }} onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 size={14} className={styles.spin}/> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SMALL PURE COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */
const SeenTick = memo(function SeenTick({ seen, pending }: { seen: boolean; pending?: boolean }) {
  if (pending) return <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>⏱</span>;
  return <CheckCheck size={12} style={{ color: seen ? "#60a5fa" : "rgba(255,255,255,0.5)", transition: "color 0.3s ease", flexShrink: 0 }}/>;
});

const MessageBubble = memo(function MessageBubble({
  msg, isMe, showAvatar, showDate, isCompleted, userEmail, registerSeenObserver,
}: {
  msg: Message; isMe: boolean; showAvatar: boolean; showDate: boolean;
  isCompleted: boolean; userEmail: string;
  registerSeenObserver: (el: HTMLElement|null, msg: Message) => void;
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
          showAvatar
            ? <div className={styles.msgAvatar}>{initials(msg.sender)}</div>
            : <div className={styles.msgAvatarSpacer}/>
        )}
        <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : msg.isSystem ? styles.bubbleSystem : styles.bubbleThem} ${isCompleted ? styles.bubbleFaded : ""}`}>
          <div className={styles.bubbleText}>{msg.text}</div>
          <div className={styles.bubbleTime}>
            {fmtTime(msg.created_at)}
            {isMe && <SeenTick seen={msg.seen} pending={msg.pending}/>}
          </div>
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   CompletedBanner
═══════════════════════════════════════════════════════════════════════════ */
function CompletedBanner({ req }: { req: AcceptedRequest }) {
  const [quip] = useState(randomQuip);
  const [boom, setBoom] = useState(true);
  useEffect(() => { const t = setTimeout(() => setBoom(false), 3200); return () => clearTimeout(t); }, []);
  return (
    <div className={styles.completedBanner}>
      {boom && (
        <div className={styles.confettiWrap} aria-hidden>
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className={styles.confettiPiece} style={{
              left: `${5 + Math.random() * 90}%`,
              animationDelay: `${Math.random() * 0.6}s`,
              width: `${6 + Math.random() * 6}px`, height: `${6 + Math.random() * 6}px`,
              background: ["#7b6ef6","#f59e0b","#2dd4a0","#f87171","#60a5fa","#c084fc","#fbbf24"][i % 7],
            }}/>
          ))}
        </div>
      )}
      <div className={styles.completedTrophy}>🏆</div>
      <div className={styles.completedBadgeRow}>
        <span className={styles.completedBadge}><Trophy size={11}/>Trade Complete</span>
      </div>
      <h3 className={styles.completedTitle}>This trade is sealed in history!</h3>
      <p className={styles.completedQuip}>{quip}</p>
      <div className={styles.completedTradeRow}>
        <div className={styles.completedProduct}>
          {req.request_product.thumbnail
            ? <img src={req.request_product.thumbnail} alt="" className={styles.completedThumb}/>
            : <span className={styles.completedThumbEmpty}><Package size={14}/></span>}
          <span>{req.request_product.title}</span>
        </div>
        <span className={styles.completedArrow}>⇌</span>
        <div className={styles.completedProduct}>
          {req.request_for_product.thumbnail
            ? <img src={req.request_for_product.thumbnail} alt="" className={styles.completedThumb}/>
            : <span className={styles.completedThumbEmpty}><Package size={14}/></span>}
          <span>{req.request_for_product.title}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LockedInputBar
═══════════════════════════════════════════════════════════════════════════ */
function LockedInputBar() {
  const [wiggle, setWiggle] = useState(false);
  const [count, setCount]   = useState(0);
  const jokes = ["Nice try 😏","Still no 😄","Persistence! But still no 🙅","Still locked 🔒","LEGENDARY CLICKING 🤣"];
  const doClick = () => { setWiggle(true); setCount(c => c + 1); setTimeout(() => setWiggle(false), 500); };
  return (
    <div className={styles.lockedBar}>
      <div className={`${styles.lockedInner} ${wiggle ? styles.wiggle : ""}`} onClick={doClick}>
        <Lock size={14} className={styles.lockIcon}/>
        <div className={styles.lockedText}>
          <span>Chat is archived — trade complete 🎖️</span>
          <span className={styles.lockedHint}>{count === 0 ? "Click me if you dare 😏" : jokes[Math.min(count-1,jokes.length-1)]}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ChatView
═══════════════════════════════════════════════════════════════════════════ */
type Modal = "none" | "actions" | "otp" | "cancel_confirm" | "fraud_confirm" | "rating";

function ChatView({
  req, userEmail, onDealAction, onBack, otherOnline, onOtherOnline,
}: {
  req: AcceptedRequest; userEmail: string;
  onDealAction: (action: "completed"|"cancelled"|"fraud") => void;
  onBack: () => void; otherOnline: boolean; onOtherOnline: (v: boolean) => void;
}) {
  const [msgState, dispatch]  = useReducer(msgReducer, undefined, emptyMsgState);
  const [input, setInput]     = useState("");
  const [modal, setModal]     = useState<Modal>("none");
  const [actionLoading, setActionLoading] = useState(false);
  const endRef                = useRef<HTMLDivElement>(null);
  const boxRef                = useRef<HTMLDivElement>(null);
  const isCompleted           = req.status === "completed";
  const isLocked              = req.status !== "accepted";
  const messages              = msgState.list;

  const onMessage  = useCallback((msg: Message, pk?: string) => { dispatch(pk ? { type: "CONFIRM", pendingKey: pk, confirmed: msg } : { type: "ADD", msg }); }, []);
  const onHistory  = useCallback((msgs: Message[]) => dispatch({ type: "HISTORY", msgs }), []);
  const onPresence = useCallback((v: boolean) => onOtherOnline(v), [onOtherOnline]);
  const onSeenAck  = useCallback((id: string) => dispatch({ type: "SEEN_ONE", id }), []);
  const onAllSeen  = useCallback(() => dispatch({ type: "SEEN_ALL" }), []);

  const { connected, sendWs, sendSeen } = useChatSocket(req.id, userEmail, isLocked, { onMessage, onHistory, onPresence, onSeenAck, onAllSeen });

  const prevLenRef = useRef(0);
  useEffect(() => {
    if (messages.length === prevLenRef.current) return;
    prevLenRef.current = messages.length;
    const box = boxRef.current;
    if (!box) return;
    if (box.scrollHeight - box.scrollTop - box.clientHeight < 150)
      endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const observerRef = useRef<IntersectionObserver|null>(null);
  useEffect(() => {
    observerRef.current = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const msgId = el.dataset.msgId; const sender = el.dataset.sender;
        if (msgId && sender && sender !== userEmail) { sendSeen(msgId); observerRef.current?.unobserve(el); }
      });
    }, { threshold: 0.5 });
    return () => observerRef.current?.disconnect();
  }, [userEmail, sendSeen]);

  const registerSeenObserver = useCallback((el: HTMLElement|null, msg: Message) => {
    if (!el || msg.sender === userEmail || msg.seen || isLocked || msg.pending) return;
    observerRef.current?.observe(el);
  }, [userEmail, isLocked]);

  const sendMessage = () => {
    if (!input.trim() || isLocked || !connected) return;
    const text = input.trim();
    const pk   = `pk-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setInput("");
    dispatch({ type: "OPTIMISTIC", msg: { id: pk, text, sender: userEmail, created_at: new Date().toISOString(), seen: false, pending: true, pendingKey: pk } });
    sendWs(text, pk);
  };

  // ── Deal actions ──
  const patchDeal = async (status: "cancelled"|"fraud") => {
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/barter/request/${req.id}/`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      onDealAction(status);
    } catch { setActionLoading(false); }
  };

  const handleOtpComplete = () => {
    setModal("rating");
    onDealAction("completed");
  };

  const otherUser = req.from_user === userEmail ? req.to_user : req.from_user;

  return (
    <>
      {/* ── Modals ── */}
      {modal === "actions" && (
        <DealActionsMenu
          req={req} userEmail={userEmail}
          onCompleteDeal={() => setModal("otp")}
          onCancelDeal={() => setModal("cancel_confirm")}
          onFraudDeal={() => setModal("fraud_confirm")}
          onClose={() => setModal("none")}
        />
      )}
      {modal === "otp" && (
        <OtpModal req={req} userEmail={userEmail} onComplete={handleOtpComplete} onClose={() => setModal("none")}/>
      )}
      {modal === "cancel_confirm" && (
        <ConfirmDialog
          title="Cancel this deal?"
          body="Both items will return to active listings and this chat will be archived. This cannot be undone."
          confirmLabel="Yes, Cancel Deal" confirmColor="var(--danger)"
          loading={actionLoading}
          onConfirm={() => patchDeal("cancelled")}
          onCancel={() => setModal("none")}
        />
      )}
      {modal === "fraud_confirm" && (
        <ConfirmDialog
          title="Report as Fraud?"
          body="This will flag the trade for review and notify our team. Only use this if you believe the other party is acting fraudulently."
          confirmLabel="Yes, Report Fraud" confirmColor="var(--warning)"
          loading={actionLoading}
          onConfirm={() => patchDeal("fraud")}
          onCancel={() => setModal("none")}
        />
      )}
      {modal === "rating" && (
        <RatingModal req={req} userEmail={userEmail} onDone={() => setModal("none")}/>
      )}

      {/* ── Header ── */}
      <div className={styles.chatHeader}>
        <button className={styles.backBtn} onClick={onBack}><ChevronLeft size={18}/></button>
        <div className={styles.headerAvatarWrap}>
          <div className={`${styles.headerAvatar} ${isCompleted ? styles.headerAvatarCompleted : ""}`}>
            {isCompleted ? "🏆" : initials(otherUser)}
          </div>
          {!isLocked && <span className={styles.headerOnlineDot} style={{ background: otherOnline ? "#2dd4a0" : "#f87171" }}/>}
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.headerName}>
            {otherUser.split("@")[0]}
            {isCompleted && <span className={styles.completedPill}><Trophy size={10}/>Done</span>}
            {req.status === "cancelled" && <span className={styles.cancelledPill}><XCircle size={10}/>Cancelled</span>}
            {req.status === "fraud" && <span className={styles.fraudPill}><ShieldAlert size={10}/>Fraud Report</span>}
          </div>
          <div className={styles.headerSub}>
            {isLocked
              ? <><Lock size={10} style={{ marginRight: 4 }}/>Archived · read-only</>
              : <><span className={styles.connDot} style={{ background: otherOnline ? "#2dd4a0" : "#f87171" }}/>{otherOnline ? "Online" : "Offline"}</>}
          </div>
        </div>
        {/* ── 3-dot menu replaces the old single button ── */}
        {!isLocked && (
          <button className={styles.moreBtn} onClick={() => setModal("actions")} title="Deal options">
            <MoreVertical size={18}/>
          </button>
        )}
        {/* Rate button if completed and haven't rated yet */}
        {isCompleted && (
          <button className={`${styles.btn} ${styles.btnSm} ${styles.btnOutline}`} onClick={() => setModal("rating")} style={{ flexShrink: 0 }}>
            <Star size={13}/> Rate
          </button>
        )}
      </div>

      {/* ── Trade banner ── */}
      <div className={`${styles.tradeBanner} ${isCompleted ? styles.tradeBannerCompleted : ""}`}>
        <div className={styles.bannerProduct}>
          {req.request_product.thumbnail
            ? <img src={req.request_product.thumbnail} alt="" className={styles.bannerThumb}/>
            : <div className={styles.bannerThumbEmpty}><Package size={14}/></div>}
          <span>{req.request_product.title}</span>
        </div>
        <div className={styles.bannerArrow}><ArrowLeftRight size={13}/></div>
        <div className={styles.bannerProduct}>
          {req.request_for_product.thumbnail
            ? <img src={req.request_for_product.thumbnail} alt="" className={styles.bannerThumb}/>
            : <div className={styles.bannerThumbEmpty}><Package size={14}/></div>}
          <span>{req.request_for_product.title}</span>
        </div>
        {isCompleted && <div className={styles.bannerCompletedTag}><Trophy size={11}/>Deal Sealed</div>}
      </div>

      {isCompleted && <CompletedBanner req={req}/>}

      {/* ── Messages ── */}
      <div className={styles.messages} ref={boxRef}>
        {messages.length === 0 && !isLocked && <div className={styles.noMessages}>Say hello to kick off the trade 👋</div>}
        {messages.length === 0 && isLocked && (
          <div className={styles.noMessages}>
            <Ghost size={20} style={{ opacity: 0.5, marginRight: 6 }}/>
            No messages were sent... ghosted your own trade 👻
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMe       = msg.sender === userEmail;
          const prev       = messages[idx - 1];
          const showAvatar = !isMe && !msg.isSystem && (!prev || prev.sender !== msg.sender || prev.isSystem);
          const showDate   = !prev || !isSameDay(prev.created_at, msg.created_at);
          return (
            <MessageBubble key={msg.id} msg={msg} isMe={isMe} showAvatar={showAvatar} showDate={showDate}
              isCompleted={isLocked} userEmail={userEmail} registerSeenObserver={registerSeenObserver}/>
          );
        })}
        <div ref={endRef}/>
      </div>

      {/* ── Input ── */}
      {isLocked ? <LockedInputBar/> : (
        <div className={styles.inputBar}>
          <div className={`${styles.connIndicator} ${connected ? styles.connOk : styles.connOff}`}>
            {connected ? <Wifi size={11}/> : <WifiOff size={11}/>}
          </div>
          <input
            className={styles.inputField}
            placeholder={connected ? "Type a message…" : "Reconnecting…"}
            value={input} disabled={!connected}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          />
          <button className={styles.sendBtn} onClick={sendMessage} disabled={!input.trim() || !connected}>
            <Send size={17}/>
          </button>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════════════════ */
export default function Chats() {
  const { user } = useAuth();
  const [requests, setRequests]             = useState<AcceptedRequest[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string|null>(null);
  const [selected, setSelected]             = useState<AcceptedRequest|null>(null);
  const [online, setOnline]                 = useState<Record<number,boolean>>({});
  const [toast, setToast]                   = useState<{ msg: string; ok: boolean }|null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [filter, setFilter]                 = useState<"all"|"active"|"completed">("all");

  const showToast = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); };

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("http://localhost:8000/barter/get_accepted_request/", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load chats");
      const data: AcceptedRequest[] = await res.json();
      setRequests(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const setOtherOnline = useCallback((reqId: number, isOnline: boolean) => {
    setOnline(prev => prev[reqId] === isOnline ? prev : { ...prev, [reqId]: isOnline });
  }, []);

  const handleDealAction = useCallback((reqId: number, action: "completed"|"cancelled"|"fraud") => {
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: action } : r));
    setSelected(prev => prev?.id === reqId ? { ...prev, status: action } : prev);
    const msgs: Record<string, string> = {
      completed: "🎉 Deal sealed! Hope you got the better end of the bargain 😄",
      cancelled: "Deal cancelled. Items are back in listings.",
      fraud:     "⚠️ Fraud report submitted. Our team will review it.",
    };
    showToast(msgs[action], action === "completed");
  }, []);

  const filteredRequests = requests.filter(r =>
    filter === "active"    ? r.status === "accepted"  :
    filter === "completed" ? r.status === "completed" : true
  );
  const activeCount    = requests.filter(r => r.status === "accepted").length;
  const completedCount = requests.filter(r => r.status === "completed").length;

  return (
    <div className={styles.shell}>
      {toast && (
        <div className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}>
          {toast.ok ? <Check size={13}/> : <AlertCircle size={13}/>} {toast.msg}
        </div>
      )}

      <div className={`${styles.sidebar} ${mobileShowChat ? styles.sidebarHidden : ""}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}><MessageCircle size={18}/>Trade Chats</div>
          <button className={styles.refreshBtn} onClick={load} disabled={loading}>
            <RefreshCw size={13} className={loading ? styles.spin : ""}/>
          </button>
        </div>
        <div className={styles.filterTabs}>
          {(["all","active","completed"] as const).map(f => (
            <button key={f} className={`${styles.filterTab} ${filter === f ? styles.filterTabActive : ""}`} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f === "active" ? "Active" : "Done"}{" "}
              <span className={f === "all" ? styles.filterCount : f === "active" ? styles.filterCountGreen : styles.filterCountAmber}>
                {f === "all" ? requests.length : f === "active" ? activeCount : completedCount}
              </span>
            </button>
          ))}
        </div>
        <div className={styles.chatList}>
          {loading ? (
            <div className={styles.sidebarState}><Loader2 size={22} className={styles.spin} style={{ color: "var(--purple)" }}/><span>Loading chats…</span></div>
          ) : error ? (
            <div className={styles.sidebarState}><AlertCircle size={20} style={{ color: "var(--danger)" }}/><span>{error}</span></div>
          ) : filteredRequests.length === 0 ? (
            <div className={styles.sidebarState}>
              <MessageCircle size={24} style={{ color: "var(--text-muted)" }}/>
              <span style={{ fontWeight: 600 }}>Nothing here!</span>
              <p>{filter === "completed" ? "No completed trades yet 🤝" : filter === "active" ? "No active trades." : "Accept an exchange request to start trading"}</p>
            </div>
          ) : filteredRequests.map(req => {
            const other    = req.from_user === user?.email ? req.to_user : req.from_user;
            const isActive = selected?.id === req.id;
            const isDone   = req.status !== "accepted";
            const isOnline = online[req.id] ?? false;
            return (
              <button key={req.id}
                className={`${styles.chatItem} ${isActive ? styles.chatItemActive : ""} ${isDone ? styles.chatItemDone : ""}`}
                onClick={() => { setSelected(req); setMobileShowChat(true); }}
              >
                {isDone && <div className={styles.chatItemDoneStripe}/>}
                <div className={styles.chatItemAvatarWrap}>
                  <div className={`${styles.chatItemAvatar} ${isDone ? styles.chatItemAvatarDone : ""}`}>
                    {req.status === "completed" ? "🏆" : req.status === "cancelled" ? "❌" : req.status === "fraud" ? "🚨" : initials(other)}
                  </div>
                  {!isDone && isOnline && <span className={styles.onlineDot}/>}
                </div>
                <div className={styles.chatItemBody}>
                  <div className={styles.chatItemTop}>
                    <span className={styles.chatItemName}>{other.split("@")[0]}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {req.status === "completed"
                        ? <span className={styles.chatItemDoneBadge}><Trophy size={9}/>Done</span>
                        : req.status === "cancelled"
                        ? <span className={styles.chatItemCancelledBadge}><XCircle size={9}/>Cancelled</span>
                        : req.status === "fraud"
                        ? <span className={styles.chatItemFraudBadge}><ShieldAlert size={9}/>Fraud</span>
                        : <span className={styles.chatItemActiveBadge}><Sparkles size={9}/>Active</span>}
                      <span className={styles.chatItemTime}>{fmtAgo(req.created_at)}</span>
                    </div>
                  </div>
                  <div className={styles.chatItemTrade}>
                    <span className={styles.chatItemProduct}>
                      {req.request_product.thumbnail ? <img src={req.request_product.thumbnail} alt=""/> : <Package size={10}/>}
                      {req.request_product.title}
                    </span>
                    <ArrowLeftRight size={9} style={{ color: "var(--purple)", flexShrink: 0 }}/>
                    <span className={styles.chatItemProduct}>
                      {req.request_for_product.thumbnail ? <img src={req.request_for_product.thumbnail} alt=""/> : <Package size={10}/>}
                      {req.request_for_product.title}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`${styles.chatWindow} ${!mobileShowChat ? styles.chatWindowHidden : ""}`}>
        {!selected ? (
          <div className={styles.emptyWindow}>
            <div className={styles.emptyIconWrap}><MessageCircle size={34}/></div>
            <h3 className={styles.emptyTitle}>Pick a trade chat</h3>
            <p className={styles.emptyText}>Select a conversation — or just stare at this screen. Your call 🐸</p>
          </div>
        ) : (
          <ChatView
            key={selected.id} req={selected} userEmail={user?.email ?? ""}
            onDealAction={action => handleDealAction(selected.id, action)}
            onBack={() => setMobileShowChat(false)}
            otherOnline={online[selected.id] ?? false}
            onOtherOnline={v => setOtherOnline(selected.id, v)}
          />
        )}
      </div>
    </div>
  );
}