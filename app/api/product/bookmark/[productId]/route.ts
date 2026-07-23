import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;

function getCookieHeader(req: NextRequest) {
  return req.headers.get("cookie") ?? "";
}

// ── Add a bookmark ──
export async function POST(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  const res = await fetch(`${BACKEND}products/bookmark/${params.productId}/`, {
    method: "POST",
    headers: { "Cookie": getCookieHeader(req) },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

// ── Remove a bookmark ──
export async function DELETE(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  const res = await fetch(`${BACKEND}products/bookmark/${params.productId}/remove/`, {
    method: "DELETE",
    headers: { "Cookie": getCookieHeader(req) },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
