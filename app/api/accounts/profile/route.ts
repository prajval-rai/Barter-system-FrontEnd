import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function GET(req: NextRequest) {
  const res = await fetch(`${BACKEND}accounts/upsertProfile/`, {
    headers: { "Cookie": req.headers.get("cookie") ?? "" },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Profile fetch error:", res.status, text);
    return NextResponse.json({ error: `Backend error ${res.status}` }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${BACKEND}accounts/upsertProfile/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": req.headers.get("cookie") ?? "",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Profile update error:", res.status, text);
    return NextResponse.json({ error: `Backend error ${res.status}` }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}