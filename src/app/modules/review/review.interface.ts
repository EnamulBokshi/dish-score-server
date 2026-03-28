export interface ICreateReviewPayload {
  rating: number;
  comment?: string;
  images?: string[];
  restaurantId: string;
  dishId?: string;
  tags?: string[];
}

export interface IUpdateReviewPayload {
  rating?: number;
  comment?: string;
  images?: string[];
  tags?: string[];
}
