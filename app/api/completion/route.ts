import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function GET(req: NextRequest) {
  const res = await fetch(`${BACKEND}accounts/completion/`, {
    headers: { cookie: req.headers.get("cookie") ?? "" },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
