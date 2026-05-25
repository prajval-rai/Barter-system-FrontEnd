export interface ProductImage {
  id: number;
  image: string;
  created_at: string;
  product: number;
}

export interface ProductCategory {
  id: number;
  name: string;
}

export interface ReplaceOption {
  id: number;
  title: string;
  description: string;
  category: string;
  replace_type: 'product' | 'points';
  point_value: number | null;
  meta: Record<string, unknown>;
  icon: string;
}

export interface ProductOwner {
  id: number;
  address: string;
  rating: number | null;
  description: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  category: ProductCategory;
  images: ProductImage[];
  status: 'submitted' | 'approved' | 'rejected' | 'swapped';
  created_at: string;
  product_replace_options: ReplaceOption[];
  purchase_year: number;
  purchase_bill: string | null;
  owner: ProductOwner;
  is_bookmarked:boolean
}