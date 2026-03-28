"use client";

import { useState, useRef } from "react";
import {
  MapPin, Phone, Locate, X, ArrowRight,
  Loader2, CheckCircle2, AlertCircle, Navigation,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "@/styles/Completeprofilemodal.module.css";

interface CompleteProfileModalProps {
  onComplete: (updatedUser: { address: string; lat: number; long: number }) => void;
  onCancel: () => void;
}

export default function CompleteProfileModal({ onComplete, onCancel }: CompleteProfileModalProps) {
  const { user, setUser } = useAuth();

  const [address, setAddress] = useState(user?.address ?? "");
  const [contact, setContact] = useState("");
  const [lat, setLat]         = useState<number | "">(user?.lat || "");
  const [lng, setLng]         = useState<number | "">(user?.long || "");

  const [locating, setLocating] = useState(false);
  const [locErr, setLocErr]     = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  const overlayRef = useRef<HTMLDivElement>(null);

  /* ── Auto-locate ── */
  const autoLocate = () => {
    if (!navigator.geolocation) {
      setLocErr("Geolocation not supported by your browser.");
      return;
    }
    setLocating(true);
    setLocErr(null);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          if (data.display_name) setAddress(data.display_name.split(",").slice(0, 3).join(", "));
        } catch {/* ignore */}
        setLocating(false);
      },
      err => {
        setLocErr(err.code === 1 ? "Location permission denied." : "Couldn't get your location.");
        setLocating(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  /* ── Validate ── */
  const validate = () => {
    const e: Record<string, string> = {};
    if (!address.trim())          e.address  = "Address is required";
    if (lat === "" || lng === "")  e.location = "Please set your location";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ── */
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch("http://localhost:8000/accounts/update_profile/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          address: address.trim(),
          latitude: Number(lat),
          longitude: Number(lng),
          ...(contact.trim() ? { contact_number: contact.trim() } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save profile");
      }

      /* ── Update auth context so user object reflects new values ── */
      if (user) {
        const updated = {
          ...user,
          address: address.trim(),
          lat: Number(lat),
          long: Number(lng),
        };
        setUser(updated);
        sessionStorage.setItem("ExchangeIt_user", JSON.stringify(updated));
      }

      setSaved(true);
      setTimeout(() => {
        onComplete({ address: address.trim(), lat: Number(lat), long: Number(lng) });
      }, 800);
    } catch (err: any) {
      setErrors({ submit: err.message || "Something went wrong. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  /* ── Backdrop click does nothing (no skip allowed) ── */
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      /* intentionally blocked — user must complete profile */
    }
  };

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleBackdrop}>
      <div className={styles.modal}>

        <div className={styles.pill} />

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.iconRing}>
            <MapPin size={22} />
          </div>
          <div>
            <h2 className={styles.title}>One last thing</h2>
            <p className={styles.subtitle}>
              We need your location to show your listing to nearby traders.
            </p>
          </div>
        </div>

        {/* ── Fields ── */}
        <div className={styles.body}>

          {/* Address */}
          <div className={styles.field}>
            <label className={styles.label}>
              <MapPin size={12} /> Your address <span className={styles.req}>*</span>
            </label>
            <textarea
              className={`${styles.textarea} ${errors.address ? styles.fieldErr : ""}`}
              placeholder="e.g. 12 MG Road, Bengaluru, Karnataka"
              rows={2}
              value={address}
              onChange={e => {
                setAddress(e.target.value);
                setErrors(p => { const n = { ...p }; delete n.address; return n; });
              }}
            />
            {errors.address && (
              <span className={styles.errMsg}><AlertCircle size={11} /> {errors.address}</span>
            )}
          </div>

          {/* Contact */}
          <div className={styles.field}>
            <label className={styles.label}>
              <Phone size={12} /> Contact number <span className={styles.optional}>optional</span>
            </label>
            <input
              className={styles.input}
              type="tel"
              placeholder="+91 98765 43210"
              value={contact}
              onChange={e => setContact(e.target.value)}
            />
          </div>

          {/* Location */}
          <div className={styles.field}>
            <label className={styles.label}>
              <Navigation size={12} /> Location <span className={styles.req}>*</span>
            </label>

            {lat !== "" && lng !== "" ? (
              <div className={styles.coordsSet}>
                <CheckCircle2 size={15} className={styles.coordsOk} />
                <span>{Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}</span>
                <button
                  type="button"
                  className={styles.resetCoords}
                  onClick={() => { setLat(""); setLng(""); }}
                >
                  <X size={11} /> Reset
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={`${styles.locateBtn} ${locating ? styles.locateBtnBusy : ""} ${errors.location ? styles.fieldErr : ""}`}
                onClick={autoLocate}
                disabled={locating}
              >
                {locating
                  ? <><Loader2 size={15} className={styles.spin} /> Locating…</>
                  : <><Locate size={15} /> Use my current location</>
                }
              </button>
            )}

            {locErr && (
              <span className={styles.errMsg}><AlertCircle size={11} /> {locErr}</span>
            )}
            {errors.location && !locErr && (
              <span className={styles.errMsg}><AlertCircle size={11} /> {errors.location}</span>
            )}

            {lat === "" && lng === "" && !locating && (
              <div className={styles.manualCoords}>
                <span className={styles.manualLabel}>Or enter manually:</span>
                <div className={styles.coordRow}>
                  <input
                    className={styles.coordInput}
                    type="number"
                    placeholder="Latitude"
                    step="0.00001"
                    onChange={e => setLat(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                  <input
                    className={styles.coordInput}
                    type="number"
                    placeholder="Longitude"
                    step="0.00001"
                    onChange={e => setLng(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>

          {errors.submit && (
            <div className={styles.submitErr}>
              <AlertCircle size={14} /> {errors.submit}
            </div>
          )}
        </div>

        {/* ── Footer — save only, no skip ── */}
        <div className={styles.footer}>
          <button
            className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ""}`}
            onClick={handleSave}
            disabled={saving || saved}
          >
            {saved ? (
              <><CheckCircle2 size={15} /> Saved!</>
            ) : saving ? (
              <><Loader2 size={15} className={styles.spin} /> Saving…</>
            ) : (
              <>Save & Continue <ArrowRight size={15} /></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}