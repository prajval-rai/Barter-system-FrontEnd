"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./ProfileCompleteModal.module.css";
import { useAuth } from "@/context/AuthContext"; // adjust to your actual path

interface ProfileCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  incompleteFields: string[];
  onSaved?: () => void;
}

const FIELD_META: Record<string, { label: string; type: string; placeholder: string }> = {
  description:    { label: "Description",     type: "textarea", placeholder: "Tell others what you offer..." },
  address:        { label: "Address",          type: "text",     placeholder: "Detected automatically from GPS" },
  city:           { label: "City",             type: "text",     placeholder: "Detected automatically from GPS" },
  pincode:        { label: "Pincode",          type: "text",     placeholder: "Detected automatically from GPS" },
  latitude:       { label: "Latitude",         type: "number",   placeholder: "Auto-filled from GPS" },
  longitude:      { label: "Longitude",        type: "number",   placeholder: "Auto-filled from GPS" },
  contact_number: { label: "Contact Number",   type: "tel",      placeholder: "10-digit mobile number" },
};

// These are captured silently via GPS — never rendered as visible inputs
const HIDDEN_FIELDS = ["latitude", "longitude"];
// Fields that come ONLY from GPS detection — never manually typed
const LOCATION_FIELDS = ["address", "city", "pincode", "latitude", "longitude"];

// Maps this form's field keys to the keys used on AuthUser / in context
const CONTEXT_KEY_MAP: Record<string, string> = {
  latitude: "lat",
  longitude: "long",
};

export default function ProfileCompleteModal({
  isOpen,
  onClose,
  incompleteFields,
  onSaved,
}: ProfileCompleteModalProps) {
  const { updateUser } = useAuth();
  const [form, setForm]             = useState<Record<string, string>>({});
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError]     = useState<string | null>(null);
  const [locSuccess, setLocSuccess] = useState(false);
  const [permState, setPermState]   = useState<PermissionState | "unsupported" | null>(null);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);
  const overlayRef                  = useRef<HTMLDivElement>(null);

  const needsLocation = incompleteFields.some((f) => LOCATION_FIELDS.includes(f));
  // Gate: while location is required but not yet detected, hide the rest of the form
  const showLocationGate = needsLocation && !locSuccess;

  useEffect(() => {
    if (isOpen) {
      setForm({});
      setSaveError(null);
      setLocError(null);
      setLocSuccess(false);
      setSaving(false);

      // Check current permission state up front (doesn't prompt the user)
      if (navigator.permissions?.query) {
        navigator.permissions
          .query({ name: "geolocation" as PermissionName })
          .then((status) => {
            setPermState(status.state);
            status.onchange = () => setPermState(status.state);
          })
          .catch(() => setPermState(null));
      } else {
        setPermState("unsupported");
      }
    }
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      return;
    }
    setLocLoading(true);
    setLocError(null);
    setLocSuccess(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        setForm((prev) => ({
          ...prev,
          latitude:  String(latitude),
          longitude: String(longitude),
        }));

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const geo  = await res.json();
          const addr = geo.address ?? {};

          setForm((prev) => ({
            ...prev,
            address: geo.display_name ?? prev.address ?? "",
            city:    addr.city ?? addr.town ?? addr.village ?? addr.county ?? prev.city ?? "",
            pincode: addr.postcode ?? prev.pincode ?? "",
          }));
        } catch {
          // Geocoding failed silently — lat/long still captured
        }

        setLocSuccess(true);
        setLocLoading(false);
      },
      (err) => {
        setLocSuccess(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocError(
            "Location access was denied. Please allow location permission for this site in your browser settings, then try again."
          );
        } else {
          setLocError("Could not fetch location. Please try again.");
        }
        setLocLoading(false);
      }
    );
  };

  const handleChange = (key: string, value: string) => {
    // Location fields are GPS-only — ignore any attempt to edit them manually
    if (LOCATION_FIELDS.includes(key)) return;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    // Hard block: can't save while location is still required but undetected
    if (showLocationGate) return;

    const payload: Record<string, string> = {};
    for (const key of incompleteFields) {
      if (form[key]?.trim()) payload[key] = form[key].trim();
    }
    if (Object.keys(payload).length === 0) return;

    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/profile`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update profile.");

      // Push the saved fields straight into AuthContext so hasLocation /
      // completion checks reflect reality immediately, without needing a
      // reload or re-login. Map form field names to AuthUser field names,
      // and coerce lat/long to numbers since AuthUser types them as number.
      const contextPatch: Record<string, string | number> = {};
      for (const [key, value] of Object.entries(payload)) {
        const mappedKey = CONTEXT_KEY_MAP[key] ?? key;
        contextPatch[mappedKey] =
          mappedKey === "lat" || mappedKey === "long" ? Number(value) : value;
      }
      updateUser(contextPatch);

      onSaved?.();
      onClose();
    } catch (err: any) {
      setSaveError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Only render fields that have UI — GPS coordinates are captured but stay invisible
  const visibleFields = incompleteFields.filter((f) => !HIDDEN_FIELDS.includes(f));

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIcon}>{showLocationGate ? "📍" : "👤"}</span>
            <div>
              <h2 className={styles.headerTitle}>
                {showLocationGate ? "Enable your location" : "Complete your profile"}
              </h2>
              <p className={styles.headerSub}>
                {showLocationGate
                  ? "We need your location before you can continue"
                  : "Fill in the missing fields below"}
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className={styles.body}>

          {showLocationGate ? (
            /* ── Gate screen: nothing else is shown until location is detected ── */
            <div className={styles.locationGate}>
              <p className={styles.locationGateText}>
                To complete your profile we need your address, city and pincode.
                These are filled in automatically from your device's location —
                click below and allow access when your browser asks.
              </p>

              <button
                className={styles.locationBtn}
                onClick={fetchLocation}
                disabled={locLoading}
              >
                {locLoading ? <span className={styles.locSpinner} /> : <span>📍</span>}
                {locLoading ? "Detecting location…" : "Allow & detect my location"}
              </button>

              {locError && <p className={styles.locError}>⚠ {locError}</p>}

              {permState === "denied" && !locError && (
                <p className={styles.locError}>
                  ⚠ Location is currently blocked for this site. Enable it from your
                  browser's site settings (the icon next to the address bar), then
                  try again.
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Location already detected — show a small confirmation instead of the gate */}
              {needsLocation && locSuccess && (
                <p className={styles.locSuccess}>✓ Location detected — shown below.</p>
              )}

              {/* Fields — GPS coordinates excluded, captured silently in the background */}
              <div className={styles.fields}>
                {visibleFields.map((key) => {
                  const meta = FIELD_META[key];
                  if (!meta) return null;

                  const isLocked = LOCATION_FIELDS.includes(key);
                  const isFilled = Boolean(form[key]);

                  return (
                    <div className={styles.fieldGroup} key={key}>
                      <label className={styles.label}>
                        {meta.label}
                        {isLocked && <span className={styles.gpsTag}>GPS</span>}
                      </label>

                      {meta.type === "textarea" ? (
                        <textarea
                          className={styles.textarea}
                          placeholder={meta.placeholder}
                          value={form[key] || ""}
                          onChange={(e) => handleChange(key, e.target.value)}
                          rows={3}
                        />
                      ) : (
                        <input
                          className={`${styles.input} ${isFilled ? styles.inputFilled : ""}`}
                          type={meta.type}
                          placeholder={meta.placeholder}
                          value={form[key] || ""}
                          readOnly={isLocked}
                          onChange={(e) => handleChange(key, e.target.value)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {saveError && <p className={styles.saveError}>⚠ {saveError}</p>}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          {!showLocationGate && (
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
