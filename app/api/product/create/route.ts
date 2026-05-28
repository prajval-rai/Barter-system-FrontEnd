import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request: Request) {
  if (!BACKEND_URL) {
    return NextResponse.json({ error: "BACKEND_URL not set" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(c => `${c.name}=${c.value}`)
    .join("; ");

  const formData = await request.formData();

  const res = await fetch(`${BACKEND_URL}products/create_product/`, {
    method: "POST",
    headers: { Cookie: cookieHeader },
    body: formData,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}