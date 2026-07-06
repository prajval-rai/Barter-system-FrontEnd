import { Category } from "./page";

export function toSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function findCategoryBySlug(categories: Category[], slug: string): Category | undefined {
  return categories.find((c) => toSlug(c.name) === slug);
}