/*

model Restaurant {
  id          String   @id @default(cuid())
  name        String
  description String?
  address     String
  city        String
  state       String
  road        String
  location   Json

  contact     String?
  images      String[]

  dishes      Dish[]
  reviews     Review[]

  ratingAvg   Float    @default(0)
  totalReviews Int     @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

*/

export interface ICreateRestaurantPayload{
    name: string;
    description?: string;
    address: string;
    city: string;
    state: string;
    road: string;
    location: {
        lat: number;
        lng: number;
    }; 
    contact?: string;
    images: string[];
    tags?: string[];
}

export interface IRestaurant{
    id: string;
    name: string;
    description?: string;
    address: string;
    city: string;
    state: string;
    road: string;
    location: {
        lat: number;
        lng: number;
    }; 
    contact?: string;
    images: string[];
    ratingAvg: number;
    totalReviews: number;
}

export interface IRestaurantListItem{
    id: string;
    name: string;
    description?: string;
    city: string;
    state: string;
    ratingAvg: number;
    totalReviews: number;
}

export interface IRestaurantDetails extends IRestaurant{
    dishes: IDish[];
    reviews: IReview[];
}

export interface IDish{
    id: string;
    name: string;
    description?: string;
    price: number;
    images: string[];
}

export interface IReview{
    id: string;
    rating: number;
    comment?: string;
    createdAt: Date;
}

export interface IUpdateRestaurantPayload{
    name?: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    road?: string;
    location?: {
        lat: number;
        lng: number;
    }; 
    contact?: string;
    images?: string[];
    tags?: string[];
}