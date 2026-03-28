export interface ICreateDishPayload {
  name: string;
  description?: string;
  price?: number;
  image?: string;
  ingredients: string[];
  restaurantId: string;
  tags?: string[];
}

export interface IUpdateDishPayload {
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  ingredients?: string[];
  tags?: string[]
}
