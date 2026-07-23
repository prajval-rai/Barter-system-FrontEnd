// components/ProductDetail/ExchangeModal.tsx
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeftRight, X, Package, ChevronDown, Check,
  Send, ShieldCheck, MessageCircle, Gift,
  AlertTriangle, Loader2,
} from "lucide-react";
import styles from "../../styles/Exchangerequests.module.css";

interface MyProduct { id: number; title: string; thumbnail: string | null; }

interface Props {
  productId: number;
  productTitle: string;
  productThumbnail?: string | null;
  onClose: () => void;
  onSent: () => void;
}

const MAX_MESSAGE_LEN = 300;

export default function ExchangeModal({ productId, productTitle, productThumbnail, onClose, onSent }: Props) {
  const [myProducts, setMyProducts]       = useState<MyProduct[]>([]);
  const [loadingMine, setLoadingMine]     = useState(true);
  const [myProductsErr, setMyProductsErr] = useState<string | null>(null);
  const [selectedId, setSelectedId]       = useState<number | "">("");
  const [dropOpen, setDropOpen]           = useState(false);
  const [sending, setSending]             = useState(false);
  const [sendErr, setSendErr]             = useState<string | null>(null);
  const dropRef                           = useRef<HTMLDivElement>(null);

  // Free-text offer, used when the person has nothing listed yet
  // (or chooses to describe something instead of picking a listing).
  const [offerText, setOfferText] = useState("");

  // Editable message — pre-filled once something is selected, but the
  // person can rewrite it entirely. `messageEdited` stops us from
  // clobbering their own words with the auto-fill on every re-render.
  const [message, setMessage]         = useState("");
  const [messageEdited, setMessageEdited] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingMine(true);
      try {
        const res = await fetch(`/api/product/my`);
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
  const hasListings = myProducts.length > 0;

  // Auto-suggest a message whenever the selection changes, unless the
  // person has already started typing their own.
  useEffect(() => {
    if (messageEdited) return;
    if (selected) {
      setMessage(`Hey! I want to swap my "${selected.title}" for your "${productTitle}". Interested?`);
    } else if (offerText.trim()) {
      setMessage(`Hey! I don't have a listing to trade yet, but I can offer: ${offerText.trim()}. Interested in swapping for your "${productTitle}"?`);
    }
  }, [selected, offerText, productTitle, messageEdited]);

  const canSend = hasListings ? !!selectedId : offerText.trim().length > 0;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setSendErr(null);
    try {
      const res = await fetch(`/api/barter/request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_product: selectedId || null,
          request_for_product: productId,
          offer_description: !selectedId ? offerText.trim() : null,
          message: message.trim() || null,
        }),
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

          {/* Trade preview — the thing people's eyes should land on first */}
          <div className={styles.tradePreview}>
            <div className={styles.previewTile}>
              {selected?.thumbnail ? (
                <img src={selected.thumbnail} alt="" className={styles.previewImg} />
              ) : selected ? (
                <div className={styles.previewEmpty}><Package size={18} /></div>
              ) : (
                <div className={styles.previewPlaceholder}><Gift size={18} /></div>
              )}
              <span className={styles.previewLabel}>
                {selected ? selected.title : hasListings ? "Choose yours" : "Your offer"}
              </span>
            </div>

            <div className={styles.previewArrow}>
              <ArrowLeftRight size={16} />
            </div>

            <div className={styles.previewTile}>
              {productThumbnail ? (
                <img src={productThumbnail} alt="" className={styles.previewImg} />
              ) : (
                <div className={styles.previewEmpty}><Package size={18} /></div>
              )}
              <span className={styles.previewLabel}>{productTitle}</span>
            </div>
          </div>

          {/* Your offer */}
          <div className={styles.section}>
            <div className={styles.labelRow}>
              <span className={styles.label}>Your offer</span>
              <span className={styles.badge}>Required</span>
            </div>

            {loadingMine ? (
              <div className={styles.stateRow}>
                <Loader2 size={13} className={styles.spin} />
                <span>Loading your stuff…</span>
              </div>
            ) : myProductsErr ? (
              <div className={styles.stateErr}>
                <AlertTriangle size={13} /> {myProductsErr}
              </div>
            ) : !hasListings ? (
              <>
                <div className={styles.stateWarn}>
                  <Package size={13} />
                  You haven't listed anything yet — no problem, just describe what you can offer below.
                </div>
                <div className={styles.offerTextWrap}>
                  <textarea
                    className={styles.offerTextarea}
                    placeholder="e.g. ₹500 cash, a service (like tutoring), or another item you'll list soon…"
                    value={offerText}
                    maxLength={200}
                    rows={2}
                    onChange={e => setOfferText(e.target.value)}
                  />
                  <span className={styles.charCount}>{offerText.length}/200</span>
                </div>
              </>
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
                    <button
                      type="button"
                      className={styles.dropItemAlt}
                      onClick={() => { setSelectedId(""); setDropOpen(false); }}
                    >
                      <Gift size={14} />
                      <span>Offer something else instead</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Editable message */}
          <div className={styles.section}>
            <div className={styles.labelRow}>
              <span className={styles.label}>Your message</span>
            </div>
            <div className={styles.msgEditWrap}>
              <MessageCircle size={13} className={styles.msgEditIcon} />
              <textarea
                className={styles.msgTextarea}
                value={message}
                maxLength={MAX_MESSAGE_LEN}
                rows={3}
                placeholder="Say hi and explain your offer…"
                onChange={e => { setMessage(e.target.value); setMessageEdited(true); }}
              />
            </div>
            <div className={styles.msgFooterRow}>
              <p className={styles.msgNote}>You can keep chatting once they accept.</p>
              <span className={styles.charCount}>{message.length}/{MAX_MESSAGE_LEN}</span>
            </div>
          </div>

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
            disabled={sending || !canSend || loadingMine}
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
