"use client";

import { useEffect, useState } from "react";
import BookmarksView from "./Bookmarksview";
import AppShell from "@/components/AppShell/Appshell ";

export type BookmarkItem = {
  id: number;
  product_id: number;
  title: string;
  category: string;
  condition: string;
  product_status: string;
  thumbnail: string;
  created_at: string;
};

type ApiResponse = {
  status: string;
  count: number;
  data: BookmarkItem[];
};

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const base_url    = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const res = await fetch(`${base_url}products/bookmarks/`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch bookmarks.");

        const data: ApiResponse = await res.json();
        setBookmarks(data.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  const handleRemove = (productId: number) => {
    setBookmarks((prev) => prev.filter((b) => b.product_id !== productId));
  };

  return (
    <AppShell>
        <BookmarksView
      bookmarks={bookmarks}
      loading={loading}
      error={error}
      onRemove={handleRemove}
    />

    </AppShell>
    
  );
}