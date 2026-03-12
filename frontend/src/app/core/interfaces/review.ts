export interface Review {
  _id: string;
  productId: string;
  userId?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

export interface ReviewResponse {
  success: boolean;
  count: number;
  data: Review[];
}
