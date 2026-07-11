import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

const VALID_STATUSES = ["submitted", "approved", "closed", "rejected", "banned"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookie = req.headers.get("cookie") ?? "";
  const { status } = await req.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ detail: "Invalid status" }, { status: 400 });
  }

  const res = await fetch(
    `${BACKEND_URL}/products/change_product_status/?product_id=${id}&status=${status}`,
    { method: "POST", headers: { cookie }, cache: "no-store" }
  );

  if (res.status === 401) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  if (!res.ok) {
    return NextResponse.json({ detail: "Failed to update status" }, { status: res.status });
  }

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data);
}