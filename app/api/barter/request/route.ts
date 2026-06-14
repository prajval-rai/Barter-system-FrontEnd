import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;

function getCookieHeader(req: NextRequest) {
  return req.headers.get("cookie") ?? "";
}

export async function GET(req: NextRequest) {
  const res = await fetch(`${BACKEND}barter/requests/received`, {
    headers: { "Cookie": getCookieHeader(req) },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${BACKEND}barter/request/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": getCookieHeader(req),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}