import { Prisma, Restaurant } from "../../../generated/prisma/client";
import { UserRole } from "../../../generated/prisma/enums";
import { IQueryParams } from "../../../interfaces/query.interfaces";
import status from "http-status";
import AppError from "../../helpers/errorHelpers/AppError";
import prisma from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { restaurantEnumFields, restaurantFilterableFields, restaurantSearchableExactFields, restaurantSearchableFields } from "./restaurant.constats";
import { deleteFileCloudinary } from "../../../config/cloudinary";
import { ICreateRestaurantPayload } from "./restaurant.interface";

interface IRestaurantRequester {
    userId: string;
    role: UserRole;
}

const assertCanModifyRestaurant = async (restaurantId: string, requester: IRestaurantRequester) => {
    const restaurant = await prisma.restaurant.findFirst({
        where: {
            id: restaurantId,
            isDeleted: false,
        },
        select: {
            id: true,
            createdByUserId: true,
        },
    });

    if (!restaurant) {
        throw new AppError(status.NOT_FOUND, "Restaurant not found");
    }

    const isAdmin = requester.role === UserRole.ADMIN || requester.role === UserRole.SUPER_ADMIN;
    const isOwnerOrConsumer = requester.role === UserRole.OWNER || requester.role === UserRole.CONSUMER;

    if (isAdmin) {
        return;
    }

    if (isOwnerOrConsumer && restaurant.createdByUserId === requester.userId) {
        return;
    }

    throw new AppError(status.FORBIDDEN, "You can only modify your own restaurant profile");
};



const createRestaurant = async (payload: ICreateRestaurantPayload, createdByUserId: string) => {
    return await prisma.restaurant.create({
        data: {
            ...payload,
            createdByUserId,
        }
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

const updateRestaurant = async (id: string, payload: Partial<ICreateRestaurantPayload>, requester: IRestaurantRequester) => {
    await assertCanModifyRestaurant(id, requester);

    // If new images are provided, delete old images from Cloudinary
    if (payload.images && payload.images.length > 0) {
        const existingRestaurant = await prisma.restaurant.findFirst({
            where: { id },
            select: { images: true },
        });

        if (existingRestaurant?.images && existingRestaurant.images.length > 0) {
            try {
                await Promise.all(
                    existingRestaurant.images.map((imageUrl) =>
                        deleteFileCloudinary(imageUrl).catch((error) => {
                            console.error(`Error deleting image ${imageUrl}:`, error);
                        })
                    )
                );
            } catch (error) {
                console.error("Error deleting old images from Cloudinary:", error);
                // Continue with update even if deletion fails
            }
        }
    }

    return await prisma.restaurant.update({
        where: { id },
        data: payload
    });
}

const softDeleteRestaurant = async (id: string, requester: IRestaurantRequester) => {
    await assertCanModifyRestaurant(id, requester);

    // Fetch restaurant to get all images
    const restaurant = await prisma.restaurant.findFirst({
        where: { id },
        select: { images: true },
    });

    // Delete all images from Cloudinary
    if (restaurant?.images && restaurant.images.length > 0) {
        try {
            await Promise.all(
                restaurant.images.map((imageUrl) =>
                    deleteFileCloudinary(imageUrl).catch((error) => {
                        console.error(`Error deleting image ${imageUrl}:`, error);
                    })
                )
            );
        } catch (error) {
            console.error("Error deleting images from Cloudinary:", error);
            // Continue with delete even if image deletion fails
        }
    }

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