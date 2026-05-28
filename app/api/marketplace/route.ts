export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const { searchParams } = new URL(req.url);

    console.log("→ API_BASE:", process.env.NEXT_PUBLIC_API_BASE_URL);
    console.log("→ Fetching:", `${API_BASE}/products/marketplace/?${searchParams.toString()}`);
    console.log("→ Cookie:", cookieHeader);

    const res = await fetch(
      `${API_BASE}/products/marketplace/?${searchParams.toString()}`,
      {
        headers: {
          Cookie: cookieHeader,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    console.log("→ Backend status:", res.status);

    if (res.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!res.ok) {
      const text = await res.text();
      console.log("→ Backend error body:", text);
      return NextResponse.json({ error: `Backend error ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (err) {
    console.error("→ Proxy crash:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
