import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(c => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}barter/get_accepted_request/`, {
    headers: { "Cookie": cookieHeader },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Backend error:", res.status, text);
    return NextResponse.json({ error: `Backend error ${res.status}` }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}