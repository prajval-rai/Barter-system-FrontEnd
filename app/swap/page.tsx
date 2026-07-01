import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'Dashboard — LenDen',
};

interface CompletionResponse {
  completion_percentage: number;
}

async function fetchDashboardData() {
  const incomingHeaders = await headers();
  const cookieHeader = incomingHeaders.get('cookie') ?? '';
  const host = incomingHeaders.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const [productsRes, completionRes] = await Promise.all([
    fetch(`${baseUrl}/api/my-products`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    }),
    fetch(`${baseUrl}/api/completion`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    }),
  ]);

  if (productsRes.status === 401) {
    return null;
  }

  const productsData = productsRes.ok ? await productsRes.json() : [];
  const completionData: CompletionResponse = completionRes.ok
    ? await completionRes.json()
    : { completion_percentage: 0 };

  const products = Array.isArray(productsData) ? productsData : [];

  return {
    hasProducts: products.length > 0,
    completionPercentage: completionData.completion_percentage ?? 0,
  };
}

export default async function DashboardPage() {
  const data = await fetchDashboardData();

  if (data === null) {
    redirect('/login');
  }

  return (
    <DashboardClient
      hasProducts={data.hasProducts}
      completionPercentage={data.completionPercentage}
    />
  );
}
