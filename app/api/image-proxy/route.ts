import { NextRequest, NextResponse } from "next/server";

// Add every domain your thumbnails are actually served from.
// This allowlist exists to stop this route being used as an open proxy.
const ALLOWED_HOSTS = [
  "lenden.co.in",
  "www.lenden.co.in",
  // e.g. "your-bucket.s3.amazonaws.com", "res.cloudinary.com", "your-cdn.com"
];

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const hostAllowed = ALLOWED_HOSTS.some(
    (h) => target.hostname === h || target.hostname.endsWith(`.${h}`)
  );

  if (!hostAllowed) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      // Prevents this route itself from being cached with a stale image
      cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err) {
    console.error("Image proxy failed", err);
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}
