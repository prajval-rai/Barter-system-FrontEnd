// components/ProductDetail/ExchangeModal.tsx
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeftRight, X, Package, ChevronDown, Check,
  Send, ShieldCheck, MessageCircle,
  AlertTriangle, Loader2,
} from "lucide-react";
import styles from "../../styles/Exchangerequests.module.css";

interface MyProduct { id: number; title: string; thumbnail: string | null; }

interface Props {
  productId: number;
  productTitle: string;
  onClose: () => void;
  onSent: () => void;
}

export default function ExchangeModal({ productId, productTitle, onClose, onSent }: Props) {
  const [myProducts, setMyProducts]       = useState<MyProduct[]>([]);
  const [loadingMine, setLoadingMine]     = useState(true);
  const [myProductsErr, setMyProductsErr] = useState<string | null>(null);
  const [selectedId, setSelectedId]       = useState<number | "">("");
  const [dropOpen, setDropOpen]           = useState(false);
  const [sending, setSending]             = useState(false);
  const [sendErr, setSendErr]             = useState<string | null>(null);
  const dropRef                           = useRef<HTMLDivElement>(null);

  const base_url = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const load = async () => {
      setLoadingMine(true);
      try {
        const res = await fetch(`/api/products/my`);
        if (!res.ok) throw new Error("Couldn't load your listings");
        setMyProducts(await res.json());
      } catch (e: any) {
        setMyProductsErr(e.message);
      } finally {
        setLoadingMine(false);
      }
    };
    load();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected  = myProducts.find(p => p.id === selectedId);
  const systemMsg = selected
    ? `Hey! I want to swap my "${selected.title}" for your "${productTitle}". Interested?`
    : "";

  const handleSend = async () => {
    if (!selectedId) return;
    setSending(true);
    setSendErr(null);
    try {
      // send barter request
      const res = await fetch(`/api/barter/request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_product: selectedId, request_for_product: productId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.detail || "Couldn't send request. Try again!");
      }
      onSent();
    } catch (e: any) {
      setSendErr(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <ArrowLeftRight size={16} />
            </div>
            <div>
              <p className={styles.headerTitle}>Swap Request</p>
              <p className={styles.headerSub}>offer your stuff, get theirs</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>

          {/* Your offer */}
          <div className={styles.section}>
            <div className={styles.labelRow}>
              <span className={styles.label}>Your offer</span>
              <span className={styles.badge}>Required</span>
            </div>
            <p className={styles.hint}>Pick what you want to give</p>

            {loadingMine ? (
              <div className={styles.stateRow}>
                <Loader2 size={13} className={styles.spin} />
                <span>Loading your stuff…</span>
              </div>
            ) : myProductsErr ? (
              <div className={styles.stateErr}>
                <AlertTriangle size={13} /> {myProductsErr}
              </div>
            ) : myProducts.length === 0 ? (
              <div className={styles.stateWarn}>
                <Package size={13} />
                You haven't listed anything yet. Add a product first!
              </div>
            ) : (
              <div className={styles.dropWrap} ref={dropRef}>
                <button
                  type="button"
                  className={[
                    styles.dropTrigger,
                    dropOpen  ? styles.dropOpen   : "",
                    selected  ? styles.dropFilled : "",
                  ].join(" ")}
                  onClick={() => setDropOpen(p => !p)}
                >
                  {selected ? (
                    <div className={styles.selRow}>
                      {selected.thumbnail
                        ? <img src={selected.thumbnail} alt="" className={styles.thumb} />
                        : <div className={styles.thumbEmpty}><Package size={12} /></div>
                      }
                      <span className={styles.selTitle}>{selected.title}</span>
                    </div>
                  ) : (
                    <span className={styles.placeholder}>Choose something to offer…</span>
                  )}
                  <ChevronDown
                    size={14}
                    className={styles.chevron}
                    style={{ transform: dropOpen ? "rotate(180deg)" : "none" }}
                  />
                </button>

                {dropOpen && (
                  <div className={styles.dropList}>
                    {myProducts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className={[styles.dropItem, selectedId === p.id ? styles.dropItemActive : ""].join(" ")}
                        onClick={() => {
                          setSelectedId(p.id);
                          setDropOpen(false);
                          setSendErr(null);
                        }}
                      >
                        {p.thumbnail
                          ? <img src={p.thumbnail} alt="" className={styles.thumb} />
                          : <div className={styles.thumbEmpty}><Package size={12} /></div>
                        }
                        <span className={styles.dropItemTitle}>{p.title}</span>
                        {selectedId === p.id && <Check size={12} className={styles.dropCheck} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* They're offering */}
          <div className={styles.section}>
            <div className={styles.labelRow}>
              <span className={styles.label}>You're getting</span>
            </div>
            <p className={styles.hint}>What they're offering in return</p>
            <div className={styles.targetTile}>
              <div className={styles.targetIcon}><ArrowLeftRight size={13} /></div>
              <span className={styles.targetTitle}>{productTitle}</span>
            </div>
          </div>

          {/* Message preview */}
          {selected && (
            <div className={styles.section}>
              <div className={styles.labelRow}>
                <span className={styles.label}>Auto message</span>
              </div>
              <div className={styles.msgBox}>
                <MessageCircle size={12} className={styles.msgIcon} />
                <p className={styles.msgText}>{systemMsg}</p>
              </div>
              <p className={styles.msgNote}>You can chat more once they accept.</p>
            </div>
          )}

          {/* Safety note */}
          <div className={styles.notice}>
            <ShieldCheck size={12} className={styles.noticeIcon} />
            <span>Your request gets reviewed first — no personal info is shared.</span>
          </div>

          {/* Error */}
          {sendErr && (
            <div className={styles.stateErr}>
              <AlertTriangle size={13} /> {sendErr}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={sending || !selectedId || loadingMine}
          >
            {sending
              ? <><Loader2 size={13} className={styles.spin} /> Sending…</>
              : <><Send size={13} /> Send Swap Request</>
            }
          </button>
        </div>

      </div>
    </div>
  );
}
