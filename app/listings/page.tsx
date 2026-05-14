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
    
    // Change 'access' to whatever your cookie name actually is
    const token = cookieStore.get('access')?.value;

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

    if (res.status === 401) redirect('/login');
    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data) ? data : data.results ?? [];
  } catch {
    return [];
  }
}


export default async function MyListingsPage() {
  const products = await fetchMyProducts();
  return <AppShell>
    <MyListings initialProducts={products} />
  </AppShell>;
}
