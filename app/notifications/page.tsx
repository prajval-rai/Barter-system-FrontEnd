"use client";

import { useEffect, useState } from "react";
import NotificationsView from "./Notificationsview";
import AppShell from "@/components/AppShell/Appshell ";

export type Notification = {
  id: number;
  title: string;
  message: string;
  staus: boolean; // typo from backend kept as-is
  created_at: string;
  notification_type?: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const base_url    = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${base_url}accounts/notifications/`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch notifications.");
      const data: Notification[] = await res.json();
      setNotifications(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, staus: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, staus: true })));
  };

  const handleDelete = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <AppShell>
        <NotificationsView
      notifications={notifications}
      loading={loading}
      error={error}
      onMarkRead={handleMarkRead}
      onMarkAllRead={handleMarkAllRead}
      onDelete={handleDelete}
    />
    </AppShell>
    
  );
}