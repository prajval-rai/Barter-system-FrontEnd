import { headers } from "next/headers";
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
  purchase_year: number | null;
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

async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

// NEW: grab the cookie header from the incoming request so we can
// forward it to our own API route — server-to-server fetches do NOT
// carry the browser's cookies automatically.
async function getAuthHeaders(): Promise<HeadersInit> {
  const headersList = await headers();
  const cookie = headersList.get("cookie");
  return cookie ? { cookie } : {};
}

async function fetchInitialProducts(baseUrl: string): Promise<MarketplaceResponse> {
  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${baseUrl}/api/marketplace?page=1&page_size=12&sort=newest`, {
      cache: "no-store",
      headers: authHeaders,
    });
    if (res.status === 401) redirect("/login");
    if (!res.ok)
      return { results: [], page: 1, page_size: 12, total: 0, has_next: false };
    return res.json();
  } catch {
    return { results: [], page: 1, page_size: 12, total: 0, has_next: false };
  }
}

async function fetchCategories(baseUrl: string): Promise<Category[]> {
  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${baseUrl}/api/categories`, {
      cache: "no-store",
      headers: authHeaders,
    });
    if (res.status === 401) redirect("/login");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function MarketplacePage() {
  const baseUrl = await getBaseUrl();

  const [initialData, categories] = await Promise.all([
    fetchInitialProducts(baseUrl),
    fetchCategories(baseUrl),
  ]);

  return (
    <AppShell>
      <MarketplaceToggleView
        initialProducts={initialData.results}
        initialHasNext={initialData.has_next}
        initialTotal={initialData.total}
        categories={categories}
        initialCategory={null}
        initialView="grid"
      />
    </AppShell>
  );
}