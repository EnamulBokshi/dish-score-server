export interface ICreateReviewPayload {
  rating: number;
  comment?: string;
  images?: string[];
  restaurantId: string;
  dishId?: string;
}

export interface IUpdateReviewPayload {
  rating?: number;
  comment?: string;
  images?: string[];
}
