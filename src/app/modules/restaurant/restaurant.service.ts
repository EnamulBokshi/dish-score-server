import { Prisma, Restaurant } from "../../../generated/prisma/client";
import { IQueryParams } from "../../../interfaces/query.interfaces";
import prisma from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { restaurantEnumFields, restaurantFilterableFields, restaurantSearchableExactFields, restaurantSearchableFields } from "./restaurant.constats";
import { ICreateRestaurantPayload } from "./restaurant.interface";




const createRestaurant = async (payload: ICreateRestaurantPayload) => {
    return await prisma.restaurant.create({
        data: payload
    });
}


const getRestaurants = async (query: IQueryParams) => {
    const qeuryBuilder = new QueryBuilder<Restaurant, Prisma.RestaurantWhereInput, Prisma.RestaurantInclude>(
        prisma.restaurant, 
        query,
        {
            searchableFields:restaurantSearchableFields,
            filterableFields: restaurantFilterableFields,
            searchableEnumFields: restaurantEnumFields,
            searchableExactFields: restaurantSearchableExactFields,
            
        }

    );

    const result = await qeuryBuilder
    .search()
    .filter()
    .where({isDeleted:false})
    .include({
        dishes: {
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                image:true
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
    })
    .paginate()
    .sort()
    .execute()

    return result;

}

const updateRestaurant = async (id: string, payload: Partial<ICreateRestaurantPayload>) => {
    return await prisma.restaurant.update({
        where: { id },
        data: payload
    });
}

const softDeleteRestaurant = async (id: string) => {
    return await prisma.restaurant.update({
        where: { id },
        data: { 
            isDeleted: true,
            deletedAt: new Date()
         }
    });
}

export const RestaurantService = {
    createRestaurant,
    updateRestaurant,
    softDeleteRestaurant,
    getRestaurants
}