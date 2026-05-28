import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const { searchParams } = new URL(req.url);
  const queryString = searchParams.toString();

  const res = await fetch(
    `${API_BASE}/products/marketplace/?${queryString}`,
    {
      headers: {
        Cookie: cookieHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (res.status === 401) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
