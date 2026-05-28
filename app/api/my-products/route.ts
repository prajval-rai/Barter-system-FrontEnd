import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();  // ← add await
  const cookieHeader = cookieStore.getAll()
    .map(c => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}products/my_product/`, {
    headers: {
      Cookie: cookieHeader,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}