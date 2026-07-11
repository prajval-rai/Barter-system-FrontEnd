import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookie = req.headers.get("cookie") ?? "";

  const res = await fetch(`${BACKEND_URL}/products/${id}`, {
    headers: { cookie },
    cache: "no-store",
  });

  if (res.status === 401) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  if (!res.ok) {
    return NextResponse.json({ detail: "Failed to fetch product" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}