import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function PUT(request: Request) {
  if (!BACKEND_URL) {
    return NextResponse.json({ error: "BACKEND_URL not set" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(c => `${c.name}=${c.value}`)
    .join("; ");

  const body = await request.json();

  const res = await fetch(`${BACKEND_URL}accounts/update_profile/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookieHeader,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}