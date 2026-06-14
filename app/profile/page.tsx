"use client";

import React, { useEffect, useState } from "react";
import styles from "./Profilecard.module.css";
import ProfileCompletionBanner from "../swap/Profilecompletionbanner";
import AppShell from "@/components/AppShell/Appshell ";

interface UserProfile {
  id: number;
  latitude: number;
  longitude: number;
  address: string;
  description: string | null;
  rating: number | null;
  role: string;
  contact_number: string;
  city: string;
  pincode: string;
  user: number;
}

function getCompletionData(profile: UserProfile) {
  const fields: { key: keyof UserProfile; label: string }[] = [
    { key: "address", label: "Address" },
    { key: "description", label: "Description" },
    { key: "contact_number", label: "Contact number" },
    { key: "city", label: "City" },
    { key: "pincode", label: "Pincode" },
    { key: "latitude", label: "Location" },
  ];

  const incompleteFields = fields
    .filter(({ key }) => !profile[key])
    .map(({ label }) => label);

  const progress = ((fields.length - incompleteFields.length) / fields.length) * 100;
  return { progress, incompleteFields };
}

export default function ProfileCard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/accounts/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      const json = await res.json();
      setProfile(json.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  if (loading) return <p>Loading profile...</p>;
  if (error)   return <p>Error: {error}</p>;
  if (!profile) return null;

  const { progress, incompleteFields } = getCompletionData(profile);

  return (
    <AppShell>
        <div className={styles.wrapper}>
      <ProfileCompletionBanner
        progress={progress}
        incompleteFields={incompleteFields}
        onProfileSaved={fetchProfile}  
      />

      <div className={styles.card}>
        <div className={styles.avatar}>
          {profile.city?.[0]?.toUpperCase() ?? "U"}
        </div>

        <div className={styles.info}>
          <div className={styles.row}>
            <span className={styles.label}>Role</span>
            <span className={styles.badge}>{profile.role}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>City</span>
            <span className={styles.value}>{profile.city || "—"}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Pincode</span>
            <span className={styles.value}>{profile.pincode || "—"}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Contact</span>
            <span className={styles.value}>{profile.contact_number || "—"}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Address</span>
            <span className={styles.value}>{profile.address || "—"}</span>
          </div>
          {profile.description && (
            <div className={styles.row}>
              <span className={styles.label}>About</span>
              <span className={styles.value}>{profile.description}</span>
            </div>
          )}
          {profile.rating !== null && (
            <div className={styles.row}>
              <span className={styles.label}>Rating</span>
              <span className={styles.value}>{profile.rating} / 5</span>
            </div>
          )}
        </div>
      </div>
    </div>
    </AppShell>
    
  );
}