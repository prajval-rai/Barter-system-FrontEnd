import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET() {
  if (!BACKEND_URL) {
    return NextResponse.json({ error: "BACKEND_URL not set" }, { status: 500 });
  }

  const res = await fetch(`${BACKEND_URL}products/categories/`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}