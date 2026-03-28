export interface ICreateReviewPayload {
  rating: number;
  comment?: string;
  images?: string[];
  restaurantId: string;
  dishId?: string;
  tagIds?: string[];
}

export interface IUpdateReviewPayload {
  rating?: number;
  comment?: string;
  images?: string[];
  tagIds?: string[];
}
