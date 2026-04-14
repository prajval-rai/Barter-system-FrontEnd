"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, Radar, SlidersHorizontal, MapPin, Repeat2,
  Zap, ChevronRight, RefreshCw, Package,
  AlertTriangle, Wifi, Tag, FileText, Layers,
  Navigation2, ChevronLeft, ExternalLink,
} from "lucide-react";
import styles from "@/styles/Productscanner.module.css";

/* ─── Types ── */
interface MatchReason {
  criterion: "title" | "description" | "category" | "proximity";
  label: string;
  score: number;
  max_score: number;
  matched_terms: string[];
  detail: string;
}

interface MatchBreakdown {
  scores: {
    title: number;
    description: number;
    category: number;
    proximity: number;
  };
  reasons: MatchReason[];
  top_criterion: string | null;
  top_label: string;
}

export interface ScanProduct {
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
  status?: string;
  purchase_year?: number;
  icon?: string;
}

export interface ProductScannerProps {
  productId: number;
  productTitle: string;
  productThumbnail?: string;
  onClose: () => void;
  onViewMatch?: (p: ScanProduct) => void;
}

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const RADIUS_STEPS = [5, 10, 25, 50, 100];

/* ── Criterion icon map ── */
const CRITERION_ICON: Record<string, React.ElementType> = {
  title:       Tag,
  description: FileText,
  category:    Layers,
  proximity:   Navigation2,
};

const CRITERION_COLOR: Record<string, string> = {
  title:       "var(--purple)",
  description: "var(--cyan)",
  category:    "var(--warning)",
  proximity:   "var(--success)",
};

/* ─── Radar rings ── */
function RadarRings({ scanning }: { scanning: boolean }) {
  return (
    <div className={styles.radarWrap}>
      <div className={styles.ring} style={{ "--r": "100%" } as React.CSSProperties} />
      <div className={styles.ring} style={{ "--r": "70%"  } as React.CSSProperties} />
      <div className={styles.ring} style={{ "--r": "42%"  } as React.CSSProperties} />
      <div className={styles.crossH} />
      <div className={styles.crossV} />
      {scanning && <div className={styles.sweep} />}
      {scanning && (
        <>
          <div className={`${styles.pulse} ${styles.pulse1}`} />
          <div className={`${styles.pulse} ${styles.pulse2}`} />
          <div className={`${styles.pulse} ${styles.pulse3}`} />
        </>
      )}
      <div className={styles.centerDot}>
        <div className={styles.centerPing} />
      </div>
    </div>
  );
}

/* ─── Radar blip ── */
function RadarBlip({ product, index, total, onClick }: {
  product: ScanProduct; index: number; total: number; onClick: () => void;
}) {
  const angle  = (index / total) * 360 + (index % 3) * 15;
  const dist   = product.match_score
    ? 10 + (1 - product.match_score / 100) * 35
    : 20 + (index * 7) % 30;
  const rad    = (angle * Math.PI) / 180;
  const x      = 50 + dist * Math.cos(rad);
  const y      = 50 + dist * Math.sin(rad);
  const strong = (product.match_score ?? 0) >= 75;

  return (
    <div
      className={`${styles.blip} ${strong ? styles.blipStrong : ""}`}
      style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${index * 0.18}s` } as React.CSSProperties}
      title={product.title}
      onClick={onClick}
    >
      <div className={styles.blipDot} />
      {strong && <div className={styles.blipRing} />}
    </div>
  );
}

/* ─── Score bar ── */
function ScoreBar({ score, max, color }: { score: number; max: number; color: string }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className={styles.scoreBarWrap}>
      <div className={styles.scoreBarTrack}>
        <div
          className={styles.scoreBarFill}
          style={{ width: `${pct}%`, background: color } as React.CSSProperties}
        />
      </div>
      <span className={styles.scoreBarPct} style={{ color } as React.CSSProperties}>
        {score}/{max}
      </span>
    </div>
  );
}

/* ─── Match detail panel (right side when a product is selected) ── */
function MatchDetailPanel({
  product,
  onBack,
  onView,
}: {
  product: ScanProduct;
  onBack: () => void;
  onView: () => void;
}) {
  const score = product.match_score ?? 0;
  const bd    = product.match_breakdown;
  const img   = product.thumbnail || product.image;

  const scoreColor =
    score >= 80 ? "var(--success)" :
    score >= 50 ? "var(--warning)" :
    "var(--text-muted)";

  return (
    <div className={styles.detailPanel}>
      {/* Back header */}
      <div className={styles.detailHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          <ChevronLeft size={14} /> All results
        </button>
        <button className={styles.viewBtn} onClick={onView}>
          View product <ExternalLink size={12} />
        </button>
      </div>

      <div className={styles.detailScroll}>
        {/* Product hero */}
        <div className={styles.detailHero}>
          {/* Image + score badge */}
          <div className={styles.detailImgWrap}>
            {img
              ? <img className={styles.detailImg} src={img} alt={product.title} />
              : <div className={styles.detailImgEmpty}><Package size={28} /></div>
            }
            <div className={styles.detailScoreRing} style={{ "--sc": scoreColor } as React.CSSProperties}>
              <span style={{ color: scoreColor }}>{score}</span>
              <small>/ 100</small>
            </div>
          </div>

          <div className={styles.detailMeta}>
            <div className={styles.detailCat}>{product.category}</div>
            <h3 className={styles.detailTitle}>{product.title}</h3>
            {product.description && (
              <p className={styles.detailDesc}>{product.description}</p>
            )}
            <div className={styles.detailPills}>
              {product.distance_km != null && (
                <span className={styles.detailPill}>
                  <MapPin size={9} />
                  {product.distance_km < 1
                    ? `${Math.round(product.distance_km * 1000)}m`
                    : `${product.distance_km.toFixed(1)}km`}
                </span>
              )}
              {product.owner_name && (
                <span className={styles.detailPill}>
                  {product.owner_name}
                </span>
              )}
              {product.purchase_year && (
                <span className={styles.detailPill}>{product.purchase_year}</span>
              )}
            </div>
          </div>
        </div>

        {/* Match breakdown */}
        {bd && (
          <div className={styles.breakdownWrap}>
            <div className={styles.breakdownTitle}>Why it matched</div>

            {bd.reasons.map((r) => {
              const Icon  = CRITERION_ICON[r.criterion] ?? Zap;
              const color = CRITERION_COLOR[r.criterion] ?? "var(--purple)";
              return (
                <div key={r.criterion} className={styles.reasonCard}>
                  <div className={styles.reasonHeader}>
                    <div className={styles.reasonIconWrap} style={{ "--c": color } as React.CSSProperties}>
                      <Icon size={12} />
                    </div>
                    <span className={styles.reasonLabel}>{r.label}</span>
                    <span className={styles.reasonScore} style={{ color } as React.CSSProperties}>
                      +{r.score} pts
                    </span>
                  </div>

                  <ScoreBar score={r.score} max={r.max_score} color={color} />

                  <p className={styles.reasonDetail}>{r.detail}</p>

                  {r.matched_terms.length > 0 && (
                    <div className={styles.termChips}>
                      {r.matched_terms.map(t => (
                        <span key={t} className={styles.termChip} style={{ "--c": color } as React.CSSProperties}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Total bar */}
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total match score</span>
              <div className={styles.totalBarWrap}>
                <div className={styles.totalBarTrack}>
                  <div
                    className={styles.totalBarFill}
                    style={{ width: `${score}%`, "--sc": scoreColor } as React.CSSProperties}
                  />
                </div>
                <span className={styles.totalPct} style={{ color: scoreColor }}>{score}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Wants */}
        {product.replace_options && product.replace_options.length > 0 && (
          <div className={styles.wantsWrap}>
            <div className={styles.breakdownTitle}>They want in return</div>
            <div className={styles.wantsChips}>
              {product.replace_options.map(o => (
                <span key={o} className={styles.wantChip}>
                  <Repeat2 size={9} /> {o}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Match result card (list view) ── */
function MatchCard({
  product,
  index,
  onView,
}: {
  product: ScanProduct;
  index: number;
  onView: () => void;
}) {
  const score = product.match_score ?? 0;
  const img   = product.thumbnail || product.image;
  const top   = product.match_breakdown?.top_label;
  const topCriterion = product.match_breakdown?.top_criterion;
  const topColor = topCriterion ? CRITERION_COLOR[topCriterion] : "var(--text-muted)";

  return (
    <div
      className={styles.matchCard}
      style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}
      onClick={onView}
    >
      {/* Image + badge wrapper — badge sits OUTSIDE the clipped img div */}
      <div className={styles.matchImgWrap}>
        <div className={styles.matchImg}>
          {img
            ? <img src={img} alt={product.title} />
            : <div className={styles.matchImgEmpty}><Package size={20} /></div>
          }
        </div>
        <div className={`${styles.scoreBadge} ${
          score >= 80 ? styles.scoreBadgeHigh :
          score >= 50 ? styles.scoreBadgeMid  :
          styles.scoreBadgeLow
        }`}>
          <Zap size={9} /> {score}%
        </div>
      </div>

      {/* Info */}
      <div className={styles.matchInfo}>
        <div className={styles.matchCat}>{product.category}</div>
        <div className={styles.matchTitle}>{product.title}</div>

        <div className={styles.matchMeta}>
          {product.distance_km != null && (
            <span className={styles.matchMetaItem}>
              <MapPin size={9} />
              {product.distance_km < 1
                ? `${Math.round(product.distance_km * 1000)}m`
                : `${product.distance_km.toFixed(1)}km`}
            </span>
          )}
          {product.owner_name && (
            <span className={styles.matchMetaItem}>{product.owner_name}</span>
          )}
        </div>

        {/* Top match reason pill */}
        {top && (
          <div className={styles.topReasonPill} style={{ "--c": topColor } as React.CSSProperties}>
            {(() => {
              const Icon = CRITERION_ICON[topCriterion ?? ""] ?? Zap;
              return <Icon size={8} />;
            })()}
            {top}
          </div>
        )}
      </div>

      <ChevronRight size={14} className={styles.matchArrow} />
    </div>
  );
}

/* ════════════════════════════
   MAIN COMPONENT
════════════════════════════ */
export default function ProductScanner({
  productId,
  productTitle,
  productThumbnail,
  onClose,
  onViewMatch,
}: ProductScannerProps) {
  const [phase, setPhase]           = useState<"idle" | "scanning" | "results" | "error">("idle");
  const [results, setResults]       = useState<ScanProduct[]>([]);
  const [radiusIdx, setRadiusIdx]   = useState(1);
  const [progress, setProgress]     = useState(0);
  const [statusMsg, setStatusMsg]   = useState("Ready to scan");
  const [visibleCount, setVisible]  = useState(0);
  const [selected, setSelected]     = useState<ScanProduct | null>(null);
  const intervalRef                 = useRef<ReturnType<typeof setInterval> | null>(null);
  const radius                      = RADIUS_STEPS[radiusIdx];

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  /* Reveal cards one-by-one */
  useEffect(() => {
    if (phase !== "results" || results.length === 0) return;
    setVisible(0);
    let i = 0;
    const t = setInterval(() => {
      i++;
      setVisible(i);
      if (i >= results.length) clearInterval(t);
    }, 160);
    return () => clearInterval(t);
  }, [phase, results]);

  /* Start scan */
  const startScan = useCallback(async () => {
    setPhase("scanning");
    setProgress(0);
    setResults([]);
    setVisible(0);
    setSelected(null);

    const MESSAGES = [
      "Initialising radar…",
      "Scanning nearby listings…",
      "Matching exchange preferences…",
      "Calculating compatibility…",
      "Almost there…",
    ];
    let tick = 0;
    intervalRef.current = setInterval(() => {
      tick++;
      setProgress(Math.min(tick * 4, 92));
      setStatusMsg(MESSAGES[Math.min(Math.floor(tick / 6), MESSAGES.length - 1)]);
    }, 120);

    try {
      const res = await fetch(
        `${BASE}scan/${productId}/?radius=${radius}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Scan failed");
      }
      const data: ScanProduct[] = await res.json();

      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);
      setStatusMsg(`Found ${data.length} match${data.length !== 1 ? "es" : ""}!`);
      await new Promise(r => setTimeout(r, 500));
      setResults(data);
      setPhase("results");
    } catch (e: any) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPhase("error");
      setStatusMsg(e.message || "Scan failed");
    }
  }, [productId, radius]);

  /* ESC to close */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selected) setSelected(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, selected]);

  const isScanning = phase === "scanning";

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Radar size={18} className={`${styles.headerIcon} ${isScanning ? styles.headerIconSpin : ""}`} />
            <div>
              <div className={styles.headerTitle}>Barter Scan</div>
              <div className={styles.headerSub}>
                scanning for <span className={styles.headerProduct}>{productTitle}</span>
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>

          {/* LEFT col */}
          <div className={styles.leftCol}>
            <div className={styles.radarPanel}>
              <RadarRings scanning={isScanning} />

              {results.slice(0, visibleCount).map((p, i) => (
                <RadarBlip
                  key={p.id}
                  product={p}
                  index={i}
                  total={results.length}
                  onClick={() => setSelected(p)}
                />
              ))}

              {productThumbnail && (
                <div className={styles.radarCenter}>
                  <img src={productThumbnail} alt={productTitle} />
                </div>
              )}

              <div className={styles.radarOverlay}>
                <div className={`${styles.radarStatus} ${isScanning ? styles.radarStatusPulse : ""}`}>
                  {isScanning && <Wifi size={11} className={styles.wifiSpin} />}
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
                <SlidersHorizontal size={13} />
                <span>Scan radius</span>
                <span className={styles.radiusValue}>{radius} km</span>
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
              <div className={styles.radiusTrack}>
                <div className={styles.radiusTrackFill}
                  style={{ width: `${(radiusIdx / (RADIUS_STEPS.length - 1)) * 100}%` } as React.CSSProperties} />
                <div className={styles.radiusThumb}
                  style={{ left: `${(radiusIdx / (RADIUS_STEPS.length - 1)) * 100}%` } as React.CSSProperties} />
              </div>
              <div className={styles.radiusHint}>
                <MapPin size={10} /> products within {radius}km of your location
              </div>
            </div>

            <button
              className={`${styles.scanBtn} ${isScanning ? styles.scanBtnBusy : ""}`}
              onClick={startScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <><div className={styles.scanBtnSpinner} /> Scanning…</>
              ) : phase === "results" ? (
                <><RefreshCw size={15} /> Rescan</>
              ) : (
                <><Radar size={15} /> Start Scan</>
              )}
            </button>
          </div>

          {/* RIGHT col — list OR detail panel */}
          <div className={styles.rightCol}>
            {selected ? (
              /* ── Detail view ── */
              <MatchDetailPanel
                product={selected}
                onBack={() => setSelected(null)}
                onView={() => { onViewMatch?.(selected); setSelected(null); }}
              />
            ) : (
              /* ── List view ── */
              <>
                <div className={styles.resultsHeader}>
                  <span className={styles.resultsTitle}>
                    {phase === "idle"     && "Matches will appear here"}
                    {phase === "scanning" && "Scanning…"}
                    {phase === "results"  && `${results.length} match${results.length !== 1 ? "es" : ""} found`}
                    {phase === "error"    && "Scan failed"}
                  </span>
                  {phase === "results" && results.length > 0 && (
                    <span className={styles.resultsSub}>sorted by compatibility</span>
                  )}
                </div>

                <div className={styles.resultsList}>
                  {phase === "idle" && (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyRadarIcon}>
                        <Radar size={40} />
                        <div className={styles.emptyPulse} />
                      </div>
                      <p className={styles.emptyTitle}>Hit scan to find trades</p>
                      <p className={styles.emptySub}>
                        We'll match your product's exchange preferences against
                        nearby listings and score compatibility.
                      </p>
                    </div>
                  )}

                  {phase === "scanning" && (
                    <div className={styles.skeletonList}>
                      {[1,2,3,4,5].map((_, i) => (
                        <div key={i} className={styles.skelMatchCard}
                          style={{ animationDelay: `${i * 0.1}s` } as React.CSSProperties}>
                          <div className={styles.skelImg} />
                          <div className={styles.skelLines}>
                            <div className={styles.skelLine} style={{ width: "35%" }} />
                            <div className={styles.skelLine} style={{ width: "75%", height: 14 }} />
                            <div className={styles.skelLine} style={{ width: "50%" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {phase === "error" && (
                    <div className={styles.emptyState}>
                      <AlertTriangle size={36} color="var(--danger)" />
                      <p className={styles.emptyTitle}>Scan failed</p>
                      <p className={styles.emptySub}>{statusMsg}</p>
                      <button className={styles.retryBtn} onClick={startScan}>
                        <RefreshCw size={13} /> Try again
                      </button>
                    </div>
                  )}

                  {phase === "results" && results.length === 0 && (
                    <div className={styles.emptyState}>
                      <Package size={36} color="var(--text-muted)" />
                      <p className={styles.emptyTitle}>No matches found</p>
                      <p className={styles.emptySub}>Try expanding the scan radius or check back later.</p>
                    </div>
                  )}

                  {phase === "results" && results.slice(0, visibleCount).map((p, i) => (
                    <MatchCard
                      key={p.id}
                      product={p}
                      index={i}
                      onView={() => setSelected(p)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}