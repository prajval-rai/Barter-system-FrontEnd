import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function GET(req: NextRequest) {
  const res = await fetch(`${BACKEND}scan/scan_all_my_products`, {
    headers: {
      cookie: req.headers.get("cookie") ?? "",
    },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
