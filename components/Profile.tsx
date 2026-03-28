"use client";

import { useState, useEffect } from "react";
import {
  Mail, MapPin, Star, Package, Shield, MessageCircle,
  Edit3, Save, X, AlertTriangle, RefreshCw, User, Trash2,
  ChevronRight, Check, Scan, Navigation, LocateFixed, CheckCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ProductPreviewCard from "@/components/Productpreviewcard";
import ProductDetailPage from "@/components/ProductDetail";
import ProductScanner from "@/components/Productscanner";
import type { PreviewReplaceOption } from "@/components/Productpreviewcard";
import styles from "@/styles/Pages.module.css";
import profileStyles from "@/styles/Profile.module.css";

/* ── Types ── */
interface ProfileData {
  id: number;
  latitude: number | null;
  longitude: number | null;
  address: string;
  description: string;
  rating: number;
  role: string;
  user: number;
}

interface ApiProduct {
  id: number;
  title: string;
  description: string;
  category: { id: number; name: string } | string;
  images: { id: number; image: string; created_at: string; product: number }[];
  image_urls?: string[];
  thumbnail?: string;
  status: string;
  created_at: string;
  product_replace_options: { id: number; title: string; description: string; category: string; icon?: string }[];
  purchase_year: number;
  purchase_price?: number;
  market_price?: number;
  purchase_bill: string | null;
  icon: string;
  condition?: string;
  tags?: string;
}

const BASE = "http://localhost:8000";

function getImageUrls(p: ApiProduct): string[] {
  if (p.images && p.images.length > 0) return p.images.map(i => i.image);
  if (p.image_urls && p.image_urls.length > 0) return p.image_urls;
  if (p.thumbnail) return [p.thumbnail];
  return [];
}

/* ── Profile Detail Card ── */
interface ProfileCardProps {
  user: ReturnType<typeof useAuth>["user"];
  profile: ProfileData;
  editing: boolean;
  draftDesc: string;
  draftAddress: string;
  draftLat: number | null;
  draftLng: number | null;
  locating: boolean;
  saving: boolean;
  saveError: string | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDescChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  onUseLocation: () => void;
}

function ProfileDetailCard({
  user, profile, editing, draftDesc, draftAddress, draftLat, draftLng,
  locating, saving, saveError,
  onEdit, onSave, onCancel, onDescChange, onAddressChange, onUseLocation,
}: ProfileCardProps) {
  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : "—";
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?"
    : "?";
  const hasCoords = draftLat !== null && draftLng !== null;

  return (
    <div className={styles.card}>
      <div className={profileStyles.profileTop}>
        <div className={profileStyles.avatarWrap}>
          {user?.image ? (
            <img src={user.image} alt={displayName} className={profileStyles.avatarImg} />
          ) : (
            <div className={profileStyles.avatarInitials}>{initials}</div>
          )}
          <div className={profileStyles.roleBadge}>{profile.role}</div>
        </div>

        <div className={profileStyles.profileInfo}>
          <h2 className={profileStyles.profileName}>{displayName}</h2>
          <div className={profileStyles.contactList}>
            <span className={profileStyles.contactItem}>
              <Mail size={13} /> {user?.email}
            </span>
            {!editing && profile.address && (
              <span className={profileStyles.contactItem}>
                <MapPin size={13} /> {profile.address}
              </span>
            )}
            {!editing && profile.latitude != null && profile.longitude != null && (
              <span className={`${profileStyles.contactItem} ${profileStyles.coordsBadge}`}>
                <Navigation size={11} />
                {Number(profile.latitude).toFixed(4)}, {Number(profile.longitude).toFixed(4)}
              </span>
            )}
          </div>
        </div>

        <div className={profileStyles.editControls}>
          {editing ? (
            <div className={profileStyles.editBtns}>
              <button
                className={`${styles.btn} ${styles.btnGold} ${styles.btnSm}`}
                onClick={onSave} disabled={saving}
              >
                <Save size={13} /> {saving ? "Saving…" : "Save"}
              </button>
              <button
                className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                onClick={onCancel} disabled={saving}
              >
                <X size={13} /> Cancel
              </button>
            </div>
          ) : (
            <button
              className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
              onClick={onEdit}
            >
              <Edit3 size={13} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className={profileStyles.divider} />

      {!editing && (
        <div>
          <div className={profileStyles.sectionLabel}><User size={11} /> About</div>
          <p className={profileStyles.descText}>
            {profile.description || (
              <span className={profileStyles.descEmpty}>
                No description yet — click Edit Profile to add one.
              </span>
            )}
          </p>
        </div>
      )}

      {editing && (
        <div className={profileStyles.editForm}>
          <div className={profileStyles.editField}>
            <label className={profileStyles.editLabel}><User size={10} /> About you</label>
            <textarea
              className={styles.formTextarea}
              value={draftDesc}
              onChange={e => onDescChange(e.target.value)}
              placeholder="Tell others about yourself…"
              style={{ minHeight: 72 }}
            />
          </div>

          <div className={profileStyles.editField}>
            <label className={profileStyles.editLabel}><MapPin size={10} /> Address</label>
            <input
              className={styles.formInput}
              value={draftAddress}
              onChange={e => onAddressChange(e.target.value)}
              placeholder="e.g. Mumbai, Maharashtra"
            />
          </div>

          <div className={profileStyles.editField}>
            <div className={profileStyles.locationRow}>
              <label className={profileStyles.editLabel} style={{ margin: 0 }}>
                <Navigation size={10} /> GPS Coordinates
              </label>
              <button
                className={profileStyles.gpsBtn}
                onClick={onUseLocation}
                disabled={locating || saving}
                type="button"
              >
                {locating
                  ? <><div className={profileStyles.gpsSpin} /> Locating…</>
                  : <><LocateFixed size={12} /> Use my location</>}
              </button>
            </div>

            {hasCoords ? (
              <div className={profileStyles.coordsDisplay}>
                <div className={profileStyles.coordsItem}>
                  <span className={profileStyles.coordsLabel}>Lat</span>
                  <span className={profileStyles.coordsVal}>{draftLat?.toFixed(6)}</span>
                </div>
                <div className={profileStyles.coordsSep} />
                <div className={profileStyles.coordsItem}>
                  <span className={profileStyles.coordsLabel}>Lng</span>
                  <span className={profileStyles.coordsVal}>{draftLng?.toFixed(6)}</span>
                </div>
                <button
                  className={profileStyles.coordsClear}
                  onClick={() => { onAddressChange(draftAddress); }}
                  title="Coordinates set — click location button to update"
                >
                  <CheckCircle size={13} color="var(--success)" />
                </button>
              </div>
            ) : (
              <div className={profileStyles.coordsEmpty}>
                <Navigation size={13} />
                No coordinates set — hit "Use my location" to auto-fill
              </div>
            )}
          </div>

          {saveError && (
            <div className={profileStyles.saveError}>
              <AlertTriangle size={12} /> {saveError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Stats Card ── */
function StatsCard({ rating, itemsListed, role, reviews }: {
  rating: number; itemsListed: number | "—"; role: string; reviews: number;
}) {
  const stats = [
    { icon: <Star size={18} />,          label: "Rating",       value: rating != null ? `${Number(rating).toFixed(1)} / 5` : "No ratings yet", accent: true  },
    { icon: <Package size={18} />,       label: "Items Listed", value: itemsListed,  accent: false },
    { icon: <Shield size={18} />,        label: "Role",         value: role,         accent: false },
    { icon: <MessageCircle size={18} />, label: "Reviews",      value: reviews,      accent: false },
  ];
  return (
    <div className={styles.card}>
      <div className={profileStyles.sectionLabel} style={{ marginBottom: 16 }}>Overview</div>
      <div className={profileStyles.statsGrid}>
        {stats.map((s, i) => (
          <div key={i} className={profileStyles.statItem}>
            <div className={`${profileStyles.statIcon} ${s.accent ? profileStyles.statIconAccent : ""}`}>
              {s.icon}
            </div>
            <div>
              <div className={`${profileStyles.statValue} ${s.accent ? profileStyles.statValueAccent : ""}`}>
                {s.value}
              </div>
              <div className={profileStyles.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Skeletons ── */
function ProfileSkeleton() {
  return (
    <div className={profileStyles.topGrid}>
      <div className={styles.card} style={{ opacity: 0.5 }}>
        <div className={profileStyles.profileTop}>
          <div className={profileStyles.skelCircle} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className={profileStyles.skelLine} style={{ width: "60%" }} />
            <div className={profileStyles.skelLine} style={{ width: "80%", height: 13 }} />
            <div className={profileStyles.skelLine} style={{ width: "50%", height: 13 }} />
          </div>
        </div>
        <div className={profileStyles.divider} />
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <div className={profileStyles.skelLine} style={{ width: "20%", height: 10 }} />
          <div className={profileStyles.skelLine} />
          <div className={profileStyles.skelLine} style={{ width: "75%" }} />
        </div>
      </div>
      <div className={styles.card} style={{ opacity: 0.5 }}>
        <div className={profileStyles.skelLine} style={{ width: "25%", height: 10, marginBottom: 16 }} />
        <div className={profileStyles.statsGrid}>
          {[1,2,3,4].map(i => <div key={i} className={profileStyles.skelStatCard} />)}
        </div>
      </div>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className={profileStyles.productGrid}>
      {[1,2,3,4].map(i => (
        <div key={i} className={profileStyles.skelProductCard}>
          <div className={profileStyles.skelProductImg} />
          <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
            <div className={profileStyles.skelLine} style={{ width: "40%", height: 9 }} />
            <div className={profileStyles.skelLine} style={{ width: "85%", height: 14 }} />
            <div className={profileStyles.skelLine} style={{ width: "55%", height: 11 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════
   PROFILE PAGE
════════════════════════════ */
export function Profile() {
  const { user } = useAuth();

  const [profile, setProfile]               = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError]     = useState<string | null>(null);

  const [editing, setEditing]         = useState(false);
  const [draftDesc, setDraftDesc]     = useState("");
  const [draftAddress, setDraftAddr]  = useState("");
  const [draftLat, setDraftLat]       = useState<number | null>(null);
  const [draftLng, setDraftLng]       = useState<number | null>(null);
  const [locating, setLocating]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState<string | null>(null);

  const [listings, setListings]       = useState<ApiProduct[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError]     = useState<string | null>(null);

  const [selectedId, setSelectedId]   = useState<number | null>(null);
  const [deletingId, setDeletingId]   = useState<number | null>(null);
  const [scanProduct, setScanProduct] = useState<ApiProduct | null>(null);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  /* Lock scroll when any modal open */
  useEffect(() => {
    if (selectedId !== null || scanProduct !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedId, scanProduct]);

  /* ── Loaders ── */
  const loadProfile = async () => {
    setProfileLoading(true); setProfileError(null);
    try {
      const res = await fetch(`${BASE}/accounts/upsertProfile/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load profile");
      const json = await res.json();
      const data: ProfileData = json.data;
      setProfile(data);
      setDraftDesc(data.description ?? "");
      setDraftAddr(data.address ?? "");
      setDraftLat(data.latitude != null ? Number(data.latitude) : null);
      setDraftLng(data.longitude != null ? Number(data.longitude) : null);
    } catch (e: any) {
      setProfileError(e.message || "Something went wrong");
    } finally { setProfileLoading(false); }
  };

  const loadListings = async () => {
    setListLoading(true); setListError(null);
    try {
      const res = await fetch(`${BASE}/products/products_by_status?status=approved`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load listings");
      setListings(await res.json());
    } catch (e: any) {
      setListError(e.message || "Something went wrong");
    } finally { setListLoading(false); }
  };

  useEffect(() => { loadProfile(); loadListings(); }, []);

  /* ── GPS ── */
  const handleUseLocation = () => {
    if (!navigator.geolocation) { showToast("Geolocation not supported", false); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setDraftLat(lat); setDraftLng(lng);
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          if (r.ok) { const geo = await r.json(); setDraftAddr(geo.display_name ?? ""); }
        } catch { /* lat/lng captured anyway */ }
        setLocating(false);
        showToast("Location captured! ✓", true);
      },
      (err) => { setLocating(false); showToast(err.message || "Could not get location", false); },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  /* ── Save ── */
  const handleSave = async () => {
    setSaving(true); setSaveError(null);
    try {
      const body: Record<string, unknown> = { description: draftDesc, address: draftAddress };
      if (draftLat !== null) body.latitude  = draftLat;
      if (draftLng !== null) body.longitude = draftLng;
      const res = await fetch(`${BASE}/accounts/update_profile/`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Update failed");
      setProfile(prev => prev
        ? { ...prev, description: draftDesc, address: draftAddress, latitude: draftLat, longitude: draftLng }
        : prev);
      setEditing(false);
      showToast("Profile updated! ✓", true);
    } catch (e: any) {
      setSaveError(e.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const handleCancelEdit = () => {
    setDraftDesc(profile?.description ?? "");
    setDraftAddr(profile?.address ?? "");
    setDraftLat(profile?.latitude ?? null);
    setDraftLng(profile?.longitude ?? null);
    setSaveError(null);
    setEditing(false);
  };

  /* ── Delete ── */
  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${BASE}/products/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Delete failed");
      setListings(prev => prev.filter(p => p.id !== id));
      showToast("Listing deleted.", true);
    } catch (e: any) {
      showToast(e.message || "Delete failed.", false);
    } finally { setDeletingId(null); }
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`${profileStyles.toast} ${toast.ok ? profileStyles.toastOk : profileStyles.toastErr}`}>
          {toast.ok ? <Check size={13} /> : <X size={13} />}
          {toast.msg}
        </div>
      )}

      {/* Scanner modal */}
      {scanProduct !== null && (
        <ProductScanner
          productId={scanProduct.id}
          productTitle={scanProduct.title}
          productThumbnail={getImageUrls(scanProduct)[0]}
          onClose={() => setScanProduct(null)}
          onViewMatch={(match) => {
            setScanProduct(null);
            setSelectedId(match.id);
          }}
        />
      )}

      {/* Product detail modal */}
      {selectedId !== null && (
        <div className={profileStyles.detailModalBackdrop} onClick={() => setSelectedId(null)}>
          <div className={profileStyles.detailModalSheet} onClick={e => e.stopPropagation()}>
            <ProductDetailPage
              productId={selectedId}
              onBack={() => setSelectedId(null)}
            />
          </div>
        </div>
      )}

      <div className={styles.pageWrap}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>👤 My Profile</h1>
          <div className={styles.goldLine} />
        </div>

        {/* ── Profile + Stats ── */}
        {profileLoading ? <ProfileSkeleton /> : profileError ? (
          <div className={`${styles.card} ${profileStyles.errorCard}`}>
            <AlertTriangle size={28} color="var(--danger)" />
            <div className={profileStyles.errorText}>{profileError}</div>
            <button className={`${styles.btn} ${styles.btnGold} ${styles.btnSm}`} onClick={loadProfile}>
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        ) : profile && (
          <div className={profileStyles.topGrid}>
            <ProfileDetailCard
              user={user}
              profile={profile}
              editing={editing}
              draftDesc={draftDesc}
              draftAddress={draftAddress}
              draftLat={draftLat}
              draftLng={draftLng}
              locating={locating}
              saving={saving}
              saveError={saveError}
              onEdit={() => setEditing(true)}
              onSave={handleSave}
              onCancel={handleCancelEdit}
              onDescChange={setDraftDesc}
              onAddressChange={setDraftAddr}
              onUseLocation={handleUseLocation}
            />
            <StatsCard
              rating={profile.rating}
              itemsListed={listLoading ? "—" : listings.length}
              role={profile.role}
              reviews={18}
            />
          </div>
        )}

        {/* ── Active Listings ── */}
        <div className={profileStyles.listingsHeader}>
          <h3 className={profileStyles.listingsTitle}>My Active Listings</h3>
          {!listLoading && listings.length > 0 && (
            <span className={profileStyles.listingsCount}>
              {listings.length} product{listings.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {listLoading ? <ProductGridSkeleton /> : listError ? (
          <div className={profileStyles.stateBox}>
            <AlertTriangle size={36} color="var(--danger)" />
            <p className={profileStyles.stateTitle}>{listError}</p>
            <button className={`${styles.btn} ${styles.btnGold}`} onClick={loadListings}>
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className={profileStyles.stateBox}>
            <Package size={40} color="var(--text-muted)" />
            <p className={profileStyles.stateTitle}>No active listings yet</p>
            <p className={profileStyles.stateSub}>Your approved products will appear here.</p>
          </div>
        ) : (
          <div className={profileStyles.productGrid}>
            {listings.map((p, i) => {
              const imgs = getImageUrls(p);
              const busy = deletingId === p.id;
              const opts: PreviewReplaceOption[] = p.product_replace_options.map(o => ({
                title: o.title, icon: o.icon,
              }));

              return (
                /* ─── No more hardcoded cardWrap + cardActions overlay.
                       Everything is handled inside ProductPreviewCard via props. ─── */
                <div
                  key={p.id}
                  className={`${profileStyles.productCardWrap} ${busy ? profileStyles.cardBusy : ""}`}
                  style={{ animationDelay: `${i * 0.055}s` }}
                >
                  <ProductPreviewCard
                    title={p.title}
                    categoryName={typeof p.category === "object" ? p.category?.name : String(p.category ?? "")}
                    condition={p.condition}
                    purchasePrice={p.purchase_price}
                    marketPrice={p.market_price}
                    purchaseYear={p.purchase_year}
                    imageUrls={imgs}
                    replaceOptions={opts}
                    tags={p.tags}
                    /* ── Action bar props ──────────────────────────────
                       onView   → everyone always gets this
                       onScan   → owner: finds barter matches
                       onDelete → owner: removes listing
                    ─────────────────────────────────────────────────── */
                    onView={() => setSelectedId(p.id)}
                    onScan={() => setScanProduct(p)}
                    onDelete={busy ? undefined : () => handleDelete(p.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}