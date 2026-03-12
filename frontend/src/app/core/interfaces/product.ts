export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  sku: string;
  stock: number;
  rating: number;
  reviewCount: number;
  categoryId?: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  images: string[];
  featured: boolean;
  createdAt: string;
}

// This matches the response from GET /api/v1/products
export interface ProductResponse {
  success: boolean;
  count: number;
  data: Product[];
  total?: number;
  page?: number;
  pages?: number;
}