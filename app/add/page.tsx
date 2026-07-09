"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./Addlistingpage.module.css";
import { Icon } from "@iconify/react";
import AppShellDetail from "@/components/AppShell/Appshelldetail";
import ProfileCompleteModal from "../../components/ProfileCompleteModal/ProfileCompleteModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category { id: number; name: string; }

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  text: string;
  timestamp: Date;
  isError?: boolean;
}

interface ReplaceOptionDraft {
  id: string;
  title: string;
  description: string;
  category: number | null;
  categoryName: string;
  icon: string;
}

interface ProductForm {
  title: string;
  description: string;
  category: number | null;
  categoryName: string;
  condition: string;
  purchase_year: string;
  images: File[];
}

// ── NEW ORDER: category is first ──
type Step =
  | "category" | "title" | "description" | "condition"
  | "purchase_year" | "images" | "ask_replace"
  | "replace_options" | "confirm" | "done";

// ─── Constants ────────────────────────────────────────────────────────────────

const CONDITIONS = ["Brand New", "Like New", "Good", "Fair"];

const CONDITIONS_EMOJI: Record<string, string> = {
  "Brand New": "✨", "Like New": "💫", "Good": "👍", "Fair": "🤷",
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS: number[] = Array.from({ length: CURRENT_YEAR - 1990 + 1 }, (_, i) => CURRENT_YEAR - i);

const STEP_QUESTIONS: Record<Step, string> = {
  category:        "Hi! 👋 Let's list your item. First, choose the category.",
  title:           "Great! 😊 What's the name of your item? For example: Phone (Company name model name) or Camera (Company name model name)",
  description:     "Tell us a little about your item 📝 Add some details so others can know more about it. 😊",
  condition:       "How is the condition of your item? Please choose the best option.",
  purchase_year:   "When did you buy it? 📅 Select the purchase year, or tap Skip if you don't remember.",
  images:          "Please upload some photos 📸. Clear photos help you get better offers. You can add up to 5 photos.",
  ask_replace:     "What would you like in exchange? Or are you okay with any item?",
  replace_options: "Tell us what you'd like in exchange. 💱 You can add more than one item if you want.",
  confirm:         "Almost done! 😊 Please check your listing once before submitting.",
  done:            "🎉 Done! Your item has been submitted and is under review. You'll start receiving offers soon.",
};

const STEP_ORDER: Step[] = [
  "category", "title", "description", "condition",
  "purchase_year", "images", "ask_replace", "replace_options", "confirm", "done",
];

const REQUIRED_PROFILE_FIELDS = ["latitude", "longitude", "address", "city", "pincode", "contact_number"];

function uid() { return Math.random().toString(36).slice(2); }
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Error emoji picker ───────────────────────────────────────────────────────

function getErrorEmoji(msg: string): string {
  if (msg.includes("photo") || msg.includes("📸")) return "📸";
  if (msg.includes("name") || msg.includes("product")) return "🤔";
  if (msg.includes("year") || msg.includes("skip") || msg.includes("Skip")) return "📅";
  if (msg.includes("description") || msg.includes("details")) return "✍️";
  if (msg.includes("item") || msg.includes("add")) return "📦";
  return "⚠️";
}

// ─── AI Validator ─────────────────────────────────────────────────────────────

async function validateWithAI(step: Step, value: string): Promise<{ ok: boolean; message: string }> {
  const prompts: Partial<Record<Step, string>> = {
    title: `You are SwapBot, a friendly assistant for an Indian barter marketplace. Speak in simple, casual Indian English.
      The user entered this as a product name for their listing: "${value}".
      Rules:
      - If it looks like a real product name (phone, laptop, book, clothes, cycle, etc.) → ok: true, message: ""
      - If it's a greeting like "hi", "hello" → ok: false, message: "That looks like a greeting, not a product name 😅 What item are you listing?"
      - If it's random gibberish like "asdfgh" → ok: false, message: "That doesn't look like a product name 🤔 Try something like 'iPhone 13' or 'Cycle'"
      - If it's a question like "what should I sell?" → ok: false, message: "You know your stuff best! 😄 Tell me what you'd like to list."
      - Keep messages under 12 words, max 1 emoji, friendly tone
      Return only JSON (no markdown): {"ok": true/false, "message": "..."}`,

    description: `You are SwapBot, a friendly assistant for an Indian barter marketplace. Speak in simple, casual Indian English.
      The user entered this description: "${value}".
      Rules:
      - If it's a real description with condition, features, or reason for selling → ok: true, message: ""
      - If under 10 characters → ok: false, message: "Please add a few more details (minimum 10 characters). 🙏"
      - If just "good", "nice", "ok" → ok: false, message: "Can you add a bit more info? Buyers love details! 😊"
      - If a greeting → ok: false, message: "That's a greeting, not a description 😄 Tell us about the item!"
      - If gibberish → ok: false, message: "That doesn't look right 🙈 Please describe your item properly."
      - Keep messages under 14 words, max 1 emoji
      Return only JSON (no markdown): {"ok": true/false, "message": "..."}`,
  };
  const prompt = prompts[step];
  if (!prompt) return { ok: true, message: "" };
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 120,
        messages: [
          { role: "system", content: "Return only JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "{}";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return { ok: true, message: "" };
  }
}

// ─── AI Icon Suggester ────────────────────────────────────────────────────────

async function getIconForItem(title: string, categoryName: string): Promise<string> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 30,
        messages: [
          {
            role: "system",
            content: `You suggest a single Iconify icon string for a barter marketplace item.
Return ONLY a valid Iconify icon string like "noto:mobile-phone" or "noto:laptop".
Rules:
- Always use the "noto" prefix (noto:xxx) for colorful emoji-style icons
- Use kebab-case for the icon name
- Return ONLY the icon string, nothing else, no quotes, no explanation
Examples:
- iPhone, mobile → noto:mobile-phone
- Laptop, MacBook → noto:laptop
- Cycle, Bicycle → noto:bicycle
- Book, Novel → noto:books
- Camera → noto:camera
- Headphones → noto:headphone
- Watch → noto:watch
- TV → noto:television
- Shoes → noto:running-shoe
- Clothes, Shirt → noto:t-shirt
- Guitar → noto:guitar
- Bag, Backpack → noto:backpack`,
          },
          {
            role: "user",
            content: `Item: "${title}", Category: "${categoryName}"`,
          },
        ],
      }),
    });
    const data = await res.json();
    const icon = data.choices?.[0]?.message?.content?.trim() ?? "noto:package";
    return /^[\w-]+:[\w-]+$/.test(icon) ? icon : "noto:package";
  } catch {
    return "noto:package";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddListingPage() {
  const router = useRouter();

  const [messages, setMessages]               = useState<ChatMessage[]>([]);
  const [step, setStep]                       = useState<Step>("category");
  const [form, setForm]                       = useState<ProductForm>({
    title: "", description: "", category: null,
    categoryName: "", condition: "", purchase_year: "", images: [],
  });
  const [replaceOptions, setReplaceOptions]   = useState<ReplaceOptionDraft[]>([]);
  const [replaceForm, setReplaceForm]         = useState({
    title: "", description: "", category: null as number | null, categoryName: "",
  });
  const [input, setInput]                     = useState("");
  const [categories, setCategories]           = useState<Category[]>([]);
  const [botTyping, setBotTyping]             = useState(false);
  const [aiValidating, setAiValidating]       = useState(false);
  const [imagePreviews, setImagePreviews]     = useState<string[]>([]);
  const [loading, setLoading]                 = useState(false);
  const [iconLoading, setIconLoading]         = useState(false);

  // ── Profile gate ──
  const [profileChecking, setProfileChecking]   = useState(true);
  const [profileBlocked, setProfileBlocked]     = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [incompleteFields, setIncompleteFields] = useState<string[]>([]);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  // ── Fetch categories ──
  useEffect(() => {
    fetch(`/api/categories`)
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : d.results ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping, step]);

  const sendBot = useCallback(async (s: Step, delay = 300) => {
    await sleep(delay);
    setBotTyping(true);
    await sleep(800);
    setBotTyping(false);
    setMessages(prev => [...prev, { id: uid(), role: "bot", text: STEP_QUESTIONS[s], timestamp: new Date() }]);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // ── Profile check + bot init (starts at "category" now) ──
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        const res = await fetch(`/api/completion`);
        const data = await res.json();
        const missing = (data.incomplete_fields ?? []).filter((f: string) =>
          REQUIRED_PROFILE_FIELDS.includes(f)
        );
        if (missing.length > 0) {
          setIncompleteFields(missing);
          setProfileBlocked(true);
          setProfileModalOpen(true);
          setProfileChecking(false);
        } else {
          setProfileBlocked(false);
          setProfileChecking(false);
          sendBot("category");
        }
      } catch {
        setProfileBlocked(false);
        setProfileChecking(false);
        sendBot("category");
      }
    };

    init();
  }, [sendBot]);

  const handleProfileSaved = useCallback(async () => {
    setProfileModalOpen(false);
    try {
      const res = await fetch(`/api/completion`);
      const data = await res.json();
      const missing = (data.incomplete_fields ?? []).filter((f: string) =>
        REQUIRED_PROFILE_FIELDS.includes(f)
      );
      if (missing.length > 0) {
        setIncompleteFields(missing);
        setProfileBlocked(true);
        setProfileModalOpen(true);
      } else {
        setIncompleteFields([]);
        setProfileBlocked(false);
        sendBot("category");
      }
    } catch {
      setProfileBlocked(false);
      sendBot("category");
    }
  }, [sendBot]);

  const addUser = (text: string) =>
    setMessages(prev => [...prev, { id: uid(), role: "user", text, timestamp: new Date() }]);

  const showError = useCallback((msg: string) => {
    const emoji = getErrorEmoji(msg);
    setMessages(prev => [
      ...prev,
      {
        id: uid(),
        role: "bot",
        text: msg,
        timestamp: new Date(),
        isError: true,
        ...(({ _emoji: emoji } as any)),
      } as ChatMessage & { _emoji: string },
    ]);
  }, []);

  const advance = useCallback(async (current: Step) => {
    const idx  = STEP_ORDER.indexOf(current);
    const next = STEP_ORDER[idx + 1] as Step;
    setStep(next);
    await sendBot(next);
  }, [sendBot]);

  const handleSend = useCallback(async () => {
    const val = input.trim();
    if (!val) return;

    if (step === "title") {
      if (val.length < 3) return showError("The item name is too short. Please enter a proper name. 😅");
      setAiValidating(true);
      const { ok, message } = await validateWithAI("title", val);
      setAiValidating(false);
      if (!ok) return showError(message || "That doesn't look like a product name 🤔");
      addUser(val);
      setForm(f => ({ ...f, title: val }));
      setInput("");
      await advance("title");

    } else if (step === "description") {
      if (val.length < 10) return showError("Please add a few more details (minimum 10 characters). 🙏");
      setAiValidating(true);
      const { ok, message } = await validateWithAI("description", val);
      setAiValidating(false);
      if (!ok) return showError(message || "That doesn't look like a description 😬");
      addUser(val);
      setForm(f => ({ ...f, description: val }));
      setInput("");
      await advance("description");
    }
  }, [input, step, advance, showError]);

  // ── Category is now first ──
  const handleCategory = useCallback(async (cat: Category) => {
    addUser(`${cat.name} 🏷️`);
    setForm(f => ({ ...f, category: cat.id, categoryName: cat.name }));
    await advance("category");
  }, [advance]);

  const handleCondition = useCallback(async (cond: string) => {
    addUser(`${CONDITIONS_EMOJI[cond]} ${cond}`);
    setForm(f => ({ ...f, condition: cond }));
    await advance("condition");
  }, [advance]);

  // ── Purchase year: select a year or Skip ──
  const handlePurchaseYear = useCallback(async (year: string | null) => {
    addUser(year ? `${year} 📅` : "Skip 🤷");
    setForm(f => ({ ...f, purchase_year: year ?? "" }));
    await advance("purchase_year");
  }, [advance]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setForm(f => ({ ...f, images: files }));
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleImagesDone = useCallback(async () => {
    if (form.images.length === 0) return showError("Please upload at least one photo. 📸");
    addUser(`${form.images.length} photo${form.images.length > 1 ? "s" : ""} uploaded 📸✓`);
    await advance("images");
  }, [form.images, advance, showError]);

  const handleAskReplace = useCallback(async (wantReplace: boolean) => {
    if (wantReplace) {
      addUser("Yes, I want something specific 🎯");
      setStep("replace_options");
      await sendBot("replace_options");
    } else {
      addUser("No, anything works for me 🤙");
      setStep("confirm");
      await sendBot("confirm");
    }
  }, [sendBot]);

  const handleAddReplace = async () => {
    if (!replaceForm.title.trim()) return showError("Please enter the item name. 📝");
    if (!replaceForm.category)     return showError("Please select a category. 🏷️");
    setIconLoading(true);
    const icon = await getIconForItem(replaceForm.title.trim(), replaceForm.categoryName);
    setIconLoading(false);
    setReplaceOptions(prev => [...prev, {
      id: uid(),
      title: replaceForm.title.trim(),
      description: replaceForm.description.trim(),
      category: replaceForm.category,
      categoryName: replaceForm.categoryName,
      icon,
    }]);
    setReplaceForm({ title: "", description: "", category: null, categoryName: "" });
  };

  const handleReplaceDone = useCallback(async () => {
    if (replaceOptions.length === 0) return showError("Please add at least one item. 🙏");
    addUser(`Want in exchange: ${replaceOptions.map(o => o.title).join(", ")} ✓`);
    setStep("confirm");
    await sendBot("confirm");
  }, [replaceOptions, sendBot, showError]);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("category_id", String(form.category));
      fd.append("condition", form.condition);
      if (form.purchase_year) fd.append("purchase_year", form.purchase_year);
      form.images.forEach(img => fd.append("images", img));

      const res = await fetch(`/api/product/create`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || "Something went wrong");

      const productId: number = data.product_id;

      if (replaceOptions.length > 0) {
        const rRes = await fetch(`/api/product/replace-options`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            body: {
              replace_options: replaceOptions.map(o => ({
                title: o.title,
                description: o.description,
                category_id: o.category,
                replace_type: "product",
                icon: o.icon,
              })),
            },
          }),
        });
        const rData = await rRes.json();
        if (!rRes.ok) throw new Error(rData.error || "Failed to save exchange options");
      }

      setStep("done");
      await sendBot("done");
    } catch (err: any) {
      showError(err.message ?? "Failed to post 😬");
    } finally {
      setLoading(false);
    }
  }, [form, replaceOptions, sendBot, showError]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const showTextInput = ["title", "description"].includes(step);
  const progressPct  = Math.round((STEP_ORDER.indexOf(step) / (STEP_ORDER.length - 1)) * 100);

  // ── Profile checking loader ──
  if (profileChecking) {
    return (
      <AppShellDetail variant="chat">
        <div className={styles.pageWrapper}>
          <div className={styles.page}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: "12px" }}>
              <div className={styles.loadingSpinner} />
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-subtle)" }}>Just a second… 🔍</p>
            </div>
          </div>
        </div>
      </AppShellDetail>
    );
  }

  return (
    <AppShellDetail variant="chat">
      <div className={styles.pageWrapper}>
        <div className={styles.page}>

          {/* ── Profile gate modal ── */}
          <ProfileCompleteModal
            isOpen={profileModalOpen}
            onClose={() => { if (!profileBlocked) setProfileModalOpen(false); }}
            incompleteFields={incompleteFields}
            onSaved={handleProfileSaved}
          />

          {/* ── Blocked overlay ── */}
          {profileBlocked && !profileModalOpen && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 10,
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "12px",
              borderRadius: "inherit",
            }}>
              <p style={{ fontSize: "1rem", fontWeight: 600, color: "#92400E" }}>
                ⚠️ Please complete your profile first!
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-subtle)", textAlign: "center", maxWidth: "260px" }}>
                Your location and contact details are missing. These are required to post a listing.
              </p>
              <button
                onClick={() => setProfileModalOpen(true)}
                style={{
                  padding: "10px 24px", background: "#F59E0B", color: "#fff",
                  border: "none", borderRadius: "999px", fontWeight: 600,
                  fontSize: "0.875rem", cursor: "pointer",
                }}
              >
                Complete Profile
              </button>
            </div>
          )}

          {/* ── Chat Header ── */}
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderLeft}>
              <button className={styles.backBtn} onClick={() => router.back()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
              </button>
              <div className={styles.botChip}>
                <div className={styles.botChipAvatar}>LB</div>
                <div className={styles.botChipInfo}>
                  <span className={styles.botChipName}>ListingBot</span>
                  <span className={styles.botChipStatus}>
                    <span className={styles.statusDot} />
                    {botTyping ? "typing..." : aiValidating ? "thinking… 🧠" : "online"}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.chatHeaderRight}>
              <div className={styles.progressPill}>
                <div className={styles.progressPillBar}>
                  <div className={styles.progressPillFill} style={{ width: `${progressPct}%` }} />
                </div>
                <span className={styles.progressPillText}>{progressPct}%</span>
              </div>
            </div>
          </div>

          {/* ── Progress track ── */}
          <div className={styles.progressTrack}>
            <div className={styles.progressBar} style={{ width: `${progressPct}%` }} />
          </div>

          {/* ── Chat body ── */}
          <div className={styles.chatBody}>
            <div className={styles.dateChip}>Today</div>

            {messages.map(msg => {
              const errorMsg = msg as ChatMessage & { _emoji?: string };
              const isError  = errorMsg.isError && errorMsg._emoji;

              return (
                <div
                  key={msg.id}
                  className={`${styles.msgRow} ${msg.role === "user" ? styles.msgRowUser : styles.msgRowBot}`}
                >
                  {msg.role === "bot" && <div className={styles.avatarSmall}>LB</div>}
                  <div className={msg.role === "bot" ? styles.botBubble : styles.userBubble}>
                    {isError ? (
                      <div className={styles.bubbleText}>
                        <span className={styles.errorEmoji}>{errorMsg._emoji}</span>
                        <span className={styles.errorMsg}>{msg.text}</span>
                      </div>
                    ) : (
                      <div
                        className={styles.bubbleText}
                        dangerouslySetInnerHTML={{
                          __html: msg.text
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/_(.*?)_/g, "<em>$1</em>")
                            .replace(/\n/g, "<br/>"),
                        }}
                      />
                    )}
                    <div className={msg.role === "bot" ? styles.timeBot : styles.timeUser}>
                      {formatTime(msg.timestamp)}
                      {msg.role === "user" && <span className={styles.tick}>✓✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {(botTyping || aiValidating) && (
              <div className={`${styles.msgRow} ${styles.msgRowBot}`}>
                <div className={styles.avatarSmall}>LB</div>
                <div className={styles.botBubble}>
                  <div className={styles.typingDots}>
                    <span className={styles.dot} style={{ animationDelay: "0s" }} />
                    <span className={styles.dot} style={{ animationDelay: "0.2s" }} />
                    <span className={styles.dot} style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP: Category (first step now) ── */}
            {step === "category" && !botTyping && (
              <div className={styles.chipsArea}>
                {categories.map(cat => (
                  <button key={cat.id} className={styles.chip} onClick={() => handleCategory(cat)}>
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* ── STEP: Condition ── */}
            {step === "condition" && !botTyping && (
              <div className={styles.chipsArea}>
                {CONDITIONS.map(c => (
                  <button key={c} className={styles.chip} onClick={() => handleCondition(c)}>
                    {CONDITIONS_EMOJI[c]} {c}
                  </button>
                ))}
              </div>
            )}

            {/* ── STEP: Purchase year (select a year, or skip) ── */}
            {step === "purchase_year" && !botTyping && (
              <div className={styles.actionsArea}>
                <select
                  className={styles.replaceSelect}
                  defaultValue=""
                  onChange={e => { if (e.target.value) handlePurchaseYear(e.target.value); }}
                >
                  <option value="" disabled>Select purchase year…</option>
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button className={styles.chip} onClick={() => handlePurchaseYear(null)}>
                  Skip 🤷
                </button>
              </div>
            )}

            {/* ── STEP: Images ── */}
            {step === "images" && !botTyping && (
              <div className={styles.actionsArea}>
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageChange} />
                <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
                  📷 Choose Photos
                </button>
                {imagePreviews.length > 0 && (
                  <>
                    <div className={styles.previewRow}>
                      {imagePreviews.map((src, i) => (
                        <img key={i} src={src} alt="" className={styles.previewThumb} />
                      ))}
                    </div>
                    <button className={styles.primaryBtn} onClick={handleImagesDone}>
                      Done with photos ✓
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── STEP: Ask replace ── */}
            {step === "ask_replace" && !botTyping && (
              <div className={styles.chipsArea}>
                <button className={styles.chip} onClick={() => handleAskReplace(true)}>
                  🎯 Yes, I want something specific
                </button>
                <button className={styles.chip} onClick={() => handleAskReplace(false)}>
                  🤙 No, anything is fine!
                </button>
              </div>
            )}

            {/* ── STEP: Replace options ── */}
            {step === "replace_options" && !botTyping && (
              <div className={styles.actionsArea}>
                {replaceOptions.length > 0 && (
                  <div className={styles.replaceList}>
                    {replaceOptions.map(opt => (
                      <div key={opt.id} className={styles.replaceCard}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Icon icon={opt.icon ?? "noto:package"} width={24} height={24} style={{ flexShrink: 0 }} />
                          <div>
                            <div className={styles.replaceTitle}>{opt.title}</div>
                            <div className={styles.replaceMeta}>
                              {opt.categoryName}{opt.description ? ` · ${opt.description.slice(0, 40)}` : ""}
                            </div>
                          </div>
                        </div>
                        <button
                          className={styles.removeBtn}
                          onClick={() => setReplaceOptions(p => p.filter(o => o.id !== opt.id))}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className={styles.replaceForm}>
                  <input
                    className={styles.replaceInput}
                    placeholder="Item name (e.g. iPhone 13)"
                    value={replaceForm.title}
                    onChange={e => setReplaceForm(f => ({ ...f, title: e.target.value }))}
                  />
                  <input
                    className={styles.replaceInput}
                    placeholder="Description (optional)"
                    value={replaceForm.description}
                    onChange={e => setReplaceForm(f => ({ ...f, description: e.target.value }))}
                  />
                  <select
                    className={styles.replaceSelect}
                    value={replaceForm.category ?? ""}
                    onChange={e => {
                      const cat = categories.find(c => c.id === Number(e.target.value));
                      setReplaceForm(f => ({ ...f, category: cat?.id ?? null, categoryName: cat?.name ?? "" }));
                    }}
                  >
                    <option value="">Choose a category…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button className={styles.addBtn} onClick={handleAddReplace} disabled={iconLoading}>
                    {iconLoading ? "⏳ Adding..." : "+ Add Item"}
                  </button>
                </div>
                <div className={styles.replaceActions}>
                  <button className={styles.primaryBtn} onClick={handleReplaceDone} disabled={replaceOptions.length === 0}>
                    Done ✓
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP: Confirm — now with image previews ── */}
            {step === "confirm" && !botTyping && (
              <div className={styles.summaryCard}>

                {/* ── Image preview strip at top of summary ── */}
                {imagePreviews.length > 0 && (
                  <div className={styles.summaryImgStrip}>
                    {imagePreviews.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`Photo ${i + 1}`}
                        className={styles.summaryThumb}
                      />
                    ))}
                  </div>
                )}

                <SummaryRow label="📦 Item"        value={form.title} />
                <SummaryRow label="📝 Description" value={form.description} />
                <SummaryRow label="🏷️ Category"    value={form.categoryName} />
                <SummaryRow label="✨ Condition"    value={form.condition} />
                {form.purchase_year && <SummaryRow label="📅 Bought In"  value={form.purchase_year} />}
                <SummaryRow label="📸 Photos"       value={`${form.images.length} uploaded`} />
                <SummaryRow label="💱 Want in return" value={
                  replaceOptions.length === 0
                    ? "Anything works 🤙"
                    : replaceOptions.map(o => o.title).join(", ")
                } />
                <div className={styles.divider} />
                <button className={styles.confirmBtn} onClick={handleConfirm} disabled={loading}>
                  {loading ? "Posting… ⏳" : "🚀 Confirm & Post!"}
                </button>
              </div>
            )}

            {/* ── STEP: Done ── */}
            {step === "done" && !botTyping && (
              <div className={styles.actionsArea}>
                <button className={styles.primaryBtn} onClick={() => router.push("/swap")}>
                  Go to Dashboard 🏠
                </button>
                <button className={styles.chip} onClick={() => router.push("/listings")}>
                  View My Listings 📋
                </button>
              </div>
            )}

            <div style={{ minHeight: "8px", flexShrink: 0 }} />
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          {showTextInput && !profileBlocked && (
            <div className={styles.inputBar}>
              <input
                ref={inputRef}
                className={styles.textInput}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  step === "title" ? "Enter item name…" : "Describe your item…"
                }
                disabled={botTyping || aiValidating}
              />
              <button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={!input.trim() || botTyping || aiValidating}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          )}

        </div>
      </div>
    </AppShellDetail>
  );
}

// ─── Summary Row ──────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.summaryRow}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryValue}>{value}</span>
    </div>
  );
}
