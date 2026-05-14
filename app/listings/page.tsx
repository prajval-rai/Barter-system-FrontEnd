import { cookies } from 'next/headers';
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

async function fetchMyProducts(): Promise<Product[]> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    console.log('=== COOKIE DEBUG ===');
    console.log('All cookies:', allCookies);
    
    const token = cookieStore.get('access')?.value;
    console.log('Access token:', token ? `${token.slice(0, 20)}...` : 'NOT FOUND');
    console.log('Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
    console.log('Full URL:', `${process.env.NEXT_PUBLIC_BACKEND_URL}products/my_product/`);

    if (!token) redirect('/login');

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}products/my_product/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    console.log('Response status:', res.status);

    if (res.status === 401) redirect('/login');
    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data) ? data : data.results ?? [];
  } catch (e) {
    console.log('Fetch error:', e);
    return [];
  }
}

export default async function MyListingsPage() {
  const products = await fetchMyProducts();
  return <AppShell>
    <MyListings initialProducts={products} />
  </AppShell>;
}
