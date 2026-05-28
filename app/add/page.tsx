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

type Step =
  | "title" | "description" | "category" | "condition"
  | "purchase_year" | "images" | "ask_replace"
  | "replace_options" | "confirm" | "done";

// ─── Constants ────────────────────────────────────────────────────────────────

const CONDITIONS = ["Brand New", "Like New", "Good", "Fair"];

const CONDITIONS_EMOJI: Record<string, string> = {
  "Brand New": "✨", "Like New": "💫", "Good": "👍", "Fair": "🤷",
};

const STEP_QUESTIONS: Record<Step, string> = {
  title:           "Arre bhai! 👋 Kya bechna hai? Item ka naam bata!\n_e.g. Sony WH-1000XM5, Purani Cycle, iPhone 13_",
  description:     "Wah choice! ✨ Ab thoda detail de — condition kaisi hai, kyun bech raha hai, koi kharabi toh nahi?\n_e.g. 6 mahine purana, ek chhoti si scratch hai, baaki bilkul sahi_",
  category:        "Theek hai bhai 😎 Kaunsi category mein aata hai yeh item?",
  condition:       "Sachchi bata 😅 Item ki condition kaisi hai?",
  purchase_year:   "Kab liya tha yeh? 📅 Saal bata ya **skip** likh de agar yaad nahi",
  images:          "Photo daal bhai! 📸 Bina photo ke koi nahi kharidega (max 5 photos). Jitni achi photo, utna jaldi deal!",
  ask_replace:     "Almost ho gaya! 🎯 Koi specific cheez chahiye badle mein, ya kuch bhi chalega?",
  replace_options: "Kya chahiye badle mein? 💱 Jo bhi item chahiye wo add kar — ek se zyada bhi dal sakta hai!",
  confirm:         "Ek dum sahi lag raha hai! 🔥 Yeh raha tera listing summary. Sab theek hai?",
  done:            "🎉 Bhai tu officially trader ban gaya! Teri listing live ho gayi, review mein hai. Ab offers ka wait kar 💸",
};

const STEP_ORDER: Step[] = [
  "title","description","category","condition",
  "purchase_year","images","ask_replace","replace_options","confirm","done",
];

const REQUIRED_PROFILE_FIELDS = ["latitude", "longitude", "address", "city", "pincode", "contact_number"];

function uid() { return Math.random().toString(36).slice(2); }
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── OpenAI validator ─────────────────────────────────────────────────────────

async function validateWithAI(step: Step, value: string): Promise<{ ok: boolean; message: string }> {
  const prompts: Partial<Record<Step, string>> = {
    title: `Tu ek Indian barter marketplace ka funny aur bindaas assistant hai jiska naam SwapBot hai. Hinglish mein baat kar — matlab Hindi + English mix, jaise desi log normally bolte hain.
      User ne yeh product name daala hai listing ke liye: "${value}".
      Rules:
      - Agar real product name lagta hai (mobile, laptop, book, kapde, cycle, etc.) → ok: true, message: ""
      - Agar "hi", "hello", "hey" jaisa greeting hai → ok: false, e.g. "bhai 'hi' bol ke kya bechega? 😂 product ka naam likh na!"
      - Agar random gibberish hai jaise "asdfgh", "qwerty" → ok: false, e.g. "yeh product hai ya bijli ka bill? 😭 seedha naam likh bhai"
      - Agar question hai jaise "kya bechun?" → ok: false, e.g. "mujhse pooch raha hai?? tera saman tu hi jaanta hai bhai 😂"
      - Agar single random word hai jo product nahi lagta → ok: false, e.g. "bhai yeh naam hai ya joke? thoda aur specific ho ja 😅"
      - Message 12 words se kam rakho, 1 emoji max, Hinglish mein rakho, roast funny ho mean nahi
      Sirf JSON return karo (no markdown): {"ok": true/false, "message": "..."}`,

    description: `Tu ek Indian barter marketplace ka funny aur bindaas assistant hai jiska naam SwapBot hai. Hinglish mein baat kar — matlab Hindi + English mix, jaise desi log normally bolte hain.
      User ne yeh product description daali hai: "${value}".
      Rules:
      - Agar actual description hai — condition, features, kyun bech raha hai → ok: true, message: ""
      - Agar 10 characters se kam hai → ok: false, e.g. "itni choti description?? WhatsApp status bhi isse lamba hota hai 😂"
      - Agar sirf "good", "nice", "ok", "theek hai" jaisa hai → ok: false, e.g. "'good' likh ke soch liya kaam ho gaya? 😭 thoda detail de bhai!"
      - Agar greeting hai jaise "hello", "namaste" → ok: false, e.g. "description mein namaste?? yeh OLX nahi hai bhai 😂 item ke baare mein bata!"
      - Agar gibberish hai → ok: false, e.g. "bhai keyboard pe haath maar ke description likh di? 💀 dobara try kar!"
      - Agar question hai → ok: false, e.g. "description mein sawaal?? SwapBot ka dimaag mat kha 😭 item describe kar!"
      - Message 14 words se kam, 1 emoji max, pure Hinglish tone
      Sirf JSON return karo (no markdown): {"ok": true/false, "message": "..."}`,
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
  const [step, setStep]                       = useState<Step>("title");
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
  const [error, setError]                     = useState("");
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
    fetch(`/api/categories`)                          // ← changed
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

  // ── Profile check + bot init ──
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
          sendBot("title");
        }
      } catch {
        // On error, let them through
        setProfileBlocked(false);
        setProfileChecking(false);
        sendBot("title");
      }
    };

    init();
  }, [sendBot]);

  // Called when user saves profile from modal
  const handleProfileSaved = useCallback(async () => {
    setProfileModalOpen(false);
    try {
      const res = await fetch(`/api/completion`);     
      const data = await res.json();

      const missing = (data.incomplete_fields ?? []).filter((f: string) =>
        REQUIRED_PROFILE_FIELDS.includes(f)
      );

      if (missing.length > 0) {
        // Still incomplete — keep blocked, reopen modal with remaining fields
        setIncompleteFields(missing);
        setProfileBlocked(true);
        setProfileModalOpen(true);
      } else {
        // All good — start the bot
        setIncompleteFields([]);
        setProfileBlocked(false);
        sendBot("title");
      }
    } catch {
      setProfileBlocked(false);
      sendBot("title");
    }
  }, [sendBot]);

  const addUser = (text: string) =>
    setMessages(prev => [...prev, { id: uid(), role: "user", text, timestamp: new Date() }]);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 2500);
  };

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
      if (val.length < 3) return showError("Arre bhai itna chota naam? 😅 Thoda aur likh!");
      setAiValidating(true);
      const { ok, message } = await validateWithAI("title", val);
      setAiValidating(false);
      if (!ok) return showError(message || "Hmm that doesn't look like a product name 🤔");
      addUser(val);
      setForm(f => ({ ...f, title: val }));
      setInput("");
      await advance("title");

    } else if (step === "description") {
      if (val.length < 10) return showError("Itna kam? Thoda aur likh bhai! 🙏 10 characters minimum");
      setAiValidating(true);
      const { ok, message } = await validateWithAI("description", val);
      setAiValidating(false);
      if (!ok) return showError(message || "That doesn't look like a description 😬");
      addUser(val);
      setForm(f => ({ ...f, description: val }));
      setInput("");
      await advance("description");

    } else if (step === "purchase_year") {
      const isSkip = val.toLowerCase() === "skip";
      const yr     = parseInt(val);
      if (!isSkip && (isNaN(yr) || yr < 1990 || yr > new Date().getFullYear()))
        return showError(`Saal 1990 se ${new Date().getFullYear()} ke beech hona chahiye, ya 'skip' likh 😊`);
      addUser(isSkip ? "Skipped 🤷" : `${val} 📅`);
      setForm(f => ({ ...f, purchase_year: isSkip ? "" : val }));
      setInput("");
      await advance("purchase_year");
    }
  }, [input, step, advance]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setForm(f => ({ ...f, images: files }));
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleImagesDone = useCallback(async () => {
    if (form.images.length === 0) return showError("Kam se kam 1 photo toh daal bhai! 📸");
    addUser(`${form.images.length} photo${form.images.length > 1 ? "s" : ""} upload ho gayi 📸✓`);
    await advance("images");
  }, [form.images, advance]);

  const handleAskReplace = useCallback(async (wantReplace: boolean) => {
    if (wantReplace) {
      addUser("Haan bhai, specific item chahiye 🎯");
      setStep("replace_options");
      await sendBot("replace_options");
    } else {
      addUser("Nahi bhai, kuch bhi chalega 🤙");
      setStep("confirm");
      await sendBot("confirm");
    }
  }, [sendBot]);

  const handleAddReplace = async () => {
    if (!replaceForm.title.trim()) return showError("Item ka naam toh bata! 📝");
    if (!replaceForm.category)     return showError("Category bhi choose kar bhai 🏷️");
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
    if (replaceOptions.length === 0) return showError("Kam se kam ek item toh add kar! 🙏");
    addUser(`Chahiye badle mein: ${replaceOptions.map(o => o.title).join(", ")} ✓`);
    setStep("confirm");
    await sendBot("confirm");
  }, [replaceOptions, sendBot]);

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

      const res = await fetch(`/api/product/create`, {  // ← changed
      method: "POST",
      body: fd,                                         // formData — no Content-Type header needed
    });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || "Something went wrong");

      const productId: number = data.product_id;

      if (replaceOptions.length > 0) {
        const rRes = await fetch(`/api/products/replace-options`, {  // ← changed
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,                                      // ← pass productId in body
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
  }, [form, replaceOptions, sendBot]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const showTextInput = ["title", "description", "purchase_year"].includes(step);
  const progressPct  = Math.round((STEP_ORDER.indexOf(step) / (STEP_ORDER.length - 1)) * 100);

  // ── Profile checking loader ──
  if (profileChecking) {
    return (
      <AppShellDetail>
        <div className={styles.pageWrapper}>
          <div className={styles.page}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: "12px" }}>
              <div className={styles.loadingSpinner} />
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-subtle)" }}>Ek second bhai… 🔍</p>
            </div>
          </div>
        </div>
      </AppShellDetail>
    );
  }

  return (
    <AppShellDetail>
      <div className={styles.pageWrapper}>
        <div className={styles.page}>

          {/* ── Profile gate modal ── */}
          <ProfileCompleteModal
            isOpen={profileModalOpen}
            onClose={() => {
              // Don't allow closing if profile is still blocked
              if (!profileBlocked) setProfileModalOpen(false);
            }}
            incompleteFields={incompleteFields}
            onSaved={handleProfileSaved}
          />

          {/* ── Blocked overlay (if modal is dismissed somehow) ── */}
          {profileBlocked && !profileModalOpen && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 10,
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "12px",
              borderRadius: "inherit",
            }}>
              <p style={{ fontSize: "1rem", fontWeight: 600, color: "#92400E" }}>
                ⚠️ Pehle profile complete kar bhai!
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-subtle)", textAlign: "center", maxWidth: "260px" }}>
                Location aur contact details missing hain. Listing post karne ke liye yeh zaroori hai.
              </p>
              <button
                onClick={() => setProfileModalOpen(true)}
                style={{
                  padding: "10px 24px", background: "#F59E0B", color: "#fff",
                  border: "none", borderRadius: "999px", fontWeight: 600,
                  fontSize: "0.875rem", cursor: "pointer",
                }}
              >
                Profile Complete Karo
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
                    {botTyping ? "typing..." : aiValidating ? "thinking... 🧠" : "online"}
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

            {messages.map(msg => (
              <div key={msg.id} className={`${styles.msgRow} ${msg.role === "user" ? styles.msgRowUser : styles.msgRowBot}`}>
                {msg.role === "bot" && <div className={styles.avatarSmall}>LB</div>}
                <div className={msg.role === "bot" ? styles.botBubble : styles.userBubble}>
                  <div
                    className={styles.bubbleText}
                    dangerouslySetInnerHTML={{
                      __html: msg.text
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/_(.*?)_/g, "<em>$1</em>")
                        .replace(/\n/g, "<br/>"),
                    }}
                  />
                  <div className={msg.role === "bot" ? styles.timeBot : styles.timeUser}>
                    {formatTime(msg.timestamp)}
                    {msg.role === "user" && <span className={styles.tick}>✓✓</span>}
                  </div>
                </div>
              </div>
            ))}

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

            {/* Category chips */}
            {step === "category" && !botTyping && (
              <div className={styles.chipsArea}>
                {categories.map(cat => (
                  <button key={cat.id} className={styles.chip} onClick={() => handleCategory(cat)}>
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Condition chips */}
            {step === "condition" && !botTyping && (
              <div className={styles.chipsArea}>
                {CONDITIONS.map(c => (
                  <button key={c} className={styles.chip} onClick={() => handleCondition(c)}>
                    {CONDITIONS_EMOJI[c]} {c}
                  </button>
                ))}
              </div>
            )}

            {/* Images */}
            {step === "images" && !botTyping && (
              <div className={styles.actionsArea}>
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageChange} />
                <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
                  📷 Photos Choose Karo
                </button>
                {imagePreviews.length > 0 && (
                  <>
                    <div className={styles.previewRow}>
                      {imagePreviews.map((src, i) => (
                        <img key={i} src={src} alt="" className={styles.previewThumb} />
                      ))}
                    </div>
                    <button className={styles.primaryBtn} onClick={handleImagesDone}>
                      Photos ho gayi ✓
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Ask replace */}
            {step === "ask_replace" && !botTyping && (
              <div className={styles.chipsArea}>
                <button className={styles.chip} onClick={() => handleAskReplace(true)}>
                  🎯 Haan, specific item chahiye
                </button>
                <button className={styles.chip} onClick={() => handleAskReplace(false)}>
                  🤙 Nahi, kuch bhi chalega!
                </button>
              </div>
            )}

            {/* Replace options */}
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
                    placeholder="Item ka naam (e.g. iPhone 13)"
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
                    <option value="">Category choose karo…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button
                    className={styles.addBtn}
                    onClick={handleAddReplace}
                    disabled={iconLoading}
                  >
                    {iconLoading ? "⏳ Adding..." : "+ Option Add Karo"}
                  </button>
                </div>

                <div className={styles.replaceActions}>
                  <button
                    className={styles.primaryBtn}
                    onClick={handleReplaceDone}
                    disabled={replaceOptions.length === 0}
                  >
                    Done ✓
                  </button>
                </div>
              </div>
            )}

            {/* Confirm */}
            {step === "confirm" && !botTyping && (
              <div className={styles.summaryCard}>
                <SummaryRow label="📦 Item"       value={form.title} />
                <SummaryRow label="📝 Description" value={form.description} />
                <SummaryRow label="🏷️ Category"   value={form.categoryName} />
                <SummaryRow label="✨ Condition"   value={form.condition} />
                {form.purchase_year && <SummaryRow label="📅 Kab liya" value={form.purchase_year} />}
                <SummaryRow label="📸 Photos"      value={`${form.images.length} upload hui`} />
                <SummaryRow label="💱 Badle mein"  value={
                  replaceOptions.length === 0
                    ? "Kuch bhi chalega 🤙"
                    : replaceOptions.map(o => o.title).join(", ")
                } />
                <div className={styles.divider} />
                <button className={styles.confirmBtn} onClick={handleConfirm} disabled={loading}>
                  {loading ? "Post ho raha hai... ⏳" : "🚀 Confirm karo & Post karo!"}
                </button>
              </div>
            )}

            {/* Done */}
            {step === "done" && !botTyping && (
              <div className={styles.actionsArea}>
                <button className={styles.primaryBtn} onClick={() => router.push("/")}>
                  Dashboard pe jao 🏠
                </button>
                <button className={styles.chip} onClick={() => router.push("/listings")}>
                  Meri Listings dekho 📋
                </button>
              </div>
            )}

            <div style={{ minHeight: "12px", flexShrink: 0 }} />
            <div ref={bottomRef} />
          </div>

          {/* Error toast */}
          {error && <div className={styles.errorToast}>{error}</div>}

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
                  step === "title"         ? "Item ka naam likh…"
                  : step === "description" ? "Item ke baare mein bata…"
                  : "Saal likho jaise 2022 ya skip"
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
