"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, ArrowLeft, Check, Upload, X, Plus, Trash2,
  Package, Tag, FileText, Image as ImageIcon, Repeat2,
  ChevronDown, Search, Loader2, Eye, Layers, Camera,
  Lightbulb, Calendar, IndianRupee,
  TrendingUp, Music, BookOpen, Home, Dumbbell, Palette, Shirt,
  Trophy, Box, Laptop, Zap, Star, CircleDot,
  Utensils, Car, Gamepad2, Gem, Headphones, Watch, Bike,
  Sofa, Tv, Smartphone, Baby, Flower2, Coffee, Plane,
  Hammer, Wrench, Heart, Globe, ShoppingBag, Leaf, Sun, Moon,
  LayoutGrid, RefreshCw, AlertCircle, TrendingDown, Send,
  Sparkles, CheckCircle2, BookMarked, ImagePlus, DollarSign, ArrowUpRight,
} from "lucide-react";
import styles from "@/styles/AddProduct.module.css";
import BarterLoader from "@/components/Barterloader";
import ProductPreviewCard from "./Productpreviewcard";
import CompleteProfileModal from "@/components/Completeprofilemodal";
import { useAuth } from "@/context/AuthContext";
import { Icon } from '@iconify/react';


/* ─── Types ──────────────────────────────────────── */
interface ReplaceOption {
  category_id: number | "";
  title: string;
  description?: string;
  icon: string;
}
interface AddProductProps { onNavigate: (id: string) => void; }
interface ApiCategory { id: number; name: string; icon?: string; }

/* ─── Chapter transition config ─────────────────── */
interface ChapterTransition {
  emoji: string;
  eyebrow: string;
  heading: string;
  body: string;
  highlight: string;
  highlightIcon: React.ElementType;
  btnLabel: string;
  celebration: string; // small stat/win line
}

const CHAPTER_TRANSITIONS: Record<number, ChapterTransition> = {
  2: {
    emoji: "📖",
    eyebrow: "Chapter 1 complete!",
    heading: "Your item has a name — now give it a voice.",
    body: "Listings with honest, specific descriptions trade 3× faster than bare-bones ones. You've got a name. Now tell us the story behind it — why you bought it, what it means, what's included.",
    highlight: "Chapter 2 · Its story",
    highlightIcon: BookMarked,
    btnLabel: "Tell its story",
    celebration: "Title, category & condition saved ✓",
  },
  3: {
    emoji: "📸",
    eyebrow: "Chapter 2 complete!",
    heading: "The story is set. Now make it visible.",
    body: "A picture is worth a trade. Items with 3+ photos from different angles close deals twice as fast. Natural light, all angles — show it like you'd want to see it if you were buying.",
    highlight: "Chapter 3 · Show it off",
    highlightIcon: ImagePlus,
    btnLabel: "Add photos",
    celebration: "Description saved ✓",
  },
  4: {
    emoji: "💰",
    eyebrow: "Chapter 3 complete!",
    heading: "Looking sharp! Now let's talk value.",
    body: "Traders want to know they're getting a fair deal. Setting a purchase price and current market value gives them the context they need to say yes quickly.",
    highlight: "Chapter 4 · What's it worth?",
    highlightIcon: DollarSign,
    btnLabel: "Set the value",
    celebration: "Photos uploaded ✓",
  },
  5: {
    emoji: "🔄",
    eyebrow: "Chapter 4 complete!",
    heading: "Value noted. Now — what would make you trade?",
    body: "This is where the magic happens. Tell us what you'd accept in exchange. The more open you are, the wider your net — and the faster you'll find a match.",
    highlight: "Chapter 5 · Your trade wishlist",
    highlightIcon: Repeat2,
    btnLabel: "Set trade terms",
    celebration: "Pricing & tags saved ✓",
  },
  6: {
    emoji: "🚀",
    eyebrow: "Almost there!",
    heading: "Your listing is ready to go live.",
    body: "One final look before it heads to admin review. Once approved, traders across the marketplace will be able to discover and offer a trade. You've done the hard work — let's finish strong.",
    highlight: "Chapter 6 · Final review",
    highlightIcon: Send,
    btnLabel: "Review & submit",
    celebration: "Exchange options saved ✓",
  },
};

/* ─── Icon / category helpers ────────────────────── */
const ICON_MAP: Record<string, React.ElementType> = {
  Tag, Package, Laptop, Music, BookOpen, Home, Dumbbell, Palette,
  Shirt, Trophy, Box, Utensils, Car, Gamepad2, Gem, Camera,
  Headphones, Watch, Bike, Sofa, Tv, Smartphone, Baby, Flower2,
  Coffee, Plane, Hammer, Wrench, Zap, Heart, Star, Globe,
  ShoppingBag, Leaf, Sun, Moon, LayoutGrid, Layers, Search,
};
const resolveIcon = (name?: string): React.ElementType =>
  (name && ICON_MAP[name]) ? ICON_MAP[name] : Tag;

const CONDITIONS = [
  { value: "New",      label: "Brand New",  desc: "Never used, sealed or perfect", color: "#4ade80" },
  { value: "Like New", label: "Like New",   desc: "Used once or twice, flawless",  color: "#22d3ee" },
  { value: "Good",     label: "Good",       desc: "Normal use, minor wear",        color: "#3b82f6" },
  { value: "Fair",     label: "Fair",       desc: "Visible wear but fully works",  color: "#f472b6" },
];

const ICON_SETS = [
  { prefix: "noto",         label: "Noto",    Icon: Palette },
  { prefix: "fluent-emoji", label: "Fluent",  Icon: Star },
  { prefix: "twemoji",      label: "Tweet",   Icon: Zap },
  { prefix: "mdi",          label: "Material",Icon: Layers },
  { prefix: "lucide",       label: "Lucide",  Icon: Box },
];

const POPULAR_ICONS: Record<string, string[]> = {
  noto: ["camera","electric-guitar","books","laptop","headphone","mobile-phone","drone","artist-palette","watch","video-game","television","trumpet","dress","microscope","bicycle","soccer-ball","basketball","trophy","money-bag","gem-stone","ring","crown","rocket","pizza","hamburger","house","airplane","guitar","violin","drum","microphone","teddy-bear","sunflower","rose","coffee","tea","ice-cream"],
  "fluent-emoji": ["camera","guitar","books","laptop","headphones","mobile-phone","drone","artist-palette","watch","video-game","television","trumpet","dress","microscope","bicycle","soccer-ball","basketball","trophy","money-bag","gem-stone","ring","crown","rocket","pizza","hamburger","house","airplane","robot","ghost","teddy-bear","sunflower"],
  twemoji: ["1f4f7","1f3b8","1f4da","1f4bb","1f3a7","1f4f1","1f681","1f3a8","231a","1f3ae","1f4fa","1f3ba","1f457","1f52c","1f3cb","1f9f8","1f6b2","26bd","1f3c0","1f4b0","1f48e","1f451","1f3c6","1f680","1f355","1f354","1f368","1f333","1f33b","1f339"],
  mdi: ["camera","guitar","book-open-page-variant","laptop","headphones","cellphone","drone","palette","coffee","watch","gamepad-variant","television","trumpet","tshirt-crew","microscope","bicycle","soccer","basketball","cash","credit-card","diamond-stone","crown","trophy","rocket","robot","pizza","hamburger","pine-tree","sunflower","home","airplane","car","bus"],
  lucide: ["camera","guitar","book-open","laptop","headphones","smartphone","palette","coffee","watch","gamepad-2","tv","shirt","microscope","dumbbell","bicycle","award","rocket","telescope","pizza","hamburger","tree-pine","house","building","plane","monitor","cpu","hard-drive","database","cloud","wifi","battery","bolt","sun","moon","star","heart","zap","flame"],
};

const searchIcons = async (query: string, prefix: string): Promise<string[]> => {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&prefix=${prefix}&limit=48`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.icons || []).map((icon: string) => icon.split(":")[1]).filter(Boolean);
  } catch { return []; }
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "Icon": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        icon?: string; width?: string | number; height?: string | number;
      }, HTMLElement>;
    }
  }
}

const fmtSize = (b: number) => {
  if (!b) return "0B";
  const k = 1024, s = ["B","KB","MB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return Math.round((b / Math.pow(k, i)) * 100) / 100 + s[i];
};

const STEPS = [
  { id: 1, label: "Basics",   Icon: Package,   chapterLabel: "The Basics" },
  { id: 2, label: "Story",    Icon: BookOpen,  chapterLabel: "Its Story" },
  { id: 3, label: "Photos",   Icon: Camera,    chapterLabel: "The Visuals" },
  { id: 4, label: "Value",    Icon: Tag,       chapterLabel: "The Value" },
  { id: 5, label: "Exchange", Icon: Repeat2,   chapterLabel: "The Wishlist" },
  { id: 6, label: "Review",   Icon: Send,      chapterLabel: "The Finale" },
];

/* ─── API ────────────────────────────────────────── */
const base_url = process.env.NEXT_PUBLIC_BACKEND_URL
const createProduct = async (data: any, images: File[]) => {
  const fd = new FormData();
  fd.append("title", data.title);
  fd.append("description", data.description);
  fd.append("category_id", data.category_id.toString());
  fd.append("name", data.name);
  fd.append("purchase_year", data.purchase_year.toString());
  if (data.purchase_bill) fd.append("purchase_bill", data.purchase_bill);
  if (data.purchase_price) fd.append("purchase_price", data.purchase_price.toString());
  if (data.market_price) fd.append("market_price", data.market_price.toString());
  fd.append("replace_options", JSON.stringify(data.replace_options.map((o: any) => ({
    title: o.title.trim(), description: o.description?.trim() || "",
    category_id: o.category_id, icon: o.icon,
  }))));
  images.forEach(img => fd.append("images", img));
  const res = await fetch(`${base_url}products/create_product/`, {
    method: "POST", body: fd, credentials: "include",
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed"); }
  return res.json();
};

/* ─── Icon Picker ────────────────────────────────── */
function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [activeSet, setActiveSet] = useState("noto");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setResults(await searchIcons(query, activeSet));
      setLoading(false);
    }, 400);
  }, [query, activeSet]);

  const icons = query.trim() ? results : (POPULAR_ICONS[activeSet] ?? []);

  return (
    <div className={styles.iconPickerWrap} ref={ref}>
      <button type="button" className={styles.iconPickerTrigger} onClick={() => setOpen(p => !p)}>
        {value
          ? <Icon  icon={value} width="20" height="20" />
          : <span className={styles.iconPickerEmpty}>Pick icon</span>}
        <ChevronDown size={12} style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div className={styles.iconPickerDropdown}>
          <div className={styles.iconSetTabs}>
            {ICON_SETS.map(s => (
              <button key={s.prefix} type="button"
                className={`${styles.iconSetTab} ${activeSet === s.prefix ? styles.iconSetTabActive : ""}`}
                onClick={() => { setActiveSet(s.prefix); setQuery(""); setResults([]); }}>
                <s.Icon size={11} /> {s.label}
              </button>
            ))}
          </div>
          <div className={styles.iconPickerSearch}>
            <Search size={13} />
            <input placeholder="Search icons..." value={query} onChange={e => setQuery(e.target.value)} />
            {loading && <Loader2 size={12} className={styles.spinIcon} />}
          </div>
          <div className={styles.iconPickerGrid}>
            {icons.slice(0, 40).map(name => {
              const id = `${activeSet}:${name}`;
              return (
                <button key={id} type="button" title={name.replace(/-/g, " ")}
                  className={`${styles.iconPickerItem} ${value === id ? styles.iconPickerItemActive : ""}`}
                  onClick={() => { onChange(id); setOpen(false); }}>
                  <Icon  icon={id} width="22" height="22" />
                </button>
              );
            })}
            {!loading && icons.length === 0 && <div className={styles.iconPickerEmpty2}>No results</div>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Chapter Transition Screen ─────────────────── */
function ChapterTransitionScreen({
  toStep,
  fromStepData,
  onContinue,
}: {
  toStep: number;
  fromStepData?: { label: string };
  onContinue: () => void;
}) {
  const tr = CHAPTER_TRANSITIONS[toStep];
  if (!tr) return null;
  const { highlightIcon: HIcon } = tr;

  return (
    <div className={styles.chapterOverlay}>
      <div className={styles.chapterModal}>
        {/* Ambient background glow */}
        <div className={styles.chapterGlow} />

        {/* Eyebrow */}
        <div className={styles.chapterEyebrow}>
          <CheckCircle2 size={12} />
          {tr.eyebrow}
        </div>

        {/* Big emoji */}
        <div className={styles.chapterEmoji}>{tr.emoji}</div>

        {/* Heading */}
        <h2 className={styles.chapterHeading}>{tr.heading}</h2>

        {/* Body */}
        <p className={styles.chapterBody}>{tr.body}</p>

        {/* Celebration line — what was just saved */}
        <div className={styles.chapterCelebration}>
          <Check size={11} />
          {tr.celebration}
        </div>

        {/* Next chapter pill */}
        <div className={styles.chapterNext}>
          <HIcon size={12} />
          Up next: {tr.highlight}
        </div>

        {/* CTA */}
        <button className={styles.chapterBtn} onClick={onContinue}>
          {tr.btnLabel}
          <ArrowRight size={15} />
        </button>

        {/* Step dots */}
        <div className={styles.chapterDots}>
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={`${styles.chapterDot} ${toStep - 1 > s.id ? styles.chapterDotDone : ""} ${toStep - 1 === s.id ? styles.chapterDotActive : ""}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Value change badge ─────────────────────────── */
function ValueChangeBadge({ purchasePrice, marketPrice }: { purchasePrice: number | ""; marketPrice: number | "" }) {
  if (!purchasePrice || !marketPrice || Number(purchasePrice) === 0) return null;
  const paid = Number(purchasePrice), market = Number(marketPrice);
  const diff = market - paid, pct = Math.abs(Math.round((diff / paid) * 100));
  const gain = diff > 0, flat = diff === 0;
  if (flat) return <span className={styles.valueBadgeFlat}><TrendingUp size={9} /> Held value</span>;
  return (
    <span className={gain ? styles.valueBadgeUp : styles.valueBadgeDown}>
      {gain ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {gain ? "+" : "-"}{pct}% vs paid
    </span>
  );
}

/* ─── Live Preview ───────────────────────────────── */
function LivePreview({ title, description, categoryId, condition, purchasePrice, marketPrice, previews, tags, replaceOptions, purchaseYear, categories }: any) {
  const cat = categories?.find((c: ApiCategory) => c.id === categoryId);
  const CatIcon = cat ? resolveIcon(cat.icon) : undefined;
  const cond = CONDITIONS.find(c => c.value === condition);
  const previewOpts = (replaceOptions ?? [])
    .filter((o: ReplaceOption) => o.title?.trim())
    .map((o: ReplaceOption) => ({ title: o.title, icon: o.icon }));

  const strengthItems = [
    { done: title?.length > 2,            label: "Title" },
    { done: !!categoryId,                 label: "Category" },
    { done: !!condition,                  label: "Condition" },
    { done: description?.length > 9,      label: "Description" },
    { done: !!purchaseYear,               label: "Year" },
    { done: previews?.length > 0,         label: "Photos" },
    { done: previews?.length >= 3,        label: "3+ Photos" },
    { done: !!purchasePrice,              label: "Purchase price" },
    { done: !!marketPrice,                label: "Market price" },
    { done: !!replaceOptions?.[0]?.title, label: "Exchange option" },
    { done: replaceOptions?.length >= 2,  label: "2nd exchange" },
    { done: !!tags,                       label: "Tags" },
  ];
  const strength = Math.round(strengthItems.filter(s => s.done).length / strengthItems.length * 100);
  const strengthColor = strength >= 70 ? "var(--success)" : strength >= 40 ? "var(--gold)" : "var(--danger)";

  return (
    <div className={styles.previewPanel}>
      <div className={styles.previewHeader}>
        <Eye size={14} />
        <span>Live Preview</span>
        <span className={styles.previewLive}>
          <CircleDot size={9} /> updating
        </span>
      </div>
      <ProductPreviewCard
        title={title}
        categoryName={cat?.name}
        categoryIcon={CatIcon}
        condition={cond?.label ?? condition}
        conditionColor={cond?.color}
        purchasePrice={purchasePrice}
        marketPrice={marketPrice}
        purchaseYear={purchaseYear}
        imageUrls={previews ?? []}
        replaceOptions={previewOpts}
        tags={tags}
      />
      <div className={styles.previewStrength}>
        <div className={styles.previewStrengthHeader}>
          <span><Layers size={11} /> Listing strength</span>
          <strong style={{ color: strengthColor }}>{strength}%</strong>
        </div>
        <div className={styles.previewBar}>
          <div className={styles.previewBarFill} style={{ width: `${strength}%`, background: strengthColor }} />
        </div>
        <div className={styles.previewChecklist}>
          {strengthItems.map((item, i) => (
            <div key={i} className={`${styles.previewCheckItem} ${item.done ? styles.previewCheckDone : ""}`}>
              <div className={styles.previewCheckDot}>{item.done && <Check size={8} />}</div>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════ */
export default function AddProduct({ onNavigate }: AddProductProps) {
  const [step, setStep]                   = useState(1);
  const [dir, setDir]                     = useState<"fwd" | "bwd">("fwd");
  const [animating, setAnimating]         = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [pendingStep, setPendingStep]     = useState<number | null>(null);
  const { user } = useAuth();

  const [categories, setCategories]   = useState<ApiCategory[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsError, setCatsError]     = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      setCatsLoading(true); setCatsError(null);
      try {
        const res = await fetch(`${base_url}/products/categories/`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load categories");
        const data: ApiCategory[] = await res.json();
        setCategories(data);
      } catch (e: any) {
        setCatsError(e.message || "Failed to load categories");
      } finally {
        setCatsLoading(false);
      }
    };
    load();
  }, []);

  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [categoryId, setCategoryId]     = useState<number | "">("");
  const [condition, setCondition]       = useState("");
  const [name, setName]                 = useState("");
  const [purchaseYear, setPurchaseYear] = useState<number | "">("");
  const [purchaseBill, setPurchaseBill] = useState<File | null>(null);
  const [purchasePrice, setPurchasePrice] = useState<number | "">("");
  const [marketPrice, setMarketPrice]   = useState<number | "">("");
  const [tags, setTags]                 = useState("");
  const [replaceOptions, setReplaceOptions] = useState<ReplaceOption[]>([
    { category_id: "", title: "", description: "", icon: "" },
  ]);
  const [images, setImages]     = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [dragging, setDragging]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast]       = useState<{ show: boolean; type: "success" | "error"; message: string }>({ show: false, type: "success", message: "" });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Navigation ─── */
  const goTo = (next: number) => {
    if (animating) return;
    setDir(next > step ? "fwd" : "bwd");
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 220);
  };

  const validateStep = () => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!title.trim() || title.length < 3) e.title = "At least 3 characters";
      if (!categoryId) e.category  = "Pick a category";
      if (!condition)  e.condition = "Pick a condition";
    }
    if (step === 2) {
      if (!description.trim() || description.length < 10) e.description = "At least 10 characters";
      if (!name.trim()) e.name = "Required";
      if (!purchaseYear || Number(purchaseYear) < 1900) e.purchaseYear = "Valid year required";
    }
    if (step === 3) { if (images.length === 0) e.images = "Add at least 1 photo"; }
    if (step === 5) {
      replaceOptions.forEach((o, i) => {
        if (!o.category_id) e[`ro_cat_${i}`]    = "Pick category";
        if (!o.title.trim()) e[`ro_title_${i}`] = "Required";
      });
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    const nextStep = step + 1;
    // Show chapter transition for every step except going to step 1
    if (nextStep <= STEPS.length && CHAPTER_TRANSITIONS[nextStep]) {
      setPendingStep(nextStep);
      setShowTransition(true);
    } else {
      goTo(nextStep);
    }
  };

  const handleTransitionContinue = () => {
    setShowTransition(false);
    if (pendingStep !== null) {
      goTo(pendingStep);
      setPendingStep(null);
    }
  };

  const back = () => goTo(step - 1);
  const clearErr = (k: string) => setErrors(p => { const n = { ...p }; delete n[k]; return n; });

  /* ─── Images ─── */
  const addImages = (files: File[]) => {
    if (images.length + files.length > 10) { setErrors(p => ({ ...p, images: "Max 10 images" })); return; }
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    for (const f of files) {
      if (!allowed.includes(f.type)) { setErrors(p => ({ ...p, images: `${f.name}: JPG/PNG/WebP only` })); return; }
      if (f.size > 5 * 1024 * 1024) { setErrors(p => ({ ...p, images: `${f.name}: Max 5MB` })); return; }
    }
    const start = images.length;
    files.forEach(f => {
      const r = new FileReader();
      r.onloadend = () => setPreviews(p => [...p, r.result as string]);
      r.readAsDataURL(f);
    });
    setImages(p => [...p, ...files]);
    setActiveImg(start);
    clearErr("images");
  };

  const removeImage = (idx: number) => {
    setImages(p => p.filter((_, i) => i !== idx));
    setPreviews(p => p.filter((_, i) => i !== idx));
    setActiveImg(prev => Math.max(0, prev >= idx ? prev - 1 : prev));
  };

  /* ─── Exchange options ─── */
  const addOpt    = () => setReplaceOptions(p => [...p, { category_id: "", title: "", description: "", icon: "" }]);
  const removeOpt = (i: number) => { if (replaceOptions.length > 1) setReplaceOptions(p => p.filter((_, j) => j !== i)); };
  const updateOpt = (i: number, f: keyof ReplaceOption, v: any) => {
    setReplaceOptions(p => p.map((o, j) => j === i ? { ...o, [f]: v } : o));
    clearErr(`ro_cat_${i}`); clearErr(`ro_title_${i}`);
  };

  /* ─── Toast ─── */
  const showToast = (type: "success" | "error", message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ show: true, type, message });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 4500);
  };

  /* ─── Submit ─── */
  const submitProduct = async () => {
    setLoading(true);
    try {
      await createProduct({
        title: title.trim(), description: description.trim(),
        category_id: Number(categoryId), name: name.trim(),
        purchase_year: Number(purchaseYear), purchase_bill: purchaseBill,
        purchase_price: purchasePrice || undefined,
        market_price: marketPrice || undefined,
        replace_options: replaceOptions,
      }, images);
      setLoading(false);
      setSubmitted(true);
    } catch (err: any) {
      setLoading(false);
      showToast("error", err.message || "Something went wrong. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    const profileIncomplete = !user?.address || !user?.lat || !user?.long;
    if (profileIncomplete) { setShowProfileModal(true); return; }
    submitProduct();
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategoryId(""); setCondition(""); setName("");
    setPurchaseYear(""); setPurchaseBill(null); setPurchasePrice(""); setMarketPrice("");
    setTags("");
    setReplaceOptions([{ category_id: "", title: "", description: "", icon: "" }]);
    setImages([]); setPreviews([]); setActiveImg(0); setErrors({}); setStep(1);
    setSubmitted(false); setShowTransition(false); setPendingStep(null);
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  /* ─── Success screen ─── */
  if (submitted) {
    return (
      <div className={styles.successScreen}>
        <div className={styles.successBox}>
          <div className={styles.successIconWrap}>
            <Send size={32} className={styles.successIcon} />
          </div>
          <h2 className={styles.successTitle}>Submitted for Review!</h2>
          <p className={styles.successBody}>
            Your listing has been sent to our admin team. Once approved it'll go live in the marketplace.
            We'll notify you when it's published.
          </p>
          <div className={styles.successMeta}>
            <span className={styles.successMetaItem}><Check size={12} /> "{title}"</span>
            <span className={styles.successMetaItem}><Camera size={12} /> {images.length} photo{images.length !== 1 ? "s" : ""}</span>
            <span className={styles.successMetaItem}><Repeat2 size={12} /> {replaceOptions.filter(o => o.title).length} exchange option{replaceOptions.filter(o => o.title).length !== 1 ? "s" : ""}</span>
          </div>
          <div className={styles.successActions}>
            <button className={styles.successBtnPrimary} onClick={resetForm}>
              <Plus size={15} /> Add Another Item
            </button>
            <button className={styles.successBtnSecondary} onClick={() => onNavigate("marketplace")}>
              Browse Marketplace <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Step content ──────────────────────────── */
  const renderStep = () => {
    switch (step) {

      /* ── STEP 1: Basics ── */
      case 1: return (
        <>
          <div className={styles.stepHead}>
            <div className={styles.chapterTag}>
              <span className={styles.chapterTagDot} />
              Chapter 1 · The Basics
            </div>
            <h2 className={styles.stepTitle}>What are you trading?</h2>
            <p className={styles.stepSub}>Every great trade starts with a name. Give your item an identity — brand, model, the detail that makes someone stop scrolling.</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Item title <span className={styles.req}>*</span></label>
            <input className={`${styles.input} ${errors.title ? styles.inputErr : ""}`}
              placeholder="e.g. Vintage Canon AE-1 Film Camera"
              value={title} maxLength={100} autoFocus
              onChange={e => { setTitle(e.target.value); clearErr("title"); }} />
            <div className={styles.fieldFoot}>
              {errors.title ? <span className={styles.err}>{errors.title}</span> : <span />}
              <span className={styles.count}>{title.length}/100</span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Category <span className={styles.req}>*</span></label>
            {catsLoading ? (
              <div className={styles.catSkeleton}>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className={styles.catSkeletonChip} style={{ animationDelay: `${i*0.06}s` }} />
                ))}
              </div>
            ) : catsError ? (
              <div className={styles.catsErrorRow}>
                <AlertCircle size={14} />
                <span>{catsError}</span>
                <button type="button" className={styles.catsRetryBtn}
                  onClick={async () => {
                    setCatsLoading(true); setCatsError(null);
                    try {
                      const res = await fetch(`${base_url}/products/categories/`, { credentials: "include" });
                      if (!res.ok) throw new Error("Failed to load categories");
                      setCategories(await res.json());
                    } catch (e: any) { setCatsError(e.message); }
                    finally { setCatsLoading(false); }
                  }}>
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            ) : (
              <div className={styles.catGrid}>
                {categories.map(c => {
                  const CIcon = resolveIcon(c.icon);
                  return (
                    <button key={c.id} type="button"
                      className={`${styles.catChip} ${categoryId === c.id ? styles.catActive : ""}`}
                      onClick={() => { setCategoryId(c.id); clearErr("category"); }}>
                      <CIcon size={14} />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {errors.category && <span className={styles.err}>{errors.category}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Condition <span className={styles.req}>*</span></label>
            <div className={styles.condGrid}>
              {CONDITIONS.map(c => (
                <button key={c.value} type="button"
                  className={`${styles.condCard} ${condition === c.value ? styles.condActive : ""}`}
                  style={condition === c.value ? { borderColor: c.color, background: c.color + "12" } as any : {}}
                  onClick={() => { setCondition(c.value); clearErr("condition"); }}>
                  <div className={styles.condDot} style={{ background: c.color }} />
                  <div className={styles.condName}>{c.label}</div>
                  <div className={styles.condDesc}>{c.desc}</div>
                </button>
              ))}
            </div>
            {errors.condition && <span className={styles.err}>{errors.condition}</span>}
          </div>
        </>
      );

      /* ── STEP 2: Story ── */
      case 2: return (
        <>
          <div className={styles.stepHead}>
            <div className={styles.chapterTag}>
              <span className={styles.chapterTagDot} />
              Chapter 2 · Its Story
            </div>
            <h2 className={styles.stepTitle}>Tell us what makes it special</h2>
            <p className={styles.stepSub}>Honest, specific listings close trades. Why are you trading it? What's included? Any quirks a new owner should know?</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description <span className={styles.req}>*</span></label>
            <textarea className={`${styles.textarea} ${errors.description ? styles.inputErr : ""}`}
              placeholder="What makes it special? Any accessories included? Why are you trading it?"
              value={description} maxLength={2000} rows={5}
              onChange={e => { setDescription(e.target.value); clearErr("description"); }} />
            <div className={styles.fieldFoot}>
              {errors.description ? <span className={styles.err}>{errors.description}</span> : <span />}
              <span className={styles.count}>{description.length}/2000</span>
            </div>
          </div>

          <div className={styles.twoCol}>
            <div className={styles.field}>
              <label className={styles.label}>Model / item name <span className={styles.req}>*</span></label>
              <input className={`${styles.input} ${errors.name ? styles.inputErr : ""}`}
                placeholder="e.g. Canon AE-1 Program" value={name}
                onChange={e => { setName(e.target.value); clearErr("name"); }} />
              {errors.name && <span className={styles.err}>{errors.name}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Year purchased <span className={styles.req}>*</span></label>
              <input className={`${styles.input} ${errors.purchaseYear ? styles.inputErr : ""}`}
                type="number" placeholder={`e.g. ${new Date().getFullYear()}`}
                min="1900" max={new Date().getFullYear()} value={purchaseYear}
                onChange={e => { setPurchaseYear(e.target.value === "" ? "" : Number(e.target.value)); clearErr("purchaseYear"); }} />
              {errors.purchaseYear && <span className={styles.err}>{errors.purchaseYear}</span>}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Purchase bill <span className={styles.optional}>optional — PDF or image</span>
            </label>
            <label className={styles.billUpload}>
              <Upload size={15} />
              <span>{purchaseBill ? purchaseBill.name : "Upload bill or receipt"}</span>
              <input type="file" accept="image/*,application/pdf" style={{ display: "none" }}
                onChange={e => { setPurchaseBill(e.target.files?.[0] ?? null); e.target.value = ""; }} />
              {purchaseBill && (
                <button type="button" className={styles.billClear}
                  onClick={e => { e.preventDefault(); setPurchaseBill(null); }}>
                  <X size={11} />
                </button>
              )}
            </label>
          </div>
        </>
      );

      /* ── STEP 3: Photos ── */
      case 3: return (
        <>
          <div className={styles.stepHead}>
            <div className={styles.chapterTag}>
              <span className={styles.chapterTagDot} />
              Chapter 3 · The Visuals
            </div>
            <h2 className={styles.stepTitle}>Show it off</h2>
            <p className={styles.stepSub}>3+ photos = 2× more trades. Natural light, all angles. The first photo becomes your cover — make it count.</p>
          </div>

          <div
            className={`${styles.dropZone} ${dragging ? styles.dropActive : ""} ${errors.images ? styles.dropErr : ""}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault(); setDragging(false);
              const f = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
              if (f.length) addImages(f);
            }}>
            <input type="file" multiple accept="image/jpeg,image/jpg,image/png,image/webp"
              className={styles.dropInput}
              onChange={e => { if (e.target.files) addImages(Array.from(e.target.files)); e.target.value = ""; }} />
            <div className={styles.dropContent}>
              <div className={styles.dropIcon}>
                {dragging ? <Zap size={28} /> : <Upload size={28} />}
              </div>
              <div className={styles.dropTitle}>{dragging ? "Drop it!" : "Drag photos here"}</div>
              <div className={styles.dropSub}>or click to browse · JPG PNG WebP · max 5MB · up to 10</div>
            </div>
          </div>
          {errors.images && <span className={styles.err} style={{ marginTop: 8, display: "block" }}>{errors.images}</span>}

          {previews.length > 0 && (
            <div className={styles.photoArea}>
              <div className={styles.photoFeatured}>
                <img src={previews[activeImg]} alt="featured" className={styles.photoFeaturedImg} />
                <div className={styles.coverBadge}><Star size={9} /> Cover</div>
                <button className={styles.photoDelBtn} onClick={() => removeImage(activeImg)}>
                  <X size={11} />
                </button>
              </div>
              <div className={styles.photoStrip}>
                {previews.map((src, idx) => (
                  <div key={idx}
                    className={`${styles.photoThumb} ${activeImg === idx ? styles.thumbActive : ""}`}
                    onClick={() => setActiveImg(idx)}>
                    <img src={src} alt="" />
                    <button className={styles.thumbDel} type="button"
                      onClick={e => { e.stopPropagation(); removeImage(idx); }}>
                      <X size={8} />
                    </button>
                    <span className={styles.thumbSize}>{fmtSize(images[idx]?.size || 0)}</span>
                  </div>
                ))}
                {previews.length < 10 && (
                  <label className={styles.photoAdd}>
                    <Plus size={14} />
                    <input type="file" multiple accept="image/jpeg,image/jpg,image/png,image/webp"
                      style={{ display: "none" }}
                      onChange={e => { if (e.target.files) addImages(Array.from(e.target.files)); e.target.value = ""; }} />
                  </label>
                )}
              </div>
            </div>
          )}
        </>
      );

      /* ── STEP 4: Value ── */
      case 4: return (
        <>
          <div className={styles.stepHead}>
            <div className={styles.chapterTag}>
              <span className={styles.chapterTagDot} />
              Chapter 4 · The Value
            </div>
            <h2 className={styles.stepTitle}>What's it worth?</h2>
            <p className={styles.stepSub}>All optional — but pricing context helps traders feel confident saying yes. Check similar listings online.</p>
          </div>

          <div className={styles.optionalBanner}>
            <Tag size={13} />
            <span>This entire step is <strong>optional</strong>. You can skip straight to Continue.</span>
          </div>

          <div className={styles.twoCol}>
            <div className={styles.field}>
              <label className={styles.label}>
                <IndianRupee size={11} style={{ verticalAlign: "middle" }} />
                Purchase price <span className={styles.optional}>optional</span>
              </label>
              <div className={styles.priceWrap}>
                <span className={styles.priceSymbol}><IndianRupee size={14} /></span>
                <input className={styles.priceInput}
                  type="number" placeholder="What you paid" min="0" step="1"
                  value={purchasePrice}
                  onChange={e => setPurchasePrice(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                <TrendingUp size={11} style={{ verticalAlign: "middle" }} />
                Current market price <span className={styles.optional}>optional</span>
              </label>
              <div className={styles.priceWrap}>
                <span className={styles.priceSymbol}><IndianRupee size={14} /></span>
                <input className={styles.priceInput}
                  type="number" placeholder="Today's market value" min="0" step="1"
                  value={marketPrice}
                  onChange={e => setMarketPrice(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
            </div>
          </div>

          {purchasePrice && marketPrice && (
            <div className={styles.valueInsight}>
              {(() => {
                const paid = Number(purchasePrice), market = Number(marketPrice);
                const diff = market - paid, pct = Math.abs(Math.round((diff / paid) * 100));
                const gain = diff > 0, flat = diff === 0;
                if (flat) return <span className={styles.valueInsightFlat}><TrendingUp size={13} /> This item held its value perfectly.</span>;
                return (
                  <span className={gain ? styles.valueInsightUp : styles.valueInsightDown}>
                    {gain ? <TrendingUp size={13} /> : <TrendingDown size={9} />}
                    {gain
                      ? `This item appreciated +${pct}% — it's worth ₹${(market - paid).toLocaleString()} more than you paid!`
                      : `This item depreciated -${pct}% — it's worth ₹${(paid - market).toLocaleString()} less than you paid.`}
                  </span>
                );
              })()}
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Tags <span className={styles.optional}>optional · comma separated</span></label>
            <input className={styles.input}
              placeholder="e.g. vintage, film, photography, 35mm"
              value={tags} onChange={e => setTags(e.target.value)} />
            {tags && (
              <div className={styles.tagPreview}>
                {tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
                  <span key={t} className={styles.tagChip}>#{t}</span>
                ))}
              </div>
            )}
          </div>
        </>
      );

      /* ── STEP 5: Exchange ── */
      case 5: return (
        <>
          <div className={styles.stepHead}>
            <div className={styles.chapterTag}>
              <span className={styles.chapterTagDot} />
              Chapter 5 · The Wishlist
            </div>
            <h2 className={styles.stepTitle}>What would make you say yes?</h2>
            <p className={styles.stepSub}>Be specific, be open. Adding 2–3 things you'd accept triples your chances of finding a match.</p>
          </div>

          <div className={styles.replaceList}>
            {replaceOptions.map((opt, idx) => (
              <div key={idx} className={styles.replaceCard}>
                <div className={styles.replaceCardTop}>
                  <span className={styles.replaceNum}>#{idx + 1}</span>
                  <span className={styles.replaceCardLabel}>Exchange option</span>
                  {replaceOptions.length > 1 && (
                    <button type="button" className={styles.replaceDel} onClick={() => removeOpt(idx)}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Icon</label>
                  <IconPicker value={opt.icon} onChange={v => updateOpt(idx, "icon", v)} />
                </div>
                <div className={styles.twoCol}>
                  <div className={styles.field}>
                    <label className={styles.label}>Category <span className={styles.req}>*</span></label>
                    <div className={styles.selectWrap}>
                      <select
                        className={`${styles.select} ${errors[`ro_cat_${idx}`] ? styles.inputErr : ""}`}
                        value={opt.category_id}
                        onChange={e => updateOpt(idx, "category_id", Number(e.target.value))}>
                        <option value="">{catsLoading ? "Loading…" : "Pick category"}</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className={styles.selectArrow} />
                    </div>
                    {errors[`ro_cat_${idx}`] && <span className={styles.err}>{errors[`ro_cat_${idx}`]}</span>}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Title <span className={styles.req}>*</span></label>
                    <input className={`${styles.input} ${errors[`ro_title_${idx}`] ? styles.inputErr : ""}`}
                      placeholder="e.g. Acoustic Guitar" value={opt.title}
                      onChange={e => updateOpt(idx, "title", e.target.value)} />
                    {errors[`ro_title_${idx}`] && <span className={styles.err}>{errors[`ro_title_${idx}`]}</span>}
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Details <span className={styles.optional}>optional</span></label>
                  <input className={styles.input}
                    placeholder="Specific model, condition requirements…"
                    value={opt.description || ""}
                    onChange={e => updateOpt(idx, "description", e.target.value)} />
                </div>
              </div>
            ))}
          </div>
          <button type="button" className={styles.addOptBtn} onClick={addOpt}>
            <Plus size={14} /> Add another option
          </button>
        </>
      );

      /* ── STEP 6: Review ── */
      case 6: return (
        <>
          <div className={styles.stepHead}>
            <div className={styles.chapterTag}>
              <span className={styles.chapterTagDot} />
              Chapter 6 · The Finale
            </div>
            <h2 className={styles.stepTitle}>Ready to submit?</h2>
            <p className={styles.stepSub}>Your listing will go to admin review before going live. One final read-through — then let's launch it.</p>
          </div>

          <div className={styles.reviewNotice}>
            <Send size={14} />
            <span>After submitting, an admin will review and approve your listing before it's visible to traders.</span>
          </div>

          <div className={styles.reviewGrid}>
            {[
              { label: "Title",     value: title || "—",       Icon: FileText },
              { label: "Category",  value: categories.find(c => c.id === categoryId)?.name ?? "—", Icon: Package },
              { label: "Condition", value: condition || "—",   Icon: CircleDot },
              { label: "Model",     value: name || "—",        Icon: Box },
              { label: "Year",      value: String(purchaseYear || "—"), Icon: Calendar },
              { label: "Photos",    value: `${images.length} uploaded`, Icon: Camera },
              { label: "Paid",      value: purchasePrice ? `₹${Number(purchasePrice).toLocaleString()}` : "—", Icon: IndianRupee },
              { label: "Market",    value: marketPrice ? `₹${Number(marketPrice).toLocaleString()}` : "—", Icon: TrendingUp },
            ].map((row, i) => (
              <div key={i} className={styles.reviewRow}>
                <span className={styles.reviewLabel}><row.Icon size={10} /> {row.label}</span>
                <span className={styles.reviewValue}>{row.value}</span>
              </div>
            ))}
          </div>

          {description && (
            <div className={styles.field} style={{ marginTop: 16 }}>
              <label className={styles.label}>Description</label>
              <div className={styles.reviewDesc}>{description}</div>
            </div>
          )}

          <div className={styles.field} style={{ marginTop: 16 }}>
            <label className={styles.label}>Exchange options ({replaceOptions.filter(o => o.title).length})</label>
            <div className={styles.reviewOpts}>
              {replaceOptions.filter(o => o.title).map((o, i) => (
                <div key={i} className={styles.reviewOpt}>
                  {o.icon
                    ? <Icon  icon={o.icon} width="18" height="18" />
                    : <Box size={18} />}
                  <div>
                    <div className={styles.reviewOptTitle}>{o.title}</div>
                    <div className={styles.reviewOptSub}>{categories.find(c => c.id === o.category_id)?.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      );

      default: return null;
    }
  };

  return (
    <>
      {loading && <BarterLoader text="Submitting for Review…" />}

      {showProfileModal && (
        <CompleteProfileModal
          onComplete={() => { setShowProfileModal(false); submitProduct(); }}
          onCancel={() => {}}
        />
      )}

      {/* ── Chapter Transition Overlay ── */}
      {showTransition && pendingStep !== null && (
        <ChapterTransitionScreen
          toStep={pendingStep}
          onContinue={handleTransitionContinue}
        />
      )}

      {toast.show && (
        <div className={`${styles.toast} ${toast.type === "success" ? styles.toastOk : styles.toastErr}`}>
          {toast.type === "success" ? <Check size={15} /> : <X size={15} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(t => ({ ...t, show: false }))}><X size={12} /></button>
        </div>
      )}

      <div className={styles.shell}>
        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        {/* Step pills */}
        <div className={styles.stepPills}>
          {STEPS.map(s => {
            const done = step > s.id, active = step === s.id;
            return (
              <div key={s.id} className={`${styles.pill} ${active ? styles.pillActive : ""} ${done ? styles.pillDone : ""}`}>
                <div className={styles.pillDot}>
                  {done ? <Check size={11} /> : <s.Icon size={11} />}
                </div>
                <span className={styles.pillLabel}>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Split layout */}
        <div className={styles.layout}>

          {/* LEFT — form */}
          <div className={styles.formCol}>
            <div className={`${styles.formWrap} ${animating ? (dir === "fwd" ? styles.exitFwd : styles.exitBwd) : styles.enterActive}`}>
              {renderStep()}
            </div>

            {/* Nav */}
            <div className={styles.navBar}>
              <button className={styles.backBtn} onClick={back} disabled={step === 1}>
                <ArrowLeft size={15} /> Back
              </button>
              <div className={styles.stepCounter}>
                {STEPS.map((_, i) => (
                  <div key={i} className={`${styles.dot} ${i + 1 === step ? styles.dotActive : ""} ${i + 1 < step ? styles.dotDone : ""}`} />
                ))}
              </div>
              {step < STEPS.length ? (
                <button className={styles.nextBtn} onClick={next}>
                  {step === 4 ? "Skip / Continue" : "Continue"} <ArrowRight size={15} />
                </button>
              ) : (
                <button className={styles.launchBtn} onClick={handleSubmit} disabled={loading}>
                  <Send size={15} /> Submit for Review
                </button>
              )}
            </div>
          </div>

          {/* RIGHT — preview */}
          <div className={styles.previewCol}>
            <LivePreview
              title={title}
              description={description}
              categoryId={categoryId}
              condition={condition}
              purchasePrice={purchasePrice}
              marketPrice={marketPrice}
              previews={previews}
              tags={tags}
              replaceOptions={replaceOptions}
              purchaseYear={purchaseYear}
              categories={categories}
            />
          </div>

        </div>
      </div>
    </>
  );
}