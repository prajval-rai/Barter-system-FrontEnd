"use client";

import { useEffect, useState } from "react";
import SwapsView from "./Swapsview";
import AppShell from "@/components/AppShell/Appshell ";


export type Product = {
  id: number;
  title: string;
  thumbnail: string;
  status: string;
  category_name: string;
  created_at: string;
};

export type BarterRequest = {
  id: number;
  from_user: string;
  to_user: string;
  request_product: Product;
  request_for_product: Product;
  status: string;
  created_at: string;
  unread_count: number;
  last_message: string;
  last_message_time: string | null;
  last_message_sender: string;
};

type ApiResponse = {
  status: string;
  count: number;
  data: BarterRequest[];
};

export default function MySwapsPage() {
  const [completed, setCompleted] = useState<BarterRequest[]>([]);
  const [rejected, setRejected] = useState<BarterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const base_url    = process.env.NEXT_PUBLIC_BACKEND_URL;
    const fetchData = async () => {
      try {
        const [completedRes, rejectedRes] = await Promise.all([
          fetch(`${base_url}barter/completed_barter_requests/`, {
            credentials: "include",
          }),
          fetch(`${base_url}barter/rejected_barter_requests/`, {
            credentials: "include",
          }),
        ]);

        if (!completedRes.ok || !rejectedRes.ok) {
          throw new Error("Failed to fetch swap data.");
        }

        const completedData: ApiResponse = await completedRes.json();
        const rejectedData: ApiResponse = await rejectedRes.json();

        setCompleted(completedData.data);
        setRejected(rejectedData.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <AppShell>
        <SwapsView
      completed={completed}
      rejected={rejected}
      loading={loading}
      error={error}
    />

    </AppShell>
    
  );
}