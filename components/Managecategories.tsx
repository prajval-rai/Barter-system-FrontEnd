"use client";

import { useState, useEffect, useRef } from "react";
import {
  Tag, Plus, Trash2, Pencil, Check, X, Search,
  Loader2, AlertTriangle, RefreshCw, Package,
  Laptop, Music, BookOpen, Home, Dumbbell, Palette,
  Shirt, Trophy, Box, Utensils, Car, Gamepad2,
  Gem, Camera, Headphones, Watch, Bike, Sofa,
  Tv, Smartphone, Baby, Flower2, Coffee, Plane,
  Hammer, Wrench, Zap, Heart, Star, Globe,
  ShoppingBag, Leaf, Sun, Moon, ChevronDown,
  LayoutGrid,
} from "lucide-react";
import styles from "../styles/Managecategories.module.css";

/* ─── Types ─────────────────────────────────────── */
interface Category {
  id: number;
  name: string;
  icon?: string;   // lucide icon name stored as string
}

/* ─── Available icons ───────────────────────────── */
const ICON_OPTIONS: { name: string; Icon: React.ElementType }[] = [
  { name: "Tag",          Icon: Tag },
  { name: "Package",      Icon: Package },
  { name: "Laptop",       Icon: Laptop },
  { name: "Music",        Icon: Music },
  { name: "BookOpen",     Icon: BookOpen },
  { name: "Home",         Icon: Home },
  { name: "Dumbbell",     Icon: Dumbbell },
  { name: "Palette",      Icon: Palette },
  { name: "Shirt",        Icon: Shirt },
  { name: "Trophy",       Icon: Trophy },
  { name: "Box",          Icon: Box },
  { name: "Utensils",     Icon: Utensils },
  { name: "Car",          Icon: Car },
  { name: "Gamepad2",     Icon: Gamepad2 },
  { name: "Gem",          Icon: Gem },
  { name: "Camera",       Icon: Camera },
  { name: "Headphones",   Icon: Headphones },
  { name: "Watch",        Icon: Watch },
  { name: "Bike",         Icon: Bike },
  { name: "Sofa",         Icon: Sofa },
  { name: "Tv",           Icon: Tv },
  { name: "Smartphone",   Icon: Smartphone },
  { name: "Baby",         Icon: Baby },
  { name: "Flower2",      Icon: Flower2 },
  { name: "Coffee",       Icon: Coffee },
  { name: "Plane",        Icon: Plane },
  { name: "Hammer",       Icon: Hammer },
  { name: "Wrench",       Icon: Wrench },
  { name: "Zap",          Icon: Zap },
  { name: "Heart",        Icon: Heart },
  { name: "Star",         Icon: Star },
  { name: "Globe",        Icon: Globe },
  { name: "ShoppingBag",  Icon: ShoppingBag },
  { name: "Leaf",         Icon: Leaf },
  { name: "Sun",          Icon: Sun },
  { name: "Moon",         Icon: Moon },
  { name: "LayoutGrid",   Icon: LayoutGrid },
];

const getIcon = (name?: string): React.ElementType => {
  if (!name) return Tag;
  return ICON_OPTIONS.find(o => o.name === name)?.Icon ?? Tag;
};

/* ─── Icon Picker ───────────────────────────────── */
function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = ICON_OPTIONS.filter(o =>
    !q || o.name.toLowerCase().includes(q.toLowerCase())
  );

  const ActiveIcon = getIcon(value);

  return (
    <div className={styles.iconSelect} ref={ref}>
      <button type="button" className={styles.iconSelectTrigger} onClick={() => setOpen(p => !p)}>
        <span className={styles.iconSelectPreview}>
          <ActiveIcon size={16} />
        </span>
        <span className={styles.iconSelectName}>{value || "Pick icon"}</span>
        <ChevronDown size={12} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>

      {open && (
        <div className={styles.iconSelectDropdown}>
          <div className={styles.iconSelectSearch}>
            <Search size={12} />
            <input placeholder="Search icon…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
          </div>
          <div className={styles.iconSelectGrid}>
            {filtered.map(({ name, Icon }) => (
              <button key={name} type="button" title={name}
                className={`${styles.iconSelectItem} ${value === name ? styles.iconSelectItemActive : ""}`}
                onClick={() => { onChange(name); setOpen(false); setQ(""); }}>
                <Icon size={18} />
              </button>
            ))}
            {filtered.length === 0 && (
              <div className={styles.iconSelectEmpty}>No icons found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── API ───────────────────────────────────────── */
const BASE = "http://localhost:8000";

const fetchCategories = async (): Promise<Category[]> => {
  const res = await fetch(`${BASE}/products/categories/`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
};

const createCategory = async (name: string, icon: string): Promise<Category> => {
  const res = await fetch(`${BASE}/products/categories/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, icon }),
  });
  if (!res.ok) throw new Error("Failed to create category");
  return res.json();
};

const deleteCategory = async (id: number): Promise<void> => {
  const res = await fetch(`${BASE}/products/categories/${id}/`, {
    method: "DELETE", credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete category");
};

const updateCategory = async (id: number, name: string, icon: string): Promise<Category> => {
  const res = await fetch(`${BASE}/products/categories/${id}/`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, icon }),
  });
  if (!res.ok) throw new Error("Failed to update category");
  return res.json();
};

/* ================================================================
   MANAGE CATEGORIES
================================================================ */
export default function ManageCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState("");

  // Add form
  const [addName, setAddName]   = useState("");
  const [addIcon, setAddIcon]   = useState("Tag");
  const [adding, setAdding]     = useState(false);
  const [addError, setAddError] = useState("");

  // Edit state
  const [editId, setEditId]     = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("Tag");
  const [saving, setSaving]     = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, ok });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const load = async (silent = false) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (e: any) {
      setError(e.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ── Add ── */
  const handleAdd = async () => {
    if (!addName.trim()) { setAddError("Name is required"); return; }
    setAdding(true); setAddError("");
    try {
      const cat = await createCategory(addName.trim(), addIcon);
      setCategories(p => [...p, cat]);
      setAddName(""); setAddIcon("Tag");
      showToast(`"${cat.name}" added!`, true);
    } catch (e: any) {
      showToast(e.message || "Failed to add", false);
    } finally {
      setAdding(false);
    }
  };

  /* ── Edit ── */
  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon || "Tag");
  };
  const cancelEdit = () => { setEditId(null); };
  const handleSave = async (id: number) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const updated = await updateCategory(id, editName.trim(), editIcon);
      setCategories(p => p.map(c => c.id === id ? { ...c, ...updated } : c));
      showToast(`Category updated!`, true);
      setEditId(null);
    } catch (e: any) {
      showToast(e.message || "Failed to update", false);
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteId);
      const name = categories.find(c => c.id === deleteId)?.name;
      setCategories(p => p.filter(c => c.id !== deleteId));
      setDeleteId(null);
      showToast(`"${name}" deleted`, true);
    } catch (e: any) {
      showToast(e.message || "Failed to delete", false);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = categories.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}>
          {toast.ok ? <Check size={14} /> : <X size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className={styles.overlay} onClick={() => setDeleteId(null)}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()}>
            <div className={styles.dialogIconWrap}>
              <AlertTriangle size={32} />
            </div>
            <h3 className={styles.dialogTitle}>Delete category?</h3>
            <p className={styles.dialogMsg}>
              "<strong>{categories.find(c => c.id === deleteId)?.name}</strong>" will be permanently removed.
              Products using this category may be affected.
            </p>
            <div className={styles.dialogActions}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 size={13} className={styles.spin} /> : <Trash2 size={13} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconWrap}><Tag size={20} /></div>
            <div>
              <h2 className={styles.title}>Product Categories</h2>
              <p className={styles.subtitle}>Define the categories traders can list items under</p>
            </div>
          </div>
          <button className={`${styles.btn} ${styles.btnRefresh}`} onClick={() => load()} disabled={loading}>
            <RefreshCw size={13} className={loading ? styles.spin : ""} />
            Refresh
          </button>
        </div>

        {/* ── Add new category form ── */}
        <div className={styles.addCard}>
          <div className={styles.addCardLabel}>
            <Plus size={13} /> New category
          </div>
          <div className={styles.addRow}>
            <IconSelect value={addIcon} onChange={setAddIcon} />
            <div className={styles.addInputWrap}>
              <input
                className={`${styles.addInput} ${addError ? styles.inputErr : ""}`}
                placeholder="Category name e.g. Electronics, Furniture…"
                value={addName}
                onChange={e => { setAddName(e.target.value); setAddError(""); }}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                maxLength={60}
              />
              {addError && <span className={styles.fieldErr}>{addError}</span>}
            </div>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleAdd}
              disabled={adding || !addName.trim()}
            >
              {adding
                ? <><Loader2 size={13} className={styles.spin} /> Adding…</>
                : <><Plus size={13} /> Add Category</>}
            </button>
          </div>
        </div>

        {/* Search + count */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={13} className={styles.searchIcon} />
            <input
              className={styles.search}
              placeholder="Search categories…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.clearSearch} onClick={() => setSearch("")}><X size={11} /></button>
            )}
          </div>
          <span className={styles.countLabel}>
            {loading ? "Loading…" : `${filtered.length} categor${filtered.length !== 1 ? "ies" : "y"}`}
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.skeletonGrid}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className={styles.skeletonCard} style={{ animationDelay: `${i*0.06}s` }} />
            ))}
          </div>
        ) : error ? (
          <div className={styles.stateBox}>
            <AlertTriangle size={40} />
            <p className={styles.stateTitle}>Failed to load</p>
            <p className={styles.stateSub}>{error}</p>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => load()}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.stateBox}>
            {search ? <Search size={40} /> : <Tag size={40} />}
            <p className={styles.stateTitle}>{search ? "No results" : "No categories yet"}</p>
            <p className={styles.stateSub}>
              {search ? `Nothing matched "${search}"` : "Add your first category above."}
            </p>
          </div>
        ) : (
          <div className={styles.catGrid}>
            {filtered.map((cat, idx) => {
              const CatIcon = getIcon(cat.icon);
              const isEditing = editId === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`${styles.catCard} ${isEditing ? styles.catCardEditing : ""}`}
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  {isEditing ? (
                    /* ── Edit mode ── */
                    <div className={styles.editMode}>
                      <div className={styles.editIconRow}>
                        <IconSelect value={editIcon} onChange={setEditIcon} />
                        <span className={styles.editIconHint}>Pick icon</span>
                      </div>
                      <input
                        className={styles.editInput}
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") handleSave(cat.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                        maxLength={60}
                      />
                      <div className={styles.editActions}>
                        <button className={`${styles.iconBtn} ${styles.iconBtnCancel}`} onClick={cancelEdit} title="Cancel">
                          <X size={14} />
                        </button>
                        <button
                          className={`${styles.iconBtn} ${styles.iconBtnSave}`}
                          onClick={() => handleSave(cat.id)}
                          disabled={saving || !editName.trim()}
                          title="Save"
                        >
                          {saving ? <Loader2 size={14} className={styles.spin} /> : <Check size={14} />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── View mode ── */
                    <>
                      <div className={styles.catIconWrap}>
                        <CatIcon size={22} />
                      </div>
                      <div className={styles.catInfo}>
                        <span className={styles.catName}>{cat.name}</span>
                        <span className={styles.catId}>ID #{cat.id}</span>
                      </div>
                      <div className={styles.catActions}>
                        <button
                          className={`${styles.iconBtn} ${styles.iconBtnEdit}`}
                          onClick={() => startEdit(cat)}
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className={`${styles.iconBtn} ${styles.iconBtnDelete}`}
                          onClick={() => setDeleteId(cat.id)}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}