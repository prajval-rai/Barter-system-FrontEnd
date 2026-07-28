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

// ── iOS Safari (and iOS webviews) don't support navigator.permissions
// for geolocation, and never re-show the native prompt once denied.
// We detect iOS purely to change copy/behavior — never to gate the
// actual geolocation call, since the call itself works fine on iOS
// Safari as long as we're on HTTPS and the user hasn't already denied. ──
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as "Macintosh" but has touch support
  const iPadOS13Up = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS13Up;
}

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
  // Distinguishes *why* location failed so the UI can point the user to the
  // right fix: device GPS/Location Services off vs. site permission blocked
  // vs. a plain timeout. Kept separate from locError's text so we can also
  // adjust icon/CTA per case if needed later.
  const [locErrorType, setLocErrorType] = useState<"gps_off" | "permission" | "timeout" | "other" | null>(null);
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

      // Check current permission state up front (doesn't prompt the user).
      // NOTE: this is Android/desktop-only intel — iOS Safari has no
      // Permissions API for geolocation, so permState will stay
      // "unsupported" there and we must not rely on it for gating.
      if (navigator.permissions?.query) {
        navigator.permissions
          .query({ name: "geolocation" as PermissionName })
          .then((status) => {
            setPermState(status.state);
            status.onchange = () => setPermState(status.state);
          })
          .catch(() => setPermState("unsupported"));
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

    // Secure-context check: iOS Safari silently refuses geolocation on
    // plain HTTP (even on a local network address). Catch this early
    // with a clear message instead of a confusing generic error.
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setLocError("Location requires a secure (HTTPS) connection. Please load this site over HTTPS and try again.");
      return;
    }

    setLocLoading(true);
    setLocError(null);
    setLocErrorType(null);
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
        setLocLoading(false);

        if (err.code === err.PERMISSION_DENIED) {
          // Site-level permission was blocked. On Android/Chrome this is a
          // deliberate "no" for this origin. On iOS Safari, note that this
          // SAME code is also returned when Location Services is off
          // system-wide or for Safari specifically — Safari doesn't
          // distinguish the two, so the iOS message below covers both.
          setLocErrorType("permission");
          if (isIOS()) {
            setLocError(
              "Location access is blocked. Please check two things on your iPhone: 1) Settings → Privacy & Security → Location Services is turned ON, and Safari is set to \"While Using the App\". 2) Settings → Safari → Location is set to \"Ask\" or \"Allow\" (or on iOS 15+, tap the \"aA\" icon in the address bar → Website Settings → Location → Allow). Then reload this page and try again."
            );
          } else {
            setLocError(
              "Location permission for this site was denied. Tap the lock/info icon next to the address bar → Permissions → Location → Allow, then reload the page and try again."
            );
          }
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          // Browser could not get a position at all — almost always because
          // device-level GPS/Location Services is turned off, not a site
          // permission problem. This is the case that's easy to confuse
          // with "permission denied" but has a different fix.
          setLocErrorType("gps_off");
          if (isIOS()) {
            setLocError(
              "Your iPhone's Location Services appears to be turned off. Go to Settings → Privacy & Security → Location Services and turn it ON, then come back and try again."
            );
          } else {
            setLocError(
              "Your device's Location (GPS) appears to be turned off. Turn on Location from your phone's quick settings or Settings → Location, then try again."
            );
          }
        } else if (err.code === err.TIMEOUT) {
          setLocErrorType("timeout");
          setLocError("Location request timed out. Please check your signal/connection and try again.");
        } else {
          setLocErrorType("other");
          setLocError(
            "Could not fetch location. Please make sure Location Services (GPS) are turned on and permission is allowed for this site, then try again."
          );
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0,
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

  // Only show the extra "blocked in browser settings" hint when we actually
  // KNOW it's denied (Android/desktop via Permissions API). On iOS this
  // will be "unsupported", so we rely on the error message from the
  // getCurrentPosition callback instead, which already has iOS-specific copy.
  const showDeniedHint = permState === "denied" && !locError;

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

              {locError && (
                <p className={styles.locError}>
                  {locErrorType === "gps_off" ? "📍" : locErrorType === "permission" ? "🔒" : "⚠"} {locError}
                </p>
              )}

              {/* Fallback hint for the case where we know (via Permissions API,
                  Android/desktop only) that the site is denied but haven't yet
                  gotten an error back from a fetch attempt. iOS never hits this
                  since permState there stays "unsupported". */}
              {showDeniedHint && !locError && (
                <p className={styles.locError}>
                  🔒 Location is currently blocked for this site. Enable it from your
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
