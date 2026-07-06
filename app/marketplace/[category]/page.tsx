import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import MarketplaceToggleView from "../Marketplacetoggleview";
import AppShell from "@/components/AppShell/Appshell ";
import { findCategoryBySlug } from "../slug";
import { MarketplaceResponse, Category } from "../page";

async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

async function fetchCategories(baseUrl: string): Promise<Category[]> {
  try {
    const res = await fetch(`${baseUrl}/api/categories`, { cache: "no-store" });
    if (res.status === 401) redirect("/login");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchInitialProducts(
  baseUrl: string,
  categoryId: number
): Promise<MarketplaceResponse> {
  try {
    const res = await fetch(
      `${baseUrl}/api/marketplace?page=1&page_size=12&sort=newest&category=${categoryId}`,
      { cache: "no-store" }
    );
    if (res.status === 401) redirect("/login");
    if (!res.ok)
      return { results: [], page: 1, page_size: 12, total: 0, has_next: false };
    return res.json();
  } catch {
    return { results: [], page: 1, page_size: 12, total: 0, has_next: false };
  }
}

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ view?: string }>;
}

export default async function MarketplaceCategoryPage({ params, searchParams }: PageProps) {
  const { category: slug } = await params;
  const { view } = await searchParams;
  const baseUrl = await getBaseUrl();

  const categories = await fetchCategories(baseUrl);
  const matched = findCategoryBySlug(categories, slug);

  if (!matched) notFound();

  const initialData = await fetchInitialProducts(baseUrl, matched.id);
  const initialView = view === "grid" ? "grid" : "map";

  return (
    <AppShell>
      <MarketplaceToggleView
        initialProducts={initialData.results}
        initialHasNext={initialData.has_next}
        initialTotal={initialData.total}
        categories={categories}
        initialCategory={matched.id}
        initialView={initialView}
      />
    </AppShell>
  );
}