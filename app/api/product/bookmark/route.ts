import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;

function getCookieHeader(req: NextRequest) {
  return req.headers.get("cookie") ?? "";
}

// ── List all bookmarks for the logged-in user ──
export async function GET(req: NextRequest) {
  const res = await fetch(`${BACKEND}products/bookmarks/`, {
    headers: { "Cookie": getCookieHeader(req) },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
