"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./ProfileCompleteModal.module.css";

interface ProfileCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  incompleteFields: string[];
  onSaved?: () => void;
}

const FIELD_META: Record<string, { label: string; type: string; placeholder: string }> = {
  description:    { label: "Description",     type: "textarea", placeholder: "Tell others what you offer..." },
  address:        { label: "Address",          type: "text",     placeholder: "Your street address" },
  city:           { label: "City",             type: "text",     placeholder: "City name" },
  pincode:        { label: "Pincode",          type: "text",     placeholder: "6-digit pincode" },
  latitude:       { label: "Latitude",         type: "number",   placeholder: "Auto-filled from GPS" },
  longitude:      { label: "Longitude",        type: "number",   placeholder: "Auto-filled from GPS" },
  contact_number: { label: "Contact Number",   type: "tel",      placeholder: "10-digit mobile number" },
};

const LOCATION_FIELDS = ["address", "city", "pincode", "latitude", "longitude"];

export default function ProfileCompleteModal({
  isOpen,
  onClose,
  incompleteFields,
  onSaved,
}: ProfileCompleteModalProps) {
  const [form, setForm]             = useState<Record<string, string>>({});
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError]     = useState<string | null>(null);
  const [locSuccess, setLocSuccess] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);
  const overlayRef                  = useRef<HTMLDivElement>(null);
  const base_url    = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    if (isOpen) {
      setForm({});
      setSaveError(null);
      setLocError(null);
      setLocSuccess(false);
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

        // Reverse geocode via Nominatim (free, no key)
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
      () => {
        setLocError("Could not fetch location. Please allow location access.");
        setLocLoading(false);
      }
    );
  };

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const payload: Record<string, string> = {};
    for (const key of incompleteFields) {
      if (form[key]?.trim()) payload[key] = form[key].trim();
    }
    if (Object.keys(payload).length === 0) return;

    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${base_url}accounts/update_profile/`, {
        method:      "PUT",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update profile.");
      onSaved?.();
      onClose();
    } catch (err: any) {
      setSaveError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Show GPS button if any location-related field is incomplete
  const needsLocation = incompleteFields.some((f) => LOCATION_FIELDS.includes(f));

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIcon}>⚡</span>
            <div>
              <h2 className={styles.headerTitle}>Complete your profile</h2>
              <p className={styles.headerSub}>Fill in the missing fields below</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className={styles.body}>

          {/* GPS auto-detect — shown when any location field is pending */}
          {needsLocation && (
            <div className={styles.locationRow}>
              <button
                className={styles.locationBtn}
                onClick={fetchLocation}
                disabled={locLoading}
              >
                {locLoading
                  ? <span className={styles.locSpinner} />
                  : <span>📍</span>
                }
                {locLoading ? "Detecting location…" : "Auto-detect my location"}
              </button>

              {locError && (
                <p className={styles.locError}>⚠ {locError}</p>
              )}

              {locSuccess && !locError && (
                <p className={styles.locSuccess}>
                  ✓ Location detected — fields filled below. Edit if needed.
                </p>
              )}
            </div>
          )}

          {/* Fields */}
          <div className={styles.fields}>
            {incompleteFields.map((key) => {
              const meta = FIELD_META[key];
              if (!meta) return null;

              const isGpsField = key === "latitude" || key === "longitude";
              const isFilled   = Boolean(form[key]);

              return (
                <div className={styles.fieldGroup} key={key}>
                  <label className={styles.label}>
                    {meta.label}
                    {isGpsField && (
                      <span className={styles.gpsTag}>GPS</span>
                    )}
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
                      onChange={(e) => handleChange(key, e.target.value)}
                      readOnly={isGpsField}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {saveError && <p className={styles.saveError}>⚠ {saveError}</p>}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>

      </div>
    </div>
  );
}