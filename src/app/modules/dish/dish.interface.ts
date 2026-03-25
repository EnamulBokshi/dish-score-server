export interface ICreateDishPayload {
  name: string;
  description?: string;
  price?: number;
  image?: string;
  restaurantId: string;
}

export interface IUpdateDishPayload {
  name?: string;
  description?: string;
  price?: number;
  image?: string;
}
