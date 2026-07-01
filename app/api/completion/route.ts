import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access')?.value;

  console.log('DEBUG token exists:', !!token);
  console.log('DEBUG BACKEND:', BACKEND);

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND}accounts/completion/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('DEBUG Django status:', res.status);
    const rawText = await res.text();
    console.log('DEBUG Django body:', rawText);

    if (!res.ok) {
      return NextResponse.json({ completion_percentage: 0 }, { status: res.status });
    }

    const data = JSON.parse(rawText);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error('completion route error:', err);
    return NextResponse.json({ completion_percentage: 0 }, { status: 500 });
  }
}
