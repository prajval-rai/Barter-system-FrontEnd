import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function GET(req: NextRequest) {
  console.log(`ccccccccccccccccccccccccccccccccccc${BACKEND}products/my_product`)
  const res = await fetch(`${BACKEND}products/my_product`, {
    headers: { cookie: req.headers.get("cookie") ?? "" },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
