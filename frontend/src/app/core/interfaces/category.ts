export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface CategoryResponse {
  success: boolean;
  count: number;
  data: Category[];
}