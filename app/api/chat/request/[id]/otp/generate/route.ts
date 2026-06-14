import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = `${BACKEND}chat/request/${id}/otp/generate/`;
  console.log("CALLING:", url);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Cookie": req.headers.get("cookie") ?? "" },
  });

  console.log("STATUS:", res.status);
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}