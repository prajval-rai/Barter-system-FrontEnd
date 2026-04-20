import { useState, useEffect, useRef, useCallback } from "react";

const BASE_WS = process.env.NEXT_PUBLIC_WEB_SOCEKT;
const base_url = process.env.NEXT_PUBLIC_BACKEND_URL

async function fetchWsToken(): Promise<string | null> {
  try {
    const r = await fetch(`${base_url}accounts/ws-token/`, { credentials: "include" });
    if (!r.ok) return null;
    return (await r.json()).token ?? null;
  } catch { return null; }
}

export function useUnreadSocket(userEmail: string | undefined) {
  const [totalUnread, setTotalUnread] = useState(0);
  const wsRef     = useRef<WebSocket | null>(null);
  const reconnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted   = useRef(true);

  const connect = useCallback(async () => {
    if (!userEmail) return;
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) return;
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }

    const token = await fetchWsToken();
    const qs    = token ? `?token=${encodeURIComponent(token)}` : "";
    const ws    = new WebSocket(`${BASE_WS}/ws/unread/${qs}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      if (!mounted.current) return;
      const d = JSON.parse(e.data);
      if (d.type === "unread_count") setTotalUnread(d.count);
    };
    ws.onclose = () => {
      if (!mounted.current) return;
      reconnRef.current = setTimeout(connect, 4000);
    };
    ws.onerror = () => {};
  }, [userEmail]);

  useEffect(() => {
    mounted.current = true;
    connect();
    return () => {
      mounted.current = false;
      if (reconnRef.current) clearTimeout(reconnRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [connect]);

  return totalUnread;
}