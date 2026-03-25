/*
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
*/
import { UserRole } from "../../../generated/prisma/enums";
export const restaurantSearchableFields = ['name', 'description', 'address', 'city', 'state', 'road'];
export const restaurantFilterableFields = ['name', 'city', 'state', 'ratingAvg'];
export const restaurantDefaultFields = ['id', 'name', 'description', 'address', 'city', 'state', 'road', 'location', 'contact', 'images', 'ratingAvg', 'totalReviews'];
export const restaurantSearchableExactFields = ['name', 'city', 'state'];
export const restaurantEnumFields = {
    ratingAvg: ['1', '2', '3', '4', '5'],
    "user.role": Object.values(UserRole)
};
export const restaurantIncludeConfig = {
    dishes: {
        select: {
            id: true,
            name: true,
            description: true,
            price: true,
            images: true
        }
    },
    reviews: {
        select: {
            id: true,
            rating: true,
            comment: true,
            user: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    }
};
