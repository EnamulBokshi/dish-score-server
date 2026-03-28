import { UserRole } from "../../../generated/prisma/enums";

export interface IUnifiedRequester {
  userId: string;
  role: UserRole;
}

export interface IUnifiedCreatePayload {
  restaurant: {
    data: {
      name: string;
      description?: string;
      address: string;
      city: string;
      state: string;
      road: string;
      location: {
        lat: number | string;
        lng: number | string;
      };
      contact?: string;
      tags?: string[];
    };
    images?: string[];
  };
  dish: {
    data: {
      name: string;
      description?: string;
      price?: number;
      ingredients: string[];
      tags?: string[];
      image?: string;
    };
    images?: string[];
  };
  review: {
    data: {
      rating: number;
      comment?: string;
      tags?: string[];
    };
    images?: string[];
    image?: string | string[];
  };
}
