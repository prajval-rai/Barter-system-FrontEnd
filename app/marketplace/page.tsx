import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MarketplaceToggleView from "./Marketplacetoggleview";
import AppShell from "@/components/AppShell/Appshell ";

export interface ReplaceOption {
  id: number;
  replace_type: string;
  title: string;
  description: string;
  category_name: string;
  icon: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  category: number;
  category_name: string;
  status: string;
  created_at: string;
  purchase_year: number;
  owner_name: string;
  thumbnail: string;
  owner_latitude: number | null;
  owner_longitude: number | null;
  owner_address: string | null;
  replace_options: ReplaceOption[];
}

export interface MarketplaceResponse {
  results: Product[];
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
}

export interface Category {
  id: number;
  name: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function fetchInitialProducts(cookieHeader: string): Promise<MarketplaceResponse> {
  try {
    const res = await fetch(
      `${API_BASE}/products/marketplace/?page=1&page_size=12&sort=newest`,
      {
        headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
        cache: "no-store",
      }
    );
    if (res.status === 401) redirect("/login");
    if (!res.ok) return { results: [], page: 1, page_size: 12, total: 0, has_next: false };
    return res.json();
  } catch {
    return { results: [], page: 1, page_size: 12, total: 0, has_next: false };
  }
}

async function fetchCategories(cookieHeader: string): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/products/categories/`, {
      headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (res.status === 401) redirect("/login");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function MarketplacePage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString(); // same as MyListingsPage pattern

  const [initialData, categories] = await Promise.all([
    fetchInitialProducts(cookieHeader),
    fetchCategories(cookieHeader),
  ]);

  return (
    <AppShell>
      <MarketplaceToggleView
        initialProducts={initialData.results}
        initialHasNext={initialData.has_next}
        initialTotal={initialData.total}
        categories={categories}
      />
    </AppShell>
  );
}