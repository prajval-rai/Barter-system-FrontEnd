"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X, Package, Radar, RefreshCw, ChevronRight, Zap,
  MapPin, SlidersHorizontal, Wifi, AlertTriangle,
  Tag, FileText, Layers, Navigation2, CheckCircle,
  Clock, XCircle, Lock, Repeat2, ChevronLeft,
  Search, ExternalLink,
} from "lucide-react";
import styles from "../styles/Chatproductpanel.module.css";
import ProductDetailPage from "./ProductDetail"; // ← your existing component

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
interface Category { id: number; name: string; }
interface ReplaceOption { id: number; title: string; description: string; category: string; icon?: string; }
interface UserProduct {
  id: number;
  title: string;
  description: string;
  category: Category;
  image_urls?: string[];
  thumbnail?: string;
  status: "Submitted" | "Approved" | "Rejected" | "Closed";
  created_at: string;
  product_replace_options: ReplaceOption[];
  purchase_year: number;
  purchase_price?: number;
  market_price?: number;
  condition?: string;
  tags?: string;
  icon?: string;
}

interface MatchReason {
  criterion: "title" | "description" | "category" | "proximity";
  label: string;
  score: number;
  max_score: number;
  matched_terms: string[];
  detail: string;
}
interface MatchBreakdown {
  scores: { title: number; description: number; category: number; proximity: number };
  reasons: MatchReason[];
  top_criterion: string | null;
  top_label: string;
}
interface ScanProduct {
  id: number;
  title: string;
  description?: string;
  category: string;
  thumbnail?: string;
  image?: string;
  owner_name?: string;
  distance_km?: number;
  match_score?: number;
  match_breakdown?: MatchBreakdown;
  replace_options?: string[];
  condition?: string;
  purchase_year?: number;
}

export interface ChatProductPanelProps {
  onClose: () => void;
  onNavigate?: (id: string) => void;
}

/* ═══════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════ */
const BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const RADIUS_STEPS = [5, 10, 25, 50, 100];

const STATUS_META = {
  Submitted: { Icon: Clock,        label: "Review",   color: "var(--amber)",   bg: "rgba(217,119,6,0.08)"  },
  Approved:  { Icon: CheckCircle,  label: "Live",     color: "var(--success)", bg: "rgba(22,163,74,0.08)"  },
  Rejected:  { Icon: XCircle,      label: "Rejected", color: "var(--danger)",  bg: "rgba(225,29,72,0.08)"  },
  Closed:    { Icon: Lock,         label: "Closed",   color: "var(--purple)",  bg: "rgba(124,58,237,0.08)" },
};

const CRITERION_ICON: Record<string, React.ElementType> = {
  title: Tag, description: FileText, category: Layers, proximity: Navigation2,
};
const CRITERION_COLOR: Record<string, string> = {
  title: "var(--purple)", description: "var(--cyan)",
  category: "var(--warning)", proximity: "var(--success)",
};

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
function getImg(p: UserProduct): string | undefined {
  return p.image_urls?.[0] ?? p.thumbnail;
}
function normalizeStatus(raw: string): UserProduct["status"] {
  const n = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  return (["Submitted","Approved","Rejected","Closed"].includes(n) ? n : "Submitted") as UserProduct["status"];
}

/* ═══════════════════════════════════════════
   RADAR SUB-COMPONENTS
═══════════════════════════════════════════ */
function RadarRings({ scanning }: { scanning: boolean }) {
  return (
    <div className={styles.radarWrap}>
      {[100, 70, 42].map(r => (
        <div key={r} className={styles.ring} style={{ "--r": `${r}%` } as React.CSSProperties} />
      ))}
      <div className={styles.crossH} /><div className={styles.crossV} />
      {scanning && <div className={styles.sweep} />}
      {scanning && [0, 1, 2].map(i => (
        <div key={i} className={`${styles.pulse} ${styles[`pulse${i+1}` as keyof typeof styles]}`} />
      ))}
      <div className={styles.centerDot}><div className={styles.centerPing} /></div>
    </div>
  );
}

function RadarBlip({ product, index, total, onClick }: {
  product: ScanProduct; index: number; total: number; onClick: () => void;
}) {
  const angle = (index / Math.max(total, 1)) * 360 + (index % 3) * 15;
  const dist  = product.match_score ? 10 + (1 - product.match_score / 100) * 35 : 20 + (index * 7) % 30;
  const rad   = (angle * Math.PI) / 180;
  const x = 50 + dist * Math.cos(rad);
  const y = 50 + dist * Math.sin(rad);
  const strong = (product.match_score ?? 0) >= 75;
  return (
    <div
      className={`${styles.blip} ${strong ? styles.blipStrong : ""}`}
      style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${index * 0.18}s` } as React.CSSProperties}
      onClick={onClick} title={product.title}
    >
      <div className={styles.blipDot} />
      {strong && <div className={styles.blipRing} />}
    </div>
  );
}

function ScoreBar({ score, max, color }: { score: number; max: number; color: string }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className={styles.scoreBarWrap}>
      <div className={styles.scoreBarTrack}>
        <div className={styles.scoreBarFill} style={{ width: `${pct}%`, background: color } as React.CSSProperties} />
      </div>
      <span className={styles.scoreBarPct} style={{ color } as React.CSSProperties}>{score}/{max}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SCANNER PANEL
═══════════════════════════════════════════ */
function ScannerPanel({
  product,
  onClose,
  onViewProduct,
}: {
  product: UserProduct;
  onClose: () => void;
  onViewProduct: (id: number) => void;
}) {
  const [phase, setPhase]          = useState<"idle"|"scanning"|"results"|"error">("idle");
  const [results, setResults]      = useState<ScanProduct[]>([]);
  const [radiusIdx, setRadiusIdx]  = useState(1);
  const [progress, setProgress]    = useState(0);
  const [statusMsg, setStatusMsg]  = useState("Ready to scan");
  const [visibleCount, setVisible] = useState(0);
  const [selected, setSelected]    = useState<ScanProduct|null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const radius = RADIUS_STEPS[radiusIdx];
  const thumb  = getImg(product);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  useEffect(() => {
    if (phase !== "results" || results.length === 0) return;
    setVisible(0);
    let i = 0;
    const t = setInterval(() => { i++; setVisible(i); if (i >= results.length) clearInterval(t); }, 140);
    return () => clearInterval(t);
  }, [phase, results]);

  const startScan = useCallback(async () => {
    setPhase("scanning"); setProgress(0); setResults([]); setVisible(0); setSelected(null);
    const MSGS = ["Initialising radar…","Scanning nearby listings…","Matching preferences…","Calculating compatibility…","Almost there…"];
    let tick = 0;
    intervalRef.current = setInterval(() => {
      tick++;
      setProgress(Math.min(tick * 4, 92));
      setStatusMsg(MSGS[Math.min(Math.floor(tick / 6), MSGS.length - 1)]);
    }, 120);
    try {
      const res = await fetch(`${BASE}scan/${product.id}/?radius=${radius}`, { credentials: "include" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Scan failed");
      const data: ScanProduct[] = await res.json();
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);
      setStatusMsg(`Found ${data.length} match${data.length !== 1 ? "es" : ""}!`);
      await new Promise(r => setTimeout(r, 500));
      setResults(data); setPhase("results");
    } catch (e: any) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPhase("error"); setStatusMsg(e.message || "Scan failed");
    }
  }, [product.id, radius]);

  const isScanning = phase === "scanning";
  const scoreColor = (s: number) => s >= 80 ? "var(--success)" : s >= 50 ? "var(--warning)" : "var(--text-muted)";

  return (
    <div className={styles.scannerPanel}>
      {/* Header */}
      <div className={styles.scannerHeader}>
        <div className={styles.scannerHeaderLeft}>
          <Radar size={15} className={`${styles.radarIcon} ${isScanning ? styles.radarIconSpin : ""}`} />
          <div>
            <div className={styles.scannerTitle}>Barter Scan</div>
            <div className={styles.scannerSub}>
              <span className={styles.scannerProduct}>{product.title}</span>
            </div>
          </div>
        </div>
        <button className={styles.scannerClose} onClick={onClose} title="Close scanner">
          <X size={14} />
        </button>
      </div>

      <div className={styles.scannerBody}>
        {/* LEFT: radar + controls */}
        <div className={styles.scannerLeft}>
          <div className={styles.radarPanel}>
            <RadarRings scanning={isScanning} />
            {results.slice(0, visibleCount).map((p, i) => (
              <RadarBlip key={p.id} product={p} index={i} total={results.length} onClick={() => setSelected(p)} />
            ))}
            {thumb && (
              <div className={styles.radarCenter}>
                <img src={thumb} alt={product.title} />
              </div>
            )}
            <div className={styles.radarOverlay}>
              <div className={`${styles.radarStatus} ${isScanning ? styles.radarStatusPulse : ""}`}>
                {isScanning && <Wifi size={10} className={styles.wifiSpin} />}
                {statusMsg}
              </div>
            </div>
          </div>

          {(isScanning || phase === "results") && (
            <div className={styles.progressWrap}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` } as React.CSSProperties} />
              </div>
              <span className={styles.progressPct}>{progress}%</span>
            </div>
          )}

          <div className={styles.radiusSection}>
            <div className={styles.radiusHeader}>
              <SlidersHorizontal size={11} />
              <span>Radius</span>
              <span className={styles.radiusValue}>{radius}km</span>
            </div>
            <div className={styles.radiusSlider}>
              {RADIUS_STEPS.map((step, i) => (
                <button
                  key={step}
                  className={`${styles.radiusStep} ${i === radiusIdx ? styles.radiusStepActive : ""}`}
                  onClick={() => setRadiusIdx(i)}
                  disabled={isScanning}
                >
                  {step}<span>km</span>
                </button>
              ))}
            </div>
          </div>

          <button
            className={`${styles.scanBtn} ${isScanning ? styles.scanBtnBusy : ""}`}
            onClick={startScan}
            disabled={isScanning}
          >
            {isScanning
              ? <><div className={styles.scanBtnSpinner} />Scanning…</>
              : phase === "results"
              ? <><RefreshCw size={13} />Rescan</>
              : <><Radar size={13} />Start Scan</>}
          </button>
        </div>

        {/* RIGHT: results OR match detail */}
        <div className={styles.scannerRight}>
          {selected ? (
            <div className={styles.detailPanel}>
              <div className={styles.detailNav}>
                <button className={styles.detailBack} onClick={() => setSelected(null)}>
                  <ChevronLeft size={12} /> Results
                </button>
                {/* ✅ Opens your existing ProductDetailPage */}
                <button
                  className={styles.detailViewBtn}
                  onClick={() => onViewProduct(selected.id)}
                >
                  <ExternalLink size={11} /> View product
                </button>
              </div>

              <div className={styles.detailScroll}>
                {/* Hero */}
                <div className={styles.detailHero}>
                  <div className={styles.detailImgWrap}>
                    {selected.thumbnail || selected.image
                      ? <img className={styles.detailImg} src={selected.thumbnail || selected.image} alt={selected.title} />
                      : <div className={styles.detailImgEmpty}><Package size={20} /></div>}
                    <div className={styles.detailScoreRing} style={{ "--sc": scoreColor(selected.match_score ?? 0) } as React.CSSProperties}>
                      <span style={{ color: scoreColor(selected.match_score ?? 0) }}>{selected.match_score ?? 0}</span>
                      <small>/100</small>
                    </div>
                  </div>
                  <div className={styles.detailMeta}>
                    <div className={styles.detailCat}>{selected.category}</div>
                    <h4 className={styles.detailTitle}>{selected.title}</h4>
                    {selected.description && <p className={styles.detailDesc}>{selected.description}</p>}
                    <div className={styles.detailPills}>
                      {selected.distance_km != null && (
                        <span className={styles.detailPill}>
                          <MapPin size={8} />
                          {selected.distance_km < 1 ? `${Math.round(selected.distance_km*1000)}m` : `${selected.distance_km.toFixed(1)}km`}
                        </span>
                      )}
                      {selected.owner_name && <span className={styles.detailPill}>{selected.owner_name}</span>}
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                {selected.match_breakdown && (
                  <div className={styles.breakdownWrap}>
                    <div className={styles.breakdownTitle}>Why it matched</div>
                    {selected.match_breakdown.reasons.map(r => {
                      const Icon  = CRITERION_ICON[r.criterion] ?? Zap;
                      const color = CRITERION_COLOR[r.criterion] ?? "var(--purple)";
                      return (
                        <div key={r.criterion} className={styles.reasonCard}>
                          <div className={styles.reasonHeader}>
                            <div className={styles.reasonIcon} style={{ "--c": color } as React.CSSProperties}><Icon size={11} /></div>
                            <span className={styles.reasonLabel}>{r.label}</span>
                            <span className={styles.reasonScore} style={{ color } as React.CSSProperties}>+{r.score}</span>
                          </div>
                          <ScoreBar score={r.score} max={r.max_score} color={color} />
                          <p className={styles.reasonDetail}>{r.detail}</p>
                          {r.matched_terms.length > 0 && (
                            <div className={styles.termChips}>
                              {r.matched_terms.map(t => (
                                <span key={t} className={styles.termChip} style={{ "--c": color } as React.CSSProperties}>{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className={styles.totalRow}>
                      <span className={styles.totalLabel}>Total</span>
                      <div className={styles.totalBarWrap}>
                        <div className={styles.totalBarTrack}>
                          <div className={styles.totalBarFill} style={{ width: `${selected.match_score}%`, "--sc": scoreColor(selected.match_score ?? 0) } as React.CSSProperties} />
                        </div>
                        <span className={styles.totalPct} style={{ color: scoreColor(selected.match_score ?? 0) }}>{selected.match_score}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wants */}
                {selected.replace_options && selected.replace_options.length > 0 && (
                  <div className={styles.wantsWrap}>
                    <div className={styles.breakdownTitle}>They want in return</div>
                    <div className={styles.wantsChips}>
                      {selected.replace_options.map(o => (
                        <span key={o} className={styles.wantChip}><Repeat2 size={8} />{o}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* List view */
            <>
              <div className={styles.resultsHeader}>
                <span className={styles.resultsTitle}>
                  {phase === "idle"     && "Hit scan to find trades"}
                  {phase === "scanning" && "Scanning…"}
                  {phase === "results"  && `${results.length} match${results.length !== 1 ? "es" : ""} found`}
                  {phase === "error"    && "Scan failed"}
                </span>
                {phase === "results" && results.length > 0 && (
                  <span className={styles.resultsSub}>by compatibility</span>
                )}
              </div>
              <div className={styles.resultsList}>
                {phase === "idle" && (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIconWrap}><Radar size={32} /><div className={styles.emptyPulse} /></div>
                    <p className={styles.emptyTitle}>Start scanning</p>
                    <p className={styles.emptySub}>We'll match this product against nearby listings and score compatibility.</p>
                  </div>
                )}
                {phase === "scanning" && [1,2,3,4].map((_,i) => (
                  <div key={i} className={styles.skelCard} style={{ animationDelay: `${i*0.08}s` } as React.CSSProperties}>
                    <div className={styles.skelImg} />
                    <div className={styles.skelLines}>
                      <div className={styles.skelLine} style={{ width: "35%" }} />
                      <div className={styles.skelLine} style={{ width: "72%", height: 13 }} />
                      <div className={styles.skelLine} style={{ width: "48%" }} />
                    </div>
                  </div>
                ))}
                {phase === "error" && (
                  <div className={styles.emptyState}>
                    <AlertTriangle size={30} color="var(--danger)" />
                    <p className={styles.emptyTitle}>Scan failed</p>
                    <p className={styles.emptySub}>{statusMsg}</p>
                    <button className={styles.retryBtn} onClick={startScan}><RefreshCw size={11} />Try again</button>
                  </div>
                )}
                {phase === "results" && results.length === 0 && (
                  <div className={styles.emptyState}>
                    <Package size={30} color="var(--text-muted)" />
                    <p className={styles.emptyTitle}>No matches found</p>
                    <p className={styles.emptySub}>Try expanding the scan radius.</p>
                  </div>
                )}
                {phase === "results" && results.slice(0, visibleCount).map((p, i) => {
                  const score = p.match_score ?? 0;
                  const img   = p.thumbnail || p.image;
                  const top   = p.match_breakdown?.top_label;
                  const topC  = p.match_breakdown?.top_criterion;
                  return (
                    <div key={p.id} className={styles.matchCard}
                      style={{ animationDelay: `${i*0.08}s` } as React.CSSProperties}
                      onClick={() => setSelected(p)}
                    >
                      <div className={styles.matchImgWrap}>
                        <div className={styles.matchImg}>
                          {img ? <img src={img} alt={p.title} /> : <Package size={16} />}
                        </div>
                        <div className={`${styles.scoreBadge} ${score >= 80 ? styles.scoreBadgeHigh : score >= 50 ? styles.scoreBadgeMid : styles.scoreBadgeLow}`}>
                          <Zap size={8} />{score}%
                        </div>
                      </div>
                      <div className={styles.matchInfo}>
                        <div className={styles.matchCat}>{p.category}</div>
                        <div className={styles.matchTitle}>{p.title}</div>
                        <div className={styles.matchMeta}>
                          {p.distance_km != null && (
                            <span className={styles.matchMetaItem}>
                              <MapPin size={8} />
                              {p.distance_km < 1 ? `${Math.round(p.distance_km*1000)}m` : `${p.distance_km.toFixed(1)}km`}
                            </span>
                          )}
                          {p.owner_name && <span className={styles.matchMetaItem}>{p.owner_name}</span>}
                        </div>
                        {top && (
                          <div className={styles.topReasonPill} style={{ "--c": topC ? CRITERION_COLOR[topC] : "var(--purple)" } as React.CSSProperties}>
                            {(() => { const Icon = CRITERION_ICON[topC ?? ""] ?? Zap; return <Icon size={7} />; })()}
                            {top}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={12} className={styles.matchArrow} />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PRODUCT LIST PANEL
═══════════════════════════════════════════ */
function ProductListPanel({
  onSelectProduct,
  activeProductId,
}: {
  onSelectProduct: (p: UserProduct) => void;
  activeProductId: number | null;
}) {
  const [products, setProducts]  = useState<UserProduct[]>([]);
  const [loading, setLoading]    = useState(true);
  const [error, setError]        = useState<string|null>(null);
  const [search, setSearch]      = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${BASE}products/products_by_status/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      const raw: UserProduct[] = await res.json();
      setProducts(raw.map(p => ({ ...p, status: normalizeStatus(p.status) })));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.productListPanel}>
      <div className={styles.plHeader}>
        <div className={styles.plTitle}>My Products</div>
        <button className={styles.plRefresh} onClick={load} disabled={loading} title="Refresh">
          <RefreshCw size={12} className={loading ? styles.spin : ""} />
        </button>
      </div>

      <div className={styles.plSearch}>
        <Search size={12} className={styles.plSearchIcon} />
        <input
          className={styles.plSearchInput}
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.plList}>
        {loading ? (
          [1,2,3,4,5].map((_,i) => (
            <div key={i} className={styles.plSkelCard} style={{ animationDelay: `${i*0.06}s` } as React.CSSProperties}>
              <div className={styles.plSkelImg} />
              <div className={styles.plSkelLines}>
                <div className={styles.plSkelLine} style={{ width: "60%" }} />
                <div className={styles.plSkelLine} style={{ width: "40%" }} />
              </div>
            </div>
          ))
        ) : error ? (
          <div className={styles.plEmpty}>
            <AlertTriangle size={22} color="var(--danger)" />
            <p>{error}</p>
            <button className={styles.retryBtn} onClick={load}><RefreshCw size={11} />Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.plEmpty}>
            <Package size={22} color="var(--text-muted)" />
            <p>{search ? "No results" : "No products yet"}</p>
          </div>
        ) : filtered.map((p, i) => {
          const st     = STATUS_META[p.status];
          const img    = getImg(p);
          const active = activeProductId === p.id;
          return (
            <div
              key={p.id}
              className={`${styles.plCard} ${active ? styles.plCardActive : ""}`}
              style={{ animationDelay: `${i*0.05}s` } as React.CSSProperties}
            >
              <div className={styles.plCardImg}>
                {img ? <img src={img} alt={p.title} /> : <Package size={14} />}
              </div>
              <div className={styles.plCardInfo}>
                <div className={styles.plCardTitle}>{p.title}</div>
                <div className={styles.plCardMeta}>
                  <span className={styles.plCardCat}>{p.category.name}</span>
                  <span className={styles.plStatusPill} style={{ color: st.color, background: st.bg } as React.CSSProperties}>
                    <st.Icon size={8} />{st.label}
                  </span>
                </div>
              </div>
              {p.status === "Approved" && (
                <button
                  className={`${styles.plScanBtn} ${active ? styles.plScanBtnActive : ""}`}
                  onClick={() => onSelectProduct(p)}
                  title="Scan for matches"
                >
                  <Radar size={13} />
                  <span>{active ? "Scanning" : "Scan"}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN EXPORT — ChatProductPanel
═══════════════════════════════════════════ */
export default function ChatProductPanel({ onClose, onNavigate }: ChatProductPanelProps) {
  const [scanTarget, setScanTarget]       = useState<UserProduct|null>(null);
  const [viewProductId, setViewProductId] = useState<number|null>(null);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (viewProductId !== null) { setViewProductId(null); return; }
        if (scanTarget) { setScanTarget(null); return; }
        onClose();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, scanTarget, viewProductId]);

  /* ── When a scan result's "View product" is clicked,
         swap the entire panel for ProductDetailPage.
         "onBack" inside ProductDetailPage returns here. ── */
  

  return (
    <div className={styles.overlay}>
      <div className={styles.overlayAccent} />

      <div className={styles.overlayHeader}>
        <div className={styles.overlayHeaderLeft}>
          <div className={styles.overlayIcon}><Package size={16} /></div>
          <div>
            <div className={styles.overlayTitle}>My Products</div>
            <div className={styles.overlaySub}>
              {scanTarget
                ? <>Scanning · <span className={styles.overlaySubHighlight}>{scanTarget.title}</span></>
                : "Select an approved product to scan for matches"}
            </div>
          </div>
        </div>
        <button className={styles.overlayClose} onClick={onClose} title="Close (Esc)">
          <X size={16} />
        </button>
      </div>

      <div className={styles.overlayBody}>
        <ProductListPanel
          onSelectProduct={setScanTarget}
          activeProductId={scanTarget?.id ?? null}
        />

        <div className={styles.scannerArea}>
          {scanTarget ? (
            <ScannerPanel
              key={scanTarget.id}
              product={scanTarget}
              onClose={() => setScanTarget(null)}
              onViewProduct={setViewProductId}
            />
          ) : (
            <div className={styles.scannerIdle}>
              <div className={styles.scannerIdleIconWrap}>
                <Radar size={36} className={styles.scannerIdleIcon} />
                <div className={styles.scannerIdlePulse} />
              </div>
              <p className={styles.scannerIdleTitle}>Scanner ready</p>
              <p className={styles.scannerIdleSub}>
                Pick an <strong>Approved</strong> product from the left
                and tap <strong>Scan</strong> to find matching trades nearby.
              </p>
            </div>
          )}
        </div>
      </div>
      {viewProductId !== null && (
      <div className={styles.productDetailModal}>
        <ProductDetailPage
          productId={viewProductId}
          onBack={() => setViewProductId(null)}
          onNavigate={onNavigate}
        />
      </div>
    )}
    </div>
  );
}