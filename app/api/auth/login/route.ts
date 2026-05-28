import { NextRequest, NextResponse } from "next/server";

const base_url = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: NextRequest) {
  const body = await request.json();

  const res = await fetch(`${base_url}accounts/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  console.log("MMMMMMMMMMMMMMMMMMm",res)
  const response = NextResponse.json(data, { status: res.status });

  // ✅ Parse all set-cookie headers and re-set on frontend domain
  const rawCookies = res.headers.getSetCookie?.() ?? [];
  
  for (const cookie of rawCookies) {
    const [nameValue] = cookie.split(";");
    const [name, value] = nameValue.split("=");
    
    if (name?.trim() === "access") {
      response.cookies.set("access", value?.trim(), {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 86400,
        path: "/",
      });
    }
    
    if (name?.trim() === "refresh") {
      response.cookies.set("refresh", value?.trim(), {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 604800,
        path: "/",
      });
    }
  }

  return response;
}