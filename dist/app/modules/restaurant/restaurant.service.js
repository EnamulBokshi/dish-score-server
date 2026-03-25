import { UserRole } from "../../../generated/prisma/enums";
import status from "http-status";
import AppError from "../../helpers/errorHelpers/AppError";
import prisma from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { restaurantEnumFields, restaurantFilterableFields, restaurantSearchableExactFields, restaurantSearchableFields } from "./restaurant.constats";
const assertCanModifyRestaurant = async (restaurantId, requester) => {
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
const createRestaurant = async (payload, createdByUserId) => {
    return await prisma.restaurant.create({
        data: {
            ...payload,
            createdByUserId,
        }
    });
};
const getRestaurants = async (query) => {
    const qeuryBuilder = new QueryBuilder(prisma.restaurant, query, {
        searchableFields: restaurantSearchableFields,
        filterableFields: restaurantFilterableFields,
        searchableEnumFields: restaurantEnumFields,
        searchableExactFields: restaurantSearchableExactFields,
    });
    const result = await qeuryBuilder
        .search()
        .filter()
        .where({ isDeleted: false })
        .include({
        dishes: {
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                image: true
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
        .execute();
    return result;
};
const updateRestaurant = async (id, payload, requester) => {
    await assertCanModifyRestaurant(id, requester);
    return await prisma.restaurant.update({
        where: { id },
        data: payload
    });
};
const softDeleteRestaurant = async (id, requester) => {
    await assertCanModifyRestaurant(id, requester);
    return await prisma.restaurant.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date()
        }
    });
};
export const RestaurantService = {
    createRestaurant,
    updateRestaurant,
    softDeleteRestaurant,
    getRestaurants
};
