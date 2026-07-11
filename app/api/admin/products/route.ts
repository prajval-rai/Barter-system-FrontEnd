import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");;

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") || "submitted";
  const cookie = req.headers.get("cookie") ?? "";

  const res = await fetch(
    `${BACKEND_URL}/products/admin_products_by_status?status=${encodeURIComponent(status)}`,
    { headers: { cookie }, cache: "no-store" }
  );

  if (res.status === 401) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  if (!res.ok) {
    return NextResponse.json({ detail: "Failed to fetch products" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}