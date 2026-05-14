import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import type { Product } from '@/types/product';
import ProductDetailPage from '../../../components/ProductDetails/ProductDetailPage';
import AppShell from '@/components/AppShell/Appshelldetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  return {
    'Cookie': cookieHeader,
    'Content-Type': 'application/json',
  };
}

async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`http://localhost:8000/products/${id}/`, {
      headers,
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchSimilarProducts(categoryId: number, excludeId: number): Promise<Product[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(
      `http://localhost:8000/products/?category=${categoryId}&limit=6`,
      {
        headers,
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const list: Product[] = Array.isArray(data) ? data : data.results ?? [];
    return list.filter((p) => p.id !== excludeId);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(id);
  if (!product) return { title: 'Product Not Found' };
  return {
    title: `${product.title} — Barter`,
    description: product.description,
    openGraph: {
      images: product.images[0]?.image ? [product.images[0].image] : [],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const product = await fetchProduct(id);

  if (!product) notFound();

  const similarProducts = await fetchSimilarProducts(product.category.id, product.id);

  return <AppShell><ProductDetailPage product={product} similarProducts={similarProducts} />;</AppShell>
}