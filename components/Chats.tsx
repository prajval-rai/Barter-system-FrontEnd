"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle, ArrowLeftRight, Package, Send,
  Loader2, RefreshCw, Handshake, ChevronLeft,
  AlertCircle, Check, CheckCheck, Wifi, WifiOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "../styles/Chat.module.css";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface RequestProduct { id: number; title: string; thumbnail: string | null; }

interface AcceptedRequest {
  id: number;
  from_user: string;
  to_user: string;
  request_product: RequestProduct;
  request_for_product: RequestProduct;
  status: "accepted" | "completed";
  created_at: string;
}

interface Message {
  id: string;
  text: string;
  sender: string;
  created_at: string;
  seen: boolean;
  isSystem?: boolean;
}

type ChatState   = Record<number, Message[]>;
type OnlineState = Record<number, boolean>;   // requestId → other user online?

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const fmtDateLabel = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long" });
};

const fmtAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const initials  = (email: string) => email.slice(0, 2).toUpperCase();
const isSameDay = (a: string, b: string) =>
  new Date(a).toDateString() === new Date(b).toDateString();

/* ─── WS token helper ────────────────────────────────────────────────────── */
let cachedWsToken: string | null = null;

async function getWsToken(): Promise<string | null> {
  if (cachedWsToken) return cachedWsToken;
  try {
    const res = await fetch("http://localhost:8000/accounts/ws-token/", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    cachedWsToken = data.token ?? null;
    return cachedWsToken;
  } catch { return null; }
}

/* ════════════════════════════════════════════════════════════════════════════
   WebSocket hook — presence + seen receipts
════════════════════════════════════════════════════════════════════════════ */
function useChatSocket(
  requestId:   number | null,
  userEmail:   string | undefined,
  onMessage:   (msg: Message) => void,
  onHistory:   (msgs: Message[]) => void,
  onPresence:  (online: boolean) => void,
  onSeenAck:   (messageId: string) => void,
  onAllSeen:   () => void,
) {
  const wsRef        = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef   = useRef(true);

  // Always-fresh callbacks via refs
  const cbMessage  = useRef(onMessage);
  const cbHistory  = useRef(onHistory);
  const cbPresence = useRef(onPresence);
  const cbSeenAck  = useRef(onSeenAck);
  const cbAllSeen  = useRef(onAllSeen);
  useEffect(() => { cbMessage.current  = onMessage;  }, [onMessage]);
  useEffect(() => { cbHistory.current  = onHistory;  }, [onHistory]);
  useEffect(() => { cbPresence.current = onPresence; }, [onPresence]);
  useEffect(() => { cbSeenAck.current  = onSeenAck;  }, [onSeenAck]);
  useEffect(() => { cbAllSeen.current  = onAllSeen;  }, [onAllSeen]);

  const connect = useCallback(async () => {
    if (!requestId || !userEmail) return;

    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }

    const token = await getWsToken();
    const qs    = token ? `?token=${encodeURIComponent(token)}` : "";
    const ws    = new WebSocket(`ws://localhost:8000/ws/chat/${requestId}/${qs}`);
    wsRef.current = ws;

    ws.onopen = () => { if (mountedRef.current) setConnected(true); };

    ws.onmessage = (e) => {
      if (!mountedRef.current) return;
      const data = JSON.parse(e.data);

      switch (data.type) {
        case "history":
          cbHistory.current(
            data.messages.map((m: any) => ({
              id: String(m.id), text: m.text, sender: m.sender_email,
              created_at: m.created_at, seen: m.seen ?? false,
            }))
          );
          break;

        case "message":
          cbMessage.current({
            id: String(data.id), text: data.text, sender: data.sender_email,
            created_at: data.created_at, seen: data.seen ?? false,
          });
          break;

        case "presence":
          cbPresence.current(data.status === "online");
          break;

        case "seen_ack":
          cbSeenAck.current(String(data.message_id));
          break;

        case "all_seen":
          cbAllSeen.current();
          break;
      }
    };

    ws.onerror = () => {};
    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      cachedWsToken = null;
      cbPresence.current(false);   // treat disconnect as offline
      reconnectRef.current = setTimeout(() => connect(), 3000);
    };
  }, [requestId, userEmail]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [connect]);

  const sendWs = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify({ type: "message", text }));
  }, []);

  const sendSeen = useCallback((messageId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify({ type: "seen", message_id: messageId }));
  }, []);

  return { connected, sendWs, sendSeen };
}

/* ════════════════════════════════════════════════════════════════════════════
   Seen tick icon component
════════════════════════════════════════════════════════════════════════════ */
function SeenTick({ seen }: { seen: boolean }) {
  return (
    <CheckCheck
      size={12}
      style={{
        color:      seen ? "#60a5fa" : "rgba(255,255,255,0.5)",
        transition: "color 0.3s ease",
        flexShrink: 0,
      }}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   INNER CHAT VIEW
════════════════════════════════════════════════════════════════════════════ */
function ChatView({
  req, userEmail, messages, onMessages, onClose, onBack, otherOnline, onOtherOnline,
}: {
  req:           AcceptedRequest;
  userEmail:     string;
  messages:      Message[];
  onMessages:    (updater: (prev: Message[]) => Message[]) => void;
  onClose:       () => void;
  onBack:        () => void;
  otherOnline:   boolean;
  onOtherOnline: (v: boolean) => void;
}) {
  const [input, setInput]     = useState("");
  const [closing, setClosing] = useState(false);
  const endRef      = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  /* Callbacks */
  const handleMessage = useCallback((msg: Message) => {
    onMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
  }, [onMessages]);

  const handleHistory = useCallback((msgs: Message[]) => {
    onMessages(() => msgs);
  }, [onMessages]);

  const handlePresence = useCallback((online: boolean) => {
    onOtherOnline(online);
  }, [onOtherOnline]);

  /* When the other user's seen_ack arrives → mark matching msg as seen */
  const handleSeenAck = useCallback((messageId: string) => {
    onMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, seen: true } : m)
    );
  }, [onMessages]);

  /* When other user connects → mark ALL our sent messages as seen */
  const handleAllSeen = useCallback(() => {
    onMessages(prev => prev.map(m => ({ ...m, seen: true })));
  }, [onMessages]);

  const { connected, sendWs, sendSeen } = useChatSocket(
    req.id, userEmail,
    handleMessage, handleHistory, handlePresence, handleSeenAck, handleAllSeen,
  );

  /* Auto-scroll */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Intersection observer — mark incoming messages as seen when visible */
  const observerRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const msgId = (entry.target as HTMLElement).dataset.msgId;
          const msgSender = (entry.target as HTMLElement).dataset.sender;
          if (msgId && msgSender && msgSender !== userEmail) {
            sendSeen(msgId);
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    return () => observerRef.current?.disconnect();
  }, [userEmail, sendSeen]);

  const registerSeenObserver = useCallback((el: HTMLElement | null, msg: Message) => {
    if (!el || msg.sender === userEmail || msg.seen) return;
    observerRef.current?.observe(el);
  }, [userEmail]);

  const sendMessage = () => {
    if (!input.trim()) return;
    sendWs(input.trim());
    setInput("");
  };

  const closeDeal = async () => {
    setClosing(true);
    try {
      const res = await fetch(`http://localhost:8000/barter/request/${req.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) throw new Error();
      onClose();
    } catch { setClosing(false); }
  };

  const otherUser = req.from_user === userEmail ? req.to_user : req.from_user;

  return (
    <>
      {/* ── Header ── */}
      <div className={styles.chatHeader}>
        <button className={styles.backBtn} onClick={onBack}><ChevronLeft size={18} /></button>
        <div className={styles.headerAvatar}>{initials(otherUser)}</div>
        <div className={styles.headerInfo}>
          <div className={styles.headerName}>{otherUser.split("@")[0]}</div>
          <div className={styles.headerSub}>
            <span
              className={styles.connDot}
              style={{ background: otherOnline ? "var(--success)" : "var(--danger)" }}
            />
            {otherOnline ? "Online" : "Offline"}
          </div>
        </div>
        <button className={styles.closeDealBtn} onClick={closeDeal} disabled={closing}>
          {closing ? <Loader2 size={14} className={styles.spin} /> : <Handshake size={14} />}
          {closing ? "Closing…" : "Close Deal"}
        </button>
      </div>

      {/* ── Trade banner ── */}
      <div className={styles.tradeBanner}>
        <div className={styles.bannerProduct}>
          {req.request_product.thumbnail
            ? <img src={req.request_product.thumbnail} alt="" className={styles.bannerThumb} />
            : <div className={styles.bannerThumbEmpty}><Package size={14} /></div>}
          <span>{req.request_product.title}</span>
        </div>
        <div className={styles.bannerArrow}><ArrowLeftRight size={13} /></div>
        <div className={styles.bannerProduct}>
          {req.request_for_product.thumbnail
            ? <img src={req.request_for_product.thumbnail} alt="" className={styles.bannerThumb} />
            : <div className={styles.bannerThumbEmpty}><Package size={14} /></div>}
          <span>{req.request_for_product.title}</span>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.noMessages}>Say hello to kick off the trade 👋</div>
        )}

        {messages.map((msg, idx) => {
          const isMe       = msg.sender === userEmail;
          const prev       = messages[idx - 1];
          const showAvatar = !isMe && !msg.isSystem && (!prev || prev.sender !== msg.sender || prev.isSystem);
          const showDate   = !prev || !isSameDay(prev.created_at, msg.created_at);

          return (
            <div key={msg.id}>
              {showDate && (
                <div className={styles.dateDivider}>
                  <span className={styles.dateDividerLabel}>{fmtDateLabel(msg.created_at)}</span>
                </div>
              )}
              <div
                className={`${styles.msgRow} ${isMe ? styles.msgRowMe : ""} ${msg.isSystem ? styles.msgRowSystem : ""}`}
                /* Attach observer for incoming messages not yet seen */
                ref={el => registerSeenObserver(el, msg)}
                data-msg-id={msg.id}
                data-sender={msg.sender}
              >
                {!isMe && !msg.isSystem && (
                  showAvatar
                    ? <div className={styles.msgAvatar}>{initials(msg.sender)}</div>
                    : <div className={styles.msgAvatarSpacer} />
                )}
                <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : msg.isSystem ? styles.bubbleSystem : styles.bubbleThem}`}>
                  <div className={styles.bubbleText}>{msg.text}</div>
                  <div className={styles.bubbleTime}>
                    {fmtTime(msg.created_at)}
                    {/* ✅ Blue double-tick for seen, white for sent */}
                    {isMe && <SeenTick seen={msg.seen} />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* ── Input ── */}
      <div className={styles.inputBar}>
        <div className={`${styles.connIndicator} ${connected ? styles.connOk : styles.connOff}`}>
          {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
        </div>
        <input
          className={styles.inputField}
          placeholder={connected ? "Type a message…" : "Reconnecting…"}
          value={input}
          disabled={!connected}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
        />
        <button className={styles.sendBtn} onClick={sendMessage} disabled={!input.trim() || !connected}>
          <Send size={17} />
        </button>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   ROOT COMPONENT
════════════════════════════════════════════════════════════════════════════ */
export default function Chats() {
  const { user } = useAuth();

  const [requests, setRequests]     = useState<AcceptedRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [selected, setSelected]     = useState<AcceptedRequest | null>(null);
  const [chats, setChats]           = useState<ChatState>({});
  const [online, setOnline]         = useState<OnlineState>({});
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

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

  useEffect(() => { load(); }, []);

  const setMessagesForChat = useCallback((reqId: number, updater: (prev: Message[]) => Message[]) => {
    setChats(prev => ({ ...prev, [reqId]: updater(prev[reqId] ?? []) }));
  }, []);

  const setOtherOnline = useCallback((reqId: number, isOnline: boolean) => {
    setOnline(prev => ({ ...prev, [reqId]: isOnline }));
  }, []);

  const handleCloseDeal = () => {
    if (!selected) return;
    setRequests(prev => prev.filter(r => r.id !== selected.id));
    setChats(prev => { const n = { ...prev }; delete n[selected.id]; return n; });
    setOnline(prev => { const n = { ...prev }; delete n[selected.id]; return n; });
    setSelected(null);
    setMobileShowChat(false);
    showToast("🎉 Deal completed! Great trade!", true);
  };

  return (
    <div className={styles.shell}>
      {toast && (
        <div className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}>
          {toast.ok ? <Check size={13} /> : <AlertCircle size={13} />}
          {toast.msg}
        </div>
      )}

      {/* ════ SIDEBAR ════ */}
      <div className={`${styles.sidebar} ${mobileShowChat ? styles.sidebarHidden : ""}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>
            <MessageCircle size={18} /> Trade Chats
          </div>
          <button className={styles.refreshBtn} onClick={load} disabled={loading} title="Refresh">
            <RefreshCw size={13} className={loading ? styles.spin : ""} />
          </button>
        </div>

        <div className={styles.chatList}>
          {loading ? (
            <div className={styles.sidebarState}>
              <Loader2 size={22} className={styles.spin} style={{ color: "var(--purple)" }} />
              <span>Loading chats…</span>
            </div>
          ) : error ? (
            <div className={styles.sidebarState}>
              <AlertCircle size={20} style={{ color: "var(--danger)" }} />
              <span>{error}</span>
            </div>
          ) : requests.length === 0 ? (
            <div className={styles.sidebarState}>
              <MessageCircle size={24} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontWeight: 600 }}>No active chats</span>
              <p>Accept an exchange request to start trading</p>
            </div>
          ) : (
            requests.map(req => {
              const other    = req.from_user === user?.email ? req.to_user : req.from_user;
              const msgs     = chats[req.id] ?? [];
              const last     = msgs[msgs.length - 1];
              const isActive = selected?.id === req.id;
              const isOnline = online[req.id] ?? false;

              return (
                <button
                  key={req.id}
                  className={`${styles.chatItem} ${isActive ? styles.chatItemActive : ""}`}
                  onClick={() => { setSelected(req); setMobileShowChat(true); }}
                >
                  {/* Avatar with online dot */}
                  <div className={styles.chatItemAvatarWrap}>
                    <div className={styles.chatItemAvatar}>{initials(other)}</div>
                    {isOnline && <span className={styles.onlineDot} />}
                  </div>

                  <div className={styles.chatItemBody}>
                    <div className={styles.chatItemTop}>
                      <span className={styles.chatItemName}>{other.split("@")[0]}</span>
                      <span className={styles.chatItemTime}>
                        {last ? fmtAgo(last.created_at) : fmtAgo(req.created_at)}
                      </span>
                    </div>
                    <div className={styles.chatItemTrade}>
                      <span className={styles.chatItemProduct}>
                        {req.request_product.thumbnail
                          ? <img src={req.request_product.thumbnail} alt="" />
                          : <Package size={10} />}
                        {req.request_product.title}
                      </span>
                      <ArrowLeftRight size={9} style={{ color: "var(--purple)", flexShrink: 0 }} />
                      <span className={styles.chatItemProduct}>
                        {req.request_for_product.thumbnail
                          ? <img src={req.request_for_product.thumbnail} alt="" />
                          : <Package size={10} />}
                        {req.request_for_product.title}
                      </span>
                    </div>
                    {last && (
                      <div className={styles.chatItemPreview}>
                        {last.sender === user?.email
                          ? <><SeenTick seen={last.seen} /> You: </>
                          : ""}
                        {last.text}
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ════ CHAT WINDOW ════ */}
      <div className={`${styles.chatWindow} ${!mobileShowChat ? styles.chatWindowHidden : ""}`}>
        {!selected ? (
          <div className={styles.emptyWindow}>
            <div className={styles.emptyIconWrap}><MessageCircle size={34} /></div>
            <h3 className={styles.emptyTitle}>Select a trade chat</h3>
            <p className={styles.emptyText}>Pick a conversation from the sidebar to start messaging.</p>
          </div>
        ) : (
          <ChatView
            key={selected.id}
            req={selected}
            userEmail={user?.email ?? ""}
            messages={chats[selected.id] ?? []}
            onMessages={updater => setMessagesForChat(selected.id, updater)}
            onClose={handleCloseDeal}
            onBack={() => setMobileShowChat(false)}
            otherOnline={online[selected.id] ?? false}
            onOtherOnline={v => setOtherOnline(selected.id, v)}
          />
        )}
      </div>
    </div>
  );
}