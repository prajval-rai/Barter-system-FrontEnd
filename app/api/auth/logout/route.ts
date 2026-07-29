import { NextRequest, NextResponse } from "next/server";
const base_url = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: NextRequest) {
  // ✅ Forward the browser's cookies to Django so it knows which
  // refresh token to blacklist
  const cookieHeader = request.headers.get("cookie") ?? "";

  const res = await fetch(`${base_url}accounts/logout/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
  });

  const data = await res.json().catch(() => ({}));
  const response = NextResponse.json(data, { status: res.status });

  // ✅ Clear cookies on the frontend domain regardless of what Django
  // returns — this is what actually logs the user out client-side
  response.cookies.set("access", "", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 0,
    path: "/",
  });

  response.cookies.set("refresh", "", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 0,
    path: "/",
  });

  return response;
}
