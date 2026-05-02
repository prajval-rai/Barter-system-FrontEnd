"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "../../styles/Addproductmodal.module.css";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category {
  id: number;
  name: string;
}

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  text: string;
}

interface ReplaceOptionDraft {
  id: string;
  title: string;
  description: string;
  category: number | null;
  categoryName: string;
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
  | "title"
  | "description"
  | "category"
  | "condition"
  | "purchase_year"
  | "images"
  | "replace_options"
  | "confirm"
  | "done";

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onProductCreated?: (productId: number) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONDITIONS = ["Brand New", "Like New", "Good", "Fair"];

const BOT_QUESTIONS: Record<Step, string> = {
  title: "Hey! 👋 Type the **name** of the product you want to list.\n_e.g. Sony WH-1000XM5, iPhone 14, Kindle Paperwhite_",
  description:
    "Nice! ✨ Now write a **short description** — condition, specs, why you're swapping it.\n_e.g. Bought in 2023, minor scratches, works perfectly._",
  category: "Which **category** does it belong to? Tap one below 👇",
  condition: "What's the **condition** of your item? Tap one below 👇",
  purchase_year:
    "What **year** did you purchase it?\n_Type the year e.g. 2022 — or type **skip**_",
  images:
    "Almost there! 📸 Upload some **photos** of your item (up to 5). Tap **Done** when ready.",
  replace_options:
    "💱 What product would you like in **exchange**? Add one or more options below. Tap **Done** when ready (or **Skip** if you're flexible).",
  confirm:
    "Here's your listing summary. Does everything look good? Tap **Confirm & Post** to go live! 🚀",
  done: "🎉 Your product has been listed successfully! It's now under review by our team.",
};

const CHAT_PHRASES = [
  /^(hi|hello|hey|hii|helo|sup|yo)\b/i,
  /^(what|how|why|who|when|where|which)\b/i,
  /^(ok|okay|sure|alright|cool|nice|great|thanks|thx|ty)\b/i,
  /^(lol|haha|hehe|hmm+|uh+|um+|ah+)\b/i,
  /\?$/,
];

function looksLikeChat(val: string): boolean {
  return CHAT_PHRASES.some((re) => re.test(val.trim()));
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const STEP_ORDER: Step[] = [
  "title", "description", "category", "condition", "purchase_year", "images",
];

const editableSteps: Step[] = ["title", "description", "category", "condition", "purchase_year"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddProductModal({
  open,
  onClose,
  onProductCreated,
}: AddProductModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<Step>("title");
  const [form, setForm] = useState<ProductForm>({
    title: "",
    description: "",
    category: null,
    categoryName: "",
    condition: "",
    purchase_year: "",
    images: [],
  });

  // ── Replace options state ────────────────────────────────────────────────────
  const [replaceOptions, setReplaceOptions] = useState<ReplaceOptionDraft[]>([]);
  const [replaceForm, setReplaceForm] = useState({
    title: "",
    description: "",
    category: null as number | null,
    categoryName: "",
  });

  const [input, setInput] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [shake, setShake] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);
  const base_url = process.env.NEXT_PUBLIC_BACKEND_URL

  // ── Fetch categories ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    fetch(`${base_url}products/categories/`)
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => {});
  }, [open]);

  // ── Init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (initialized.current) return;
    initialized.current = true;

    setMessages([]);
    setStep("title");
    setEditingStep(null);
    setForm({ title: "", description: "", category: null, categoryName: "", condition: "", purchase_year: "", images: [] });
    setReplaceOptions([]);
    setReplaceForm({ title: "", description: "", category: null, categoryName: "" });
    setInput("");
    setImagePreviews([]);
    setSubmitError("");

    sendBotMessage("title");
  }, [open]);

  useEffect(() => {
    if (!open) { initialized.current = false; }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping]);

  // ── Bot message ──────────────────────────────────────────────────────────────
  const sendBotMessage = useCallback(async (nextStep: Step, delay = 300) => {
    await sleep(delay);
    setBotTyping(true);
    await sleep(900);
    setBotTyping(false);
    setMessages((prev) => [...prev, { id: uid(), role: "bot", text: BOT_QUESTIONS[nextStep] }]);
    if (!["category", "condition", "images", "replace_options", "confirm", "done"].includes(nextStep)) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  const addUserMessage = (text: string) => {
    setMessages((prev) => [...prev, { id: uid(), role: "user", text }]);
  };

  // ── Edit handler ─────────────────────────────────────────────────────────────
  const handleEditReply = useCallback(
    async (targetStep: Step) => {
      if (botTyping || step === "done") return;
      const stepIdx = STEP_ORDER.indexOf(targetStep);
      if (stepIdx === -1) return;

      let userCount = 0;
      let sliceAt = messages.length;
      for (let i = 0; i < messages.length; i++) {
        if (messages[i].role === "user") {
          if (userCount === stepIdx) { sliceAt = i; break; }
          userCount++;
        }
      }
      setMessages((prev) => prev.slice(0, sliceAt));

      const clearAfter: Partial<ProductForm> = {};
      const stepsFromHere = STEP_ORDER.slice(stepIdx);
      if (stepsFromHere.includes("title")) clearAfter.title = "";
      if (stepsFromHere.includes("description")) clearAfter.description = "";
      if (stepsFromHere.includes("category")) { clearAfter.category = null; clearAfter.categoryName = ""; }
      if (stepsFromHere.includes("condition")) clearAfter.condition = "";
      if (stepsFromHere.includes("purchase_year")) clearAfter.purchase_year = "";
      if (stepsFromHere.includes("images")) { clearAfter.images = []; setImagePreviews([]); }
      setForm((f) => ({ ...f, ...clearAfter }));

      setStep(targetStep);
      setEditingStep(targetStep);
      setSubmitError("");

      const textPrefill: Partial<Record<Step, () => string>> = {
        title: () => form.title,
        description: () => form.description,
        purchase_year: () => form.purchase_year || "",
      };
      setInput(textPrefill[targetStep] ? textPrefill[targetStep]!() : "");

      const stepLabel: Partial<Record<Step, string>> = {
        title: "product name", description: "description", category: "category",
        condition: "condition", purchase_year: "purchase year", images: "photos",
      };
      await sleep(200);
      setBotTyping(true);
      await sleep(700);
      setBotTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "bot", text: `✏️ No problem! Let's update your **${stepLabel[targetStep] ?? targetStep}**.\n\n${BOT_QUESTIONS[targetStep]}` },
      ]);
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    [botTyping, step, messages, form]
  );

  // ── Advance step ─────────────────────────────────────────────────────────────
  const advanceStep = useCallback(
    async (currentStep: Step) => {
      const steps: Step[] = ["title", "description", "category", "condition", "purchase_year", "images", "replace_options", "confirm", "done"];

      if (editingStep) {
        const formFilled: Partial<Record<Step, boolean>> = {
          title: form.title.length > 0,
          description: form.description.length > 0,
          category: form.category !== null,
          condition: form.condition.length > 0,
          purchase_year: true,
          images: form.images.length > 0,
        };
        const idx = steps.indexOf(currentStep);
        const remainingSteps = steps.slice(idx + 1).filter(
          (s) => s !== "replace_options" && s !== "confirm" && s !== "done"
        ) as Step[];
        const allFilled = remainingSteps.every((s) => formFilled[s] !== false);
        if (allFilled) {
          setEditingStep(null);
          setStep("confirm");
          await sendBotMessage("confirm");
          return;
        }
        setEditingStep(null);
      }

      const idx = steps.indexOf(currentStep);
      const next = steps[idx + 1] as Step;
      setStep(next);
      await sendBotMessage(next);
    },
    [sendBotMessage, editingStep, form]
  );

  // ── Text send ─────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const val = input.trim();
    if (!val) { setShake(true); setTimeout(() => setShake(false), 400); return; }

    if (step === "title") {
      if (looksLikeChat(val)) return triggerError("Please type your product name, e.g. 'Sony WH-1000XM5'");
      if (val.length < 3) return triggerError("Product name is too short — be more specific.");
      if (val.length > 255) return triggerError("Name is too long (max 255 characters).");
      addUserMessage(val);
      setForm((f) => ({ ...f, title: val }));
      setInput("");
      await advanceStep("title");
    } else if (step === "description") {
      if (looksLikeChat(val)) return triggerError("Describe the item — e.g. 'Bought in 2022, minor scratches, works fine.'");
      if (val.length < 10) return triggerError("Too short — add a bit more detail about the item.");
      addUserMessage(val);
      setForm((f) => ({ ...f, description: val }));
      setInput("");
      await advanceStep("description");
    } else if (step === "purchase_year") {
      const isSkip = val.toLowerCase() === "skip";
      const year = parseInt(val);
      if (!isSkip && (isNaN(year) || year < 1990 || year > new Date().getFullYear()))
        return triggerError(`Enter a valid year between 1990–${new Date().getFullYear()}, or type 'skip'.`);
      addUserMessage(isSkip ? "Skipped ↩" : val);
      setForm((f) => ({ ...f, purchase_year: isSkip ? "" : val }));
      setInput("");
      await advanceStep("purchase_year");
    }
  }, [input, step, advanceStep]);

  const triggerError = (msg: string) => {
    setSubmitError(msg);
    setShake(true);
    setTimeout(() => { setShake(false); setSubmitError(""); }, 1800);
  };

  // ── Category / Condition ──────────────────────────────────────────────────────
  const handleCategory = useCallback(async (cat: Category) => {
    addUserMessage(cat.name);
    setForm((f) => ({ ...f, category: cat.id, categoryName: cat.name }));
    await advanceStep("category");
  }, [advanceStep]);

  const handleCondition = useCallback(async (cond: string) => {
    addUserMessage(cond);
    setForm((f) => ({ ...f, condition: cond }));
    await advanceStep("condition");
  }, [advanceStep]);

  // ── Images ────────────────────────────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setForm((f) => ({ ...f, images: files }));
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleImagesDone = useCallback(async () => {
    if (form.images.length === 0) return triggerError("Please add at least 1 image.");
    addUserMessage(`${form.images.length} photo${form.images.length > 1 ? "s" : ""} uploaded ✓`);
    await advanceStep("images");
  }, [form.images, advanceStep]);

  // ── Replace Options ───────────────────────────────────────────────────────────
  const handleAddReplaceOption = () => {
    if (!replaceForm.title.trim()) return triggerError("Enter a product name.");
    if (!replaceForm.category) return triggerError("Pick a category.");

    setReplaceOptions((prev) => [
      ...prev,
      {
        id: uid(),
        title: replaceForm.title.trim(),
        description: replaceForm.description.trim(),
        category: replaceForm.category,
        categoryName: replaceForm.categoryName,
      },
    ]);
    setReplaceForm({ title: "", description: "", category: null, categoryName: "" });
  };

  const handleRemoveReplaceOption = (id: string) => {
    setReplaceOptions((prev) => prev.filter((o) => o.id !== id));
  };

  const handleReplaceDone = useCallback(async () => {
    if (replaceOptions.length === 0) return triggerError("Add at least one option, or tap Skip.");
    const summary =
      replaceOptions.length === 1
        ? replaceOptions[0].title
        : `${replaceOptions.length} exchange options`;
    addUserMessage(`Exchange: ${summary} ✓`);
    await advanceStep("replace_options");
  }, [replaceOptions, advanceStep]);

  const handleReplaceSkip = useCallback(async () => {
    addUserMessage("Open to any exchange ↩");
    await advanceStep("replace_options");
  }, [advanceStep]);

  // ── Final submit ──────────────────────────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    setLoading(true);
    setSubmitError("");
    try {
      // 1. Create product
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("category_id", String(form.category));
      fd.append("condition", form.condition);
      if (form.purchase_year) fd.append("purchase_year", form.purchase_year);
      form.images.forEach((img) => fd.append("images", img));

      const productRes = await fetch(`${base_url}/products/create_product/`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const productData = await productRes.json();

      if (!productRes.ok) {
        const FIELD_LABELS: Record<string, string> = {
          title: "Product name", description: "Description", category_id: "Category",
          condition: "Condition", purchase_year: "Purchase year", images: "Images",
        };
        if (typeof productData === "object" && !productData.error) {
          const firstKey = Object.keys(productData)[0];
          const label = FIELD_LABELS[firstKey] ?? firstKey;
          const msg = Array.isArray(productData[firstKey]) ? productData[firstKey][0] : productData[firstKey];
          throw new Error(`${label}: ${msg}`);
        }
        throw new Error(productData.error || productData.detail || "Something went wrong.");
      }

      const productId: number = productData.product_id;

      // 2. Submit replace options (if any)
      if (replaceOptions.length > 0) {
        const replacePayload = replaceOptions.map((o) => ({
          title: o.title,
          description: o.description,
          category_id: o.category,
          replace_type:"product"
        }));

        const replaceRes = await fetch(
          `${base_url}/products/add_replace_options/${productId}/`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ replace_options: replacePayload }),
          }
        );
        const replaceData = await replaceRes.json();

        if (!replaceRes.ok) {
          throw new Error(replaceData.error || replaceData.detail || "Failed to save exchange options.");
        }
      }

      onProductCreated?.(productId);
      setStep("done");
      await sendBotMessage("done");
    } catch (err: any) {
      setSubmitError(err.message ?? "Failed to submit.");
    } finally {
      setLoading(false);
    }
  }, [form, replaceOptions, sendBotMessage, onProductCreated]);

  // ── Keyboard ──────────────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!open) return null;

  const showTextInput = ["title", "description", "purchase_year"].includes(step);
  const userMsgSteps = STEP_ORDER;
  const progressSteps: Step[] = ["title", "description", "category", "condition", "purchase_year", "images", "replace_options", "confirm", "done"];

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />

      {loading && (
        <div className={styles.loaderOverlay}>
          <div className={styles.loaderCard}>
            <div className={styles.loaderSpinner}>
              <div className={styles.spinRing} />
              <div className={styles.spinRingInner} />
            </div>
            <div className={styles.loaderTitle}>Posting your listing…</div>
            <div className={styles.loaderSub}>Uploading images & saving details</div>
            <div className={styles.loaderDots}>
              {["Validating", "Uploading", "Saving"].map((label, i) => (
                <div key={label} className={styles.loaderStep} style={{ animationDelay: `${i * 0.4}s` }}>
                  <div className={styles.loaderStepDot} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.botAvatar}>🤖</div>
            <div>
              <div className={styles.headerTitle}>BarterBot</div>
              <div className={styles.headerSub}>
                {step === "done" ? "All done!" : "Listing assistant · online"}
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress */}
        <div className={styles.progressTrack}>
          <div
            className={styles.progressBar}
            style={{ width: `${(progressSteps.indexOf(step) / (progressSteps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Chat body */}
        <div className={styles.chatBody}>
          {(() => {
            let userMsgIdx = -1;
            return messages.map((msg) => {
              if (msg.role === "user") userMsgIdx++;
              const targetStep = msg.role === "user" ? userMsgSteps[userMsgIdx] : null;
              const canEdit =
                msg.role === "user" &&
                targetStep &&
                editableSteps.includes(targetStep) &&
                step !== "done" &&
                !botTyping;

              return (
                <div
                  key={msg.id}
                  className={`${styles.msgRow} ${msg.role === "user" ? styles.msgRowUser : styles.msgRowBot}`}
                >
                  {msg.role === "bot" && <div className={styles.botDot}>🤖</div>}
                  <div className={`${styles.msgContent} ${msg.role === "user" ? styles.msgContentUser : styles.msgContentBot}`}>
                    <div
                      className={msg.role === "bot" ? styles.botBubble : styles.userBubble}
                      dangerouslySetInnerHTML={{
                        __html: msg.text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                      }}
                    />
                    {canEdit && (
                      <button className={styles.editBtn} onClick={() => handleEditReply(targetStep!)} title={`Edit your ${targetStep}`}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              );
            });
          })()}

          {/* Typing indicator */}
          {botTyping && (
            <div className={`${styles.msgRow} ${styles.msgRowBot}`}>
              <div className={styles.botDot}>🤖</div>
              <div className={styles.botBubble}>
                <span className={styles.typingDots}>
                  <span className={styles.dot} style={{ animationDelay: "0s" }} />
                  <span className={styles.dot} style={{ animationDelay: "0.2s" }} />
                  <span className={styles.dot} style={{ animationDelay: "0.4s" }} />
                </span>
              </div>
            </div>
          )}

          {/* Category chips */}
          {step === "category" && !botTyping && (
            <div className={styles.chipsWrap}>
              {categories.map((cat) => (
                <button key={cat.id} className={styles.chip} onClick={() => handleCategory(cat)}>
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Condition chips */}
          {step === "condition" && !botTyping && (
            <div className={styles.chipsWrap}>
              {CONDITIONS.map((c) => (
                <button key={c} className={styles.chip} onClick={() => handleCondition(c)}>
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Images */}
          {step === "images" && !botTyping && (
            <div className={styles.imgSection}>
              <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageChange} />
              <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                Choose Photos
              </button>
              {imagePreviews.length > 0 && (
                <div className={styles.previewRow}>
                  {imagePreviews.map((src, i) => (
                    <div key={i} className={styles.previewThumb}>
                      <img src={src} alt="" />
                    </div>
                  ))}
                </div>
              )}
              {imagePreviews.length > 0 && (
                <button className={styles.doneBtn} onClick={handleImagesDone}>
                  Done with photos ✓
                </button>
              )}
            </div>
          )}

          {/* ── Replace Options ── */}
          {step === "replace_options" && !botTyping && (
            <div className={styles.replaceChipsWrap}>

              {/* Added options list */}
              {replaceOptions.length > 0 && (
                <div className={styles.replaceOptionsList}>
                  {replaceOptions.map((opt) => (
                    <div key={opt.id} className={styles.replaceOptionCard}>
                      <div className={styles.replaceOptionInfo}>
                        <div className={styles.replaceOptionTitle}>{opt.title}</div>
                        <div className={styles.replaceOptionMeta}>
                          {opt.categoryName}{opt.description ? ` · ${opt.description.slice(0, 40)}` : ""}
                        </div>
                      </div>
                      <button className={styles.replaceOptionRemove} onClick={() => handleRemoveReplaceOption(opt.id)}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add option form */}
              <div className={styles.replaceForm}>
                <input
                  className={styles.replaceInput}
                  placeholder="Product name (e.g. iPhone 13 Pro)"
                  value={replaceForm.title}
                  onChange={(e) => setReplaceForm((f) => ({ ...f, title: e.target.value }))}
                />
                <input
                  className={styles.replaceInput}
                  placeholder="Description (optional)"
                  value={replaceForm.description}
                  onChange={(e) => setReplaceForm((f) => ({ ...f, description: e.target.value }))}
                />
                <select
                  className={styles.replaceSelect}
                  value={replaceForm.category ?? ""}
                  onChange={(e) => {
                    const cat = categories.find((c) => c.id === Number(e.target.value));
                    setReplaceForm((f) => ({
                      ...f,
                      category: cat ? cat.id : null,
                      categoryName: cat ? cat.name : "",
                    }));
                  }}
                >
                  <option value="">Select category…</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>

                <button className={styles.replaceAddBtn} onClick={handleAddReplaceOption}>
                  + Add Option
                </button>
              </div>

              {/* Done / Skip */}
              <div className={styles.replaceActions}>
                <button
                  className={styles.replaceDoneBtn}
                  onClick={handleReplaceDone}
                  disabled={replaceOptions.length === 0}
                >
                  Done ✓
                </button>
                <button className={styles.replaceSkipBtn} onClick={handleReplaceSkip}>
                  Skip — I'm flexible
                </button>
              </div>

              {submitError && <div className={styles.errorTip}>⚠️ {submitError}</div>}
            </div>
          )}

          {/* Confirm summary */}
          {step === "confirm" && !botTyping && (
            <div className={styles.summaryCard}>
              <SummaryRow label="Title" value={form.title} />
              <SummaryRow label="Description" value={form.description} />
              <SummaryRow label="Category" value={form.categoryName} />
              <SummaryRow label="Condition" value={form.condition} />
              {form.purchase_year && <SummaryRow label="Purchase Year" value={form.purchase_year} />}
              <SummaryRow label="Photos" value={`${form.images.length} uploaded`} />
              <SummaryRow
                label="Exchange"
                value={
                  replaceOptions.length === 0
                    ? "Open to any"
                    : replaceOptions.map((o) => o.title).join(", ")
                }
              />
              <button className={styles.confirmBtn} onClick={handleConfirm} disabled={loading}>
                {loading ? "Posting…" : "🚀 Confirm & Post"}
              </button>
            </div>
          )}

          {/* Done */}
          {step === "done" && !botTyping && (
            <button className={styles.closeFinalBtn} onClick={onClose}>
              Close ✓
            </button>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Text input bar */}
        {showTextInput && (
          <div className={`${styles.inputBar} ${shake ? styles.inputBarShake : ""}`}>
            <div className={styles.inputHint}>
              {step === "title" && (<><span className={styles.hintIcon}>✏️</span> Enter your <strong>product name</strong> — not a message</>)}
              {step === "description" && (<><span className={styles.hintIcon}>📝</span> Describe the item — condition, specs, reason for swap</>)}
              {step === "purchase_year" && (
                <><span className={styles.hintIcon}>📅</span> Type a <strong>year</strong> like <code className={styles.hintCode}>2022</code>, or <code className={styles.hintCode}>skip</code></>
              )}
            </div>
            {submitError && <div className={styles.errorTip}>⚠️ {submitError}</div>}
            <div className={styles.inputRow}>
              <input
                ref={inputRef}
                className={styles.textInput}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  step === "title" ? "e.g. Sony WH-1000XM5…"
                  : step === "description" ? "e.g. Used for 1 year, minor scratches…"
                  : "e.g. 2022 or skip"
                }
                disabled={botTyping}
              />
              <button className={styles.sendBtn} onClick={handleSend} disabled={botTyping || !input.trim()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {!showTextInput && submitError && step !== "replace_options" && (
          <div className={styles.bottomError}>{submitError}</div>
        )}
      </div>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.summaryRow}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryValue}>{value}</span>
    </div>
  );
}
