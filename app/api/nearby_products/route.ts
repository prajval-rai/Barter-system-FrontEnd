import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const base_url = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function GET() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access")?.value;

  if (!access) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const res = await fetch(`${base_url}scan/nearby_products/`, {
    headers: {
      Cookie: `access=${access}`,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}