import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const token = cookies().get("access_token")?.value;
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/barter/get_accepted_request/`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
