import { NextRequest, NextResponse } from "next/server";
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const res = await fetch(`${BACKEND}chat/request/${params.id}/otp/generate/`, {
    method:  "POST",
    headers: { cookie: req.headers.get("cookie") ?? "" },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
