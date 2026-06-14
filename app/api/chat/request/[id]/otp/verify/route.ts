import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const res = await fetch(`${BACKEND}chat/request/${id}/otp/verify/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": req.headers.get("cookie") ?? "",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}