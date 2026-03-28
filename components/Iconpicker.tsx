"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface IconPickerProps {
  value: string;          // current icon name e.g. "mdi:camera"
  onChange: (icon: string) => void;
  placeholder?: string;
}

interface IconResult {
  prefix: string;
  name: string;
}

/* ─────────────────────────────────────────────
   Popular icon sets (prefix → label)
───────────────────────────────────────────── */
const SETS: { prefix: string; label: string; emoji: string }[] = [
  { prefix: "",            label: "All",         emoji: "🌐" },
  { prefix: "mdi",         label: "Material",    emoji: "🎨" },
  { prefix: "lucide",      label: "Lucide",      emoji: "✦"  },
  { prefix: "tabler",      label: "Tabler",      emoji: "⬡"  },
  { prefix: "heroicons",   label: "Heroicons",   emoji: "🦸" },
  { prefix: "ph",          label: "Phosphor",    emoji: "⚗️" },
  { prefix: "ri",          label: "Remix",       emoji: "🎵" },
  { prefix: "fluent",      label: "Fluent",      emoji: "🌊" },
  { prefix: "carbon",      label: "Carbon",      emoji: "⬛" },
  { prefix: "ant-design",  label: "Ant Design",  emoji: "🐜" },
];

/* ─────────────────────────────────────────────
   Fetch helpers
───────────────────────────────────────────── */
const searchIcons = async (query: string, prefix: string, limit = 48): Promise<IconResult[]> => {
  if (!query.trim()) return [];
  const prefixParam = prefix ? `&prefix=${prefix}` : "";
  const url = `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=${limit}${prefixParam}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  // data.icons is an array of "prefix:name" strings
  return (data.icons ?? []).map((s: string) => {
    const [p, ...rest] = s.split(":");
    return { prefix: p, name: rest.join(":") };
  });
};

const getIconUrl = (prefix: string, name: string, color = "currentColor") =>
  `https://api.iconify.design/${prefix}/${name}.svg?color=${encodeURIComponent(color)}`;

/* ─────────────────────────────────────────────
   Default icons shown before search
───────────────────────────────────────────── */
const DEFAULTS: IconResult[] = [
  { prefix: "mdi", name: "camera" },
  { prefix: "mdi", name: "laptop" },
  { prefix: "mdi", name: "headphones" },
  { prefix: "mdi", name: "cellphone" },
  { prefix: "mdi", name: "television" },
  { prefix: "mdi", name: "guitar-electric" },
  { prefix: "mdi", name: "book-open-page-variant" },
  { prefix: "mdi", name: "bicycle" },
  { prefix: "mdi", name: "shoe-heel" },
  { prefix: "mdi", name: "watch" },
  { prefix: "mdi", name: "sofa" },
  { prefix: "mdi", name: "car" },
  { prefix: "mdi", name: "dumbbell" },
  { prefix: "mdi", name: "gamepad-variant" },
  { prefix: "mdi", name: "palette" },
  { prefix: "mdi", name: "drone" },
  { prefix: "mdi", name: "keyboard" },
  { prefix: "mdi", name: "printer" },
  { prefix: "mdi", name: "microphone" },
  { prefix: "mdi", name: "telescope" },
  { prefix: "mdi", name: "leaf" },
  { prefix: "mdi", name: "diamond-stone" },
  { prefix: "mdi", name: "coffee-maker" },
  { prefix: "mdi", name: "sword" },
  { prefix: "mdi", name: "robot" },
  { prefix: "mdi", name: "airplane" },
  { prefix: "mdi", name: "snowboard" },
  { prefix: "mdi", name: "violin" },
  { prefix: "mdi", name: "microscope" },
  { prefix: "mdi", name: "chess-rook" },
  { prefix: "mdi", name: "cards" },
  { prefix: "mdi", name: "hammer-wrench" },
  { prefix: "mdi", name: "star-four-points" },
  { prefix: "mdi", name: "crystal-ball" },
  { prefix: "mdi", name: "trophy" },
  { prefix: "mdi", name: "fire" },
  { prefix: "mdi", name: "lightning-bolt" },
  { prefix: "mdi", name: "shield-star" },
  { prefix: "mdi", name: "flower-tulip" },
  { prefix: "mdi", name: "cat" },
  { prefix: "mdi", name: "dog" },
  { prefix: "mdi", name: "rocket-launch" },
  { prefix: "mdi", name: "fingerprint" },
  { prefix: "mdi", name: "currency-btc" },
  { prefix: "mdi", name: "headset" },
  { prefix: "mdi", name: "monitor-screenshot" },
  { prefix: "mdi", name: "tag-heart" },
  { prefix: "mdi", name: "briefcase" },
];

/* ─────────────────────────────────────────────
   Icon Picker Component
───────────────────────────────────────────── */
export default function IconPicker({ value, onChange, placeholder = "Search 200,000+ icons..." }: IconPickerProps) {
  const [open, setOpen]           = useState(false);
  const [query, setQuery]         = useState("");
  const [activeSet, setActiveSet] = useState("");
  const [results, setResults]     = useState<IconResult[]>(DEFAULTS);
  const [loading, setLoading]     = useState(false);
  const [recent, setRecent]       = useState<IconResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  /* Parse stored value */
  const [valPrefix, valName] = value?.includes(":") ? value.split(":") : ["", value ?? ""];

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Auto-focus search on open */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
    else setQuery("");
  }, [open]);

  /* Search with debounce */
  const doSearch = useCallback(async (q: string, set: string) => {
    if (!q.trim()) { setResults(DEFAULTS); return; }
    setLoading(true);
    try {
      const found = await searchIcons(q, set);
      setResults(found);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query, activeSet), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, activeSet, doSearch]);

  const handleSelect = (icon: IconResult) => {
    const key = `${icon.prefix}:${icon.name}`;
    onChange(key);
    setRecent(prev => [icon, ...prev.filter(r => `${r.prefix}:${r.name}` !== key)].slice(0, 12));
    setOpen(false);
  };

  /* ── Trigger button ── */
  const TriggerBtn = () => (
    <button
      type="button"
      onClick={() => setOpen(p => !p)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 16px", borderRadius: 12, cursor: "pointer",
        background: "var(--surface)", border: "1px solid var(--border)",
        transition: "all 0.15s", width: "100%", fontFamily: "inherit",
        color: "var(--text-secondary)", fontSize: 13, fontWeight: 500,
      }}
    >
      {value ? (
        <>
          <img
            src={getIconUrl(valPrefix, valName, "#2563eb")}
            alt={value}
            style={{ width: 28, height: 28, flexShrink: 0 }}
          />
          <span style={{ flex: 1, textAlign: "left", color: "var(--text-primary)", fontWeight: 600 }}>
            {valName}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
            {valPrefix}
          </span>
        </>
      ) : (
        <>
          <span style={{ fontSize: 22, opacity: 0.4 }}>🔍</span>
          <span style={{ flex: 1, textAlign: "left", color: "var(--text-muted)" }}>
            Click to pick an icon (200,000+ available)
          </span>
        </>
      )}
      <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
        {open ? "▲" : "▼"}
      </span>
    </button>
  );

  /* ── Icon grid item ── */
  const IconItem = ({ icon }: { icon: IconResult }) => {
    const key = `${icon.prefix}:${icon.name}`;
    const isActive = key === value;
    return (
      <button
        type="button"
        title={`${icon.name} (${icon.prefix})`}
        onClick={() => handleSelect(icon)}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 4, padding: "10px 6px", borderRadius: 10, cursor: "pointer",
          border: isActive ? "2px solid var(--gold)" : "1.5px solid var(--border)",
          background: isActive ? "var(--gold-dim)" : "var(--black-light)",
          transition: "all 0.12s", minWidth: 0, aspectRatio: "1",
        }}
        onMouseEnter={e => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.background = "var(--surface)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--gold-border)";
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.background = "var(--black-light)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          }
        }}
      >
        <img
          src={getIconUrl(icon.prefix, icon.name, isActive ? "#2563eb" : "#4a3d80")}
          alt={icon.name}
          style={{ width: 24, height: 24, flexShrink: 0 }}
          loading="lazy"
        />
        <span style={{
          fontSize: 9, color: isActive ? "var(--gold)" : "var(--text-muted)",
          maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis",
          whiteSpace: "nowrap", lineHeight: 1.2, textAlign: "center",
        }}>
          {icon.name.length > 12 ? icon.name.slice(0, 12) + "…" : icon.name}
        </span>
      </button>
    );
  };

  return (
    <div ref={panelRef} style={{ position: "relative", width: "100%" }}>
      <TriggerBtn />

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
          background: "var(--black-light)", border: "1px solid var(--border)",
          borderRadius: 16, boxShadow: "0 16px 60px rgba(0,0,0,0.2)",
          zIndex: 500, overflow: "hidden",
          animation: "fadeIn 0.15s ease",
        }}>

          {/* Search bar */}
          <div style={{
            padding: "14px 14px 10px", borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
          }}>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                fontSize: 15, pointerEvents: "none", color: "var(--text-muted)",
              }}>🔍</span>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={placeholder}
                style={{
                  width: "100%", padding: "9px 12px 9px 38px", borderRadius: 10,
                  border: "1px solid var(--border)", background: "var(--black-light)",
                  color: "var(--text-primary)", fontSize: 13, outline: "none",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", fontSize: 14, padding: 2,
                }}>✕</button>
              )}
            </div>

            {/* Icon set filters */}
            <div style={{ display: "flex", gap: 6, marginTop: 10, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
              {SETS.map(s => (
                <button
                  key={s.prefix}
                  type="button"
                  onClick={() => setActiveSet(s.prefix)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 11px", borderRadius: 999, fontSize: 11.5, fontWeight: 600,
                    cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
                    border: activeSet === s.prefix ? "1.5px solid var(--gold)" : "1.5px solid var(--border)",
                    background: activeSet === s.prefix ? "var(--gold-dim)" : "transparent",
                    color: activeSet === s.prefix ? "var(--gold)" : "var(--text-muted)",
                    transition: "all 0.12s",
                  }}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results area */}
          <div style={{ padding: 12, maxHeight: 360, overflowY: "auto" }}>

            {/* Loading */}
            {loading && (
              <div style={{ display: "flex", justifyContent: "center", padding: "28px 0", gap: 6 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: "50%", background: "var(--gold)",
                    animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            )}

            {/* Recently used */}
            {!loading && !query && recent.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
                  Recently Used
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(58px, 1fr))", gap: 6, marginBottom: 16 }}>
                  {recent.map(icon => <IconItem key={`${icon.prefix}:${icon.name}`} icon={icon} />)}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
                  Popular
                </div>
              </>
            )}

            {/* No query label */}
            {!loading && !query && recent.length === 0 && (
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
                Popular Icons
              </div>
            )}

            {/* Query label */}
            {!loading && query && results.length > 0 && (
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
                {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
              </div>
            )}

            {/* Icon grid */}
            {!loading && results.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(58px, 1fr))", gap: 6 }}>
                {results.map(icon => <IconItem key={`${icon.prefix}:${icon.name}`} icon={icon} />)}
              </div>
            )}

            {/* Empty */}
            {!loading && results.length === 0 && query && (
              <div style={{ textAlign: "center", padding: "32px 16px" }}>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>🔍</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>No icons found for "{query}"</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Try a different keyword or icon set</div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "8px 14px", borderTop: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--surface)",
          }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Powered by <a href="https://iconify.design" target="_blank" rel="noreferrer"
                style={{ color: "var(--gold)", textDecoration: "none" }}>Iconify</a> · 200,000+ icons
            </span>
            {value && (
              <button type="button" onClick={() => onChange("")} style={{
                fontSize: 11, color: "var(--danger)", background: "none",
                border: "none", cursor: "pointer", fontFamily: "inherit",
              }}>
                ✕ Clear
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}