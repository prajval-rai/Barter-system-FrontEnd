import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import MyListings from '@/components/Mylistings/Mylistings';
import AppShell from '@/components/AppShell/Appshell ';

export const metadata = {
  title: 'My Listings — Barter',
};

interface Product {
  id: number;
  title: string;
  thumbnail: string;
  status: string;
  category_name: string;
  created_at: string;
}

async function fetchMyProducts(): Promise<Product[] | null> {
  const incomingHeaders = await headers();
  const cookieHeader = incomingHeaders.get('cookie') ?? '';
  const host = incomingHeaders.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

  const res = await fetch(`${protocol}://${host}/api/product/my`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });

  if (res.status === 401) {
    return null;
  }

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default async function MyListingsPage() {
  const products = await fetchMyProducts();

  if (products === null) {
    redirect('/login');
  }

  return (
    <AppShell>
      <MyListings initialProducts={products} />
    </AppShell>
  );
}