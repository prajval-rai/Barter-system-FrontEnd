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
  _emoji?: string;
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

// ── NEW ORDER: intent (exchange/rent/want) comes first, then category ──
type Step =
  | "intent" | "category" | "title" | "description" | "condition"
  | "purchase_year" | "images" | "ask_replace"
  | "replace_options" | "confirm" | "done";

// ─── Constants ────────────────────────────────────────────────────────────────

const CONDITIONS = ["Brand New", "Like New", "Good", "Fair"];

const CONDITIONS_EMOJI: Record<string, string> = {
  "Brand New": "✨", "Like New": "💫", "Good": "👍", "Fair": "🤷",
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS: number[] = Array.from({ length: CURRENT_YEAR - 1990 + 1 }, (_, i) => CURRENT_YEAR - i);

// ── NOTE: wrap text in ==...== for a highlight chip, **_text_** for bold-italic
// question emphasis, and {{text}} for an "example" hint tag ──
const STEP_QUESTIONS: Record<Step, string> = {
  intent:          "Hi! 👋 **_What would you like to do today?_**",
  category:        "Great, let's list your item for exchange! 😊 **_First, choose the category._**",
  title:           "Great! 😊 **_What's the name of your item?_** {{e.g. iPhone 13, Yamaha FZ, Harry Potter Book}}",
  description:     "**_Tell us a little about your item._** 📝 {{e.g. Used for 1 year, minor scratch on back, all accessories included}} 😊",
  condition:       "**_How is the condition of your item?_** Please choose the best option.",
  purchase_year:   "**_When did you buy it?_** 📅 Select the purchase year, or tap Skip if you don't remember.",
  images:          "**_Please upload some photos._** 📸 Clear photos help you get better offers. You can add up to 5 photos.",
  ask_replace:     "**_What would you like in exchange?_** Or are you okay with any item?",
  replace_options: "**_Tell us what you'd like in exchange._** 💱 {{e.g. Bluetooth speaker, Cricket bat, Novel}}",
  confirm:         "Almost done! 😊 **_Please check your listing once before submitting._**",
  done:            "🎉 **_Done!_** Your item has been submitted and is under review. You'll start receiving offers soon.",
};

const STEP_ORDER: Step[] = [
  "intent", "category", "title", "description", "condition",
  "purchase_year", "images", "ask_replace", "replace_options", "confirm", "done",
];

const REQUIRED_PROFILE_FIELDS = ["latitude", "longitude", "address", "city", "pincode", "contact_number"];

// ── Draft persistence key. Bump the suffix if the shape ever changes,
// so stale drafts from an old version don't get force-loaded. ──
const DRAFT_KEY = "addListingDraft_v1";

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
    // NOTE: this hits OpenAI directly from the client today, which means
    // NEXT_PUBLIC_OPENAI_KEY is exposed in the browser bundle. Route this
    // through a server API instead (see notes at the end of the response).
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
  const [step, setStep]                       = useState<Step>("intent");
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

  // ── Fixes the "question flashes before loader" race: a step's action
  // UI (chips/buttons/inputs) only renders once its bot bubble has
  // actually landed in `messages`. Never before, never mid-loader. ──
  const [stepReady, setStepReady]             = useState(false);

  // ── Editing from the confirm summary: when set, finishing this step
  // jumps straight back to "confirm" instead of advancing forward
  // through the rest of the flow. ──
  const [editingField, setEditingField]       = useState<Step | null>(null);

  // ── Back-button discard confirmation ──
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

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

  // ── Sequence is now strict: hide step UI -> wait -> show loader ->
  // wait -> hide loader -> show bot message -> THEN reveal step UI.
  // `customText` lets edit-mode show a different line than the
  // original step question. ──
  const sendBot = useCallback(async (s: Step, delay = 300, customText?: string) => {
    setStepReady(false);
    await sleep(delay);
    setBotTyping(true);
    await sleep(800);
    setBotTyping(false);
    setMessages(prev => [...prev, { id: uid(), role: "bot", text: customText ?? STEP_QUESTIONS[s], timestamp: new Date() }]);
    setStepReady(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // ── Restore a saved draft from sessionStorage, or start fresh at
  // "intent". Photos can't survive JSON serialization (File objects),
  // so a draft that got past the images step gets bounced back there
  // with a friendly note instead of silently losing photos at submit. ──
  const startOrRestore = useCallback(async () => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft?.step && draft.step !== "intent" && draft.step !== "done") {
          const restoredMessages: ChatMessage[] = (draft.messages ?? []).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
          setForm(f => ({ ...f, ...draft.form, images: [] }));
          setReplaceOptions(draft.replaceOptions ?? []);

          const pastImages = STEP_ORDER.indexOf(draft.step) > STEP_ORDER.indexOf("images");

          setMessages([
            ...restoredMessages,
            {
              id: uid(),
              role: "bot",
              text: pastImages
                ? "👋 **_Welcome back!_** We picked up your draft, but photos don't survive a refresh — please add them again. 📸"
                : "👋 **_Welcome back!_** Continuing right where you left off.",
              timestamp: new Date(),
            },
          ]);
          setStep(pastImages ? "images" : draft.step);
          setStepReady(true);
          setTimeout(() => inputRef.current?.focus(), 100);
          return;
        }
      }
    } catch {
      // corrupt/old draft — ignore and start fresh
    }
    sendBot("intent");
  }, [sendBot]);

  // ── Profile check + bot init (starts at "intent" now) ──
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
          startOrRestore();
        }
      } catch {
        setProfileBlocked(false);
        setProfileChecking(false);
        startOrRestore();
      }
    };

    init();
  }, [startOrRestore]);

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
        startOrRestore();
      }
    } catch {
      setProfileBlocked(false);
      startOrRestore();
    }
  }, [startOrRestore]);

  // ── Save draft to sessionStorage whenever meaningful state changes.
  // Images are intentionally excluded (Files can't be serialized). ──
  useEffect(() => {
    if (profileChecking || profileBlocked) return;
    if (step === "intent" && messages.length === 0) return;
    if (step === "done") {
      try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
      return;
    }
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
        step,
        form: { ...form, images: [] },
        replaceOptions,
        messages: messages.map(m => ({ ...m, timestamp: m.timestamp.toISOString() })),
      }));
    } catch {
      // storage full/unavailable — draft just won't persist, non-fatal
    }
  }, [step, form, replaceOptions, messages, profileChecking, profileBlocked]);

  const addUser = (text: string) =>
    setMessages(prev => [...prev, { id: uid(), role: "user", text, timestamp: new Date() }]);

  const showError = useCallback((msg: string) => {
    const emoji = getErrorEmoji(msg);
    setMessages(prev => [
      ...prev,
      { id: uid(), role: "bot", text: msg, timestamp: new Date(), isError: true, _emoji: emoji },
    ]);
  }, []);

  const advance = useCallback(async (current: Step) => {
    const idx  = STEP_ORDER.indexOf(current);
    const next = STEP_ORDER[idx + 1] as Step;
    setStep(next);
    await sendBot(next);
  }, [sendBot]);

  // ── Used by every step that can be reached either normally (advance
  // forward) or via an edit from the confirm summary (jump straight
  // back to confirm instead of redoing the rest of the flow). ──
  const finishStepOrReturn = useCallback(async (current: Step) => {
    if (editingField) {
      setEditingField(null);
      setStep("confirm");
      await sendBot("confirm", 200, "✅ Got it, updated! Here's your listing:");
    } else {
      await advance(current);
    }
  }, [editingField, advance, sendBot]);

  // ── Jump back to any earlier step to edit it, from the confirm
  // summary. Pre-fills text inputs so the user isn't starting blank. ──
  const jumpToEdit = useCallback(async (target: Step) => {
    setEditingField(target);
    setStep(target);
    if (target === "title") setInput(form.title);
    else if (target === "description") setInput(form.description);
    else setInput("");
    await sendBot(target, 150, `✏️ Let's update this — ${STEP_QUESTIONS[target]}`);
  }, [form, sendBot]);

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
      await finishStepOrReturn("title");

    } else if (step === "description") {
      if (val.length < 10) return showError("Please add a few more details (minimum 10 characters). 🙏");
      setAiValidating(true);
      const { ok, message } = await validateWithAI("description", val);
      setAiValidating(false);
      if (!ok) return showError(message || "That doesn't look like a description 😬");
      addUser(val);
      setForm(f => ({ ...f, description: val }));
      setInput("");
      await finishStepOrReturn("description");
    }
  }, [input, step, finishStepOrReturn, showError]);

  // ── Intent: only "Exchange" is live. Rent / Want Something are locked. ──
  const handleIntent = useCallback(async () => {
    addUser("Exchange an item 🔄");
    await advance("intent");
  }, [advance]);

  const handleCategory = useCallback(async (cat: Category) => {
    addUser(`${cat.name} 🏷️`);
    setForm(f => ({ ...f, category: cat.id, categoryName: cat.name }));
    await finishStepOrReturn("category");
  }, [finishStepOrReturn]);

  const handleCondition = useCallback(async (cond: string) => {
    addUser(`${CONDITIONS_EMOJI[cond]} ${cond}`);
    setForm(f => ({ ...f, condition: cond }));
    await finishStepOrReturn("condition");
  }, [finishStepOrReturn]);

  // ── Purchase year: select a year or Skip ──
  const handlePurchaseYear = useCallback(async (year: string | null) => {
    addUser(year ? `${year} 📅` : "Skip 🤷");
    setForm(f => ({ ...f, purchase_year: year ?? "" }));
    await finishStepOrReturn("purchase_year");
  }, [finishStepOrReturn]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setImagePreviews(prev => {
      prev.forEach(url => URL.revokeObjectURL(url)); // avoid leaking old blob URLs
      return files.map(f => URL.createObjectURL(f));
    });
    setForm(f => ({ ...f, images: files }));
  };

  const handleImagesDone = useCallback(async () => {
    if (form.images.length === 0) return showError("Please upload at least one photo. 📸");
    addUser(`${form.images.length} photo${form.images.length > 1 ? "s" : ""} uploaded 📸✓`);
    await finishStepOrReturn("images");
  }, [form.images, finishStepOrReturn, showError]);

  const handleAskReplace = useCallback(async (wantReplace: boolean) => {
    setEditingField(null); // ask_replace always resolves to confirm/replace_options either way
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
    setEditingField(null);
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

      try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
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

  // ── Back button: only prompt if there's actually something to lose ──
  const hasProgress = step !== "intent" && step !== "done";

  const handleBackClick = () => {
    if (!hasProgress) {
      router.back();
    } else {
      setShowDiscardConfirm(true);
    }
  };

  const handleDiscardConfirm = () => {
    try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
    setShowDiscardConfirm(false);
    router.back();
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

          {/* ── Discard confirmation modal ── */}
          {showDiscardConfirm && (
            <div
              style={{
                position: "fixed", inset: 0, zIndex: 50,
                background: "rgba(0,0,0,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onClick={() => setShowDiscardConfirm(false)}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  background: "#fff", borderRadius: "16px", padding: "24px",
                  maxWidth: "320px", width: "90%", textAlign: "center",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🤔</div>
                <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "4px" }}>
                  Discard this listing?
                </p>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-subtle)", marginBottom: "20px" }}>
                  Your progress hasn't been posted yet. If you leave now, you'll lose what you've filled in.
                </p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setShowDiscardConfirm(false)}
                    style={{
                      flex: 1, padding: "10px", borderRadius: "999px",
                      border: "1px solid #e5e7eb", background: "#fff",
                      fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Keep editing
                  </button>
                  <button
                    onClick={handleDiscardConfirm}
                    style={{
                      flex: 1, padding: "10px", borderRadius: "999px",
                      border: "none", background: "#EF4444", color: "#fff",
                      fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Discard
                  </button>
                </div>
              </div>
            </div>
          )}

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
              <button className={styles.backBtn} onClick={handleBackClick}>
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
          <div className={styles.chatBody} aria-live="polite">
            <div className={styles.dateChip}>Today</div>

            {messages.map(msg => {
              const isError = msg.isError && msg._emoji;

              return (
                <div
                  key={msg.id}
                  className={`${styles.msgRow} ${msg.role === "user" ? styles.msgRowUser : styles.msgRowBot}`}
                >
                  {msg.role === "bot" && <div className={styles.avatarSmall}>LB</div>}
                  <div className={msg.role === "bot" ? styles.botBubble : styles.userBubble}>
                    {isError ? (
                      <div className={styles.bubbleText}>
                        <span className={styles.errorEmoji}>{msg._emoji}</span>
                        <span className={styles.errorMsg}>{msg.text}</span>
                      </div>
                    ) : msg.role === "bot" ? (
                      <div
                        className={styles.bubbleText}
                        dangerouslySetInnerHTML={{
                          __html: msg.text
                            // ── ==text== renders as a bold highlighted chip ──
                            .replace(/==(.*?)==/g, `<span class="${styles.highlightText}">$1</span>`)
                            // ── {{text}} renders as a muted italic "example" hint ──
                            .replace(/\{\{(.*?)\}\}/g, `<span class="${styles.exampleHint}">✏️ $1</span>`)
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/_(.*?)_/g, "<em>$1</em>")
                            .replace(/\n/g, "<br/>"),
                        }}
                      />
                    ) : (
                      // ── User text is rendered as plain text, not HTML —
                      // it's not trusted input and shouldn't run through
                      // the markdown-style parser. ──
                      <div className={styles.bubbleText}>{msg.text}</div>
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

            {/* ── STEP: Intent (brand new first step) ── */}
            {step === "intent" && stepReady && (
              <div className={styles.chipsArea}>
                <button className={styles.chip} onClick={handleIntent}>
                  🔄 Exchange an item
                </button>
                <button className={`${styles.chip} ${styles.chipDisabled}`} disabled type="button" aria-disabled="true" title="Coming soon">
                  🏠 Rent an item
                  <span className={styles.comingSoonTag}>Coming soon</span>
                </button>
                <button className={`${styles.chip} ${styles.chipDisabled}`} disabled type="button" aria-disabled="true" title="Coming soon">
                  🎁 I want something
                  <span className={styles.comingSoonTag}>Coming soon</span>
                </button>
              </div>
            )}

            {/* ── STEP: Category ── */}
            {step === "category" && stepReady && (
              <div className={styles.chipsArea}>
                {categories.map(cat => (
                  <button key={cat.id} className={styles.chip} onClick={() => handleCategory(cat)}>
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* ── STEP: Condition ── */}
            {step === "condition" && stepReady && (
              <div className={styles.chipsArea}>
                {CONDITIONS.map(c => (
                  <button key={c} className={styles.chip} onClick={() => handleCondition(c)}>
                    {CONDITIONS_EMOJI[c]} {c}
                  </button>
                ))}
              </div>
            )}

            {/* ── STEP: Purchase year (select a year, or skip) ── */}
            {step === "purchase_year" && stepReady && (
              <div className={styles.actionsArea}>
                <select
                  className={`${styles.replaceSelect} ${styles.yearSelect}`}
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
            {step === "images" && stepReady && (
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
            {step === "ask_replace" && stepReady && (
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
            {step === "replace_options" && stepReady && (
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

            {/* ── STEP: Confirm — every row can be edited in place ── */}
            {step === "confirm" && stepReady && (
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

                <SummaryRow label="📦 Item"        value={form.title} onEdit={() => jumpToEdit("title")} />
                <SummaryRow label="📝 Description" value={form.description} onEdit={() => jumpToEdit("description")} />
                <SummaryRow label="🏷️ Category"    value={form.categoryName} onEdit={() => jumpToEdit("category")} />
                <SummaryRow label="✨ Condition"    value={form.condition} onEdit={() => jumpToEdit("condition")} />
                <SummaryRow
                  label="📅 Bought In"
                  value={form.purchase_year || "Not specified"}
                  onEdit={() => jumpToEdit("purchase_year")}
                />
                <SummaryRow
                  label="📸 Photos"
                  value={`${form.images.length} uploaded`}
                  onEdit={() => jumpToEdit("images")}
                />
                <SummaryRow
                  label="💱 Want in return"
                  value={replaceOptions.length === 0 ? "Anything works 🤙" : replaceOptions.map(o => o.title).join(", ")}
                  onEdit={() => jumpToEdit("ask_replace")}
                />
                <div className={styles.divider} />
                <button className={styles.confirmBtn} onClick={handleConfirm} disabled={loading}>
                  {loading ? "Posting… ⏳" : "🚀 Confirm & Post!"}
                </button>
              </div>
            )}

            {/* ── STEP: Done ── */}
            {step === "done" && stepReady && (
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
          {showTextInput && stepReady && !profileBlocked && (
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

function SummaryRow({
  label, value, onEdit,
}: { label: string; value: string; onEdit?: () => void }) {
  return (
    <div className={styles.summaryRow}>
      <span className={styles.summaryLabel}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span className={styles.summaryValue}>{value}</span>
        {onEdit && (
          <button
            onClick={onEdit}
            aria-label={`Edit ${label}`}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "0.85rem", padding: "2px 4px", opacity: 0.6, lineHeight: 1,
            }}
          >
            ✏️
          </button>
        )}
      </div>
    </div>
  );
}
