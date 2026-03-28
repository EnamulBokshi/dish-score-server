import { UserRole } from "../../../generated/prisma/enums";
import status from "http-status";
import AppError from "../../helpers/errorHelpers/AppError";
import prisma from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { restaurantEnumFields, restaurantFilterableFields, restaurantSearchableExactFields, restaurantSearchableFields } from "./restaurant.constats";
import { deleteFileCloudinary } from "../../../config/cloudinary";
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
    const { tagIds, ...restaurantData } = payload;
    const restaurant = await prisma.restaurant.create({
        data: {
            ...restaurantData,
            createdByUserId,
        }
    });
    // Create restaurant tags if tagIds are provided
    if (tagIds && tagIds.length > 0) {
        await prisma.restaurantTag.createMany({
            data: tagIds.map(tagId => ({
                restaurantId: restaurant.id,
                tagId,
            })),
            skipDuplicates: true,
        });
    }
    return restaurant;
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
const getRestaurantsByUserId = async (userId, query) => {
    const qeuryBuilder = new QueryBuilder(prisma.restaurant, query, {
        searchableFields: restaurantSearchableFields,
        filterableFields: restaurantFilterableFields,
        searchableEnumFields: restaurantEnumFields,
        searchableExactFields: restaurantSearchableExactFields,
    });
    const result = await qeuryBuilder
        .search()
        .filter()
        .where({
        isDeleted: false,
        createdByUserId: userId,
    })
        .include({
        dishes: {
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                image: true,
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
                        name: true,
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
const getTopRatedRestaurants = async () => {
    const result = await prisma.restaurant.findMany({
        where: {
            isDeleted: false,
        },
        orderBy: [
            {
                ratingAvg: "desc",
            },
            {
                totalReviews: "desc",
            },
            {
                createdAt: "desc",
            },
        ],
        take: 10,
        include: {
            dishes: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            reviews: {
                select: {
                    id: true,
                    rating: true,
                },
            },
        },
    });
    return result;
};
const getRestaurantById = async (id) => {
    const result = await prisma.restaurant.findFirst({
        where: {
            id,
            isDeleted: false,
        },
        include: {
            dishes: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    image: true,
                },
            },
            reviews: {
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });
    if (!result) {
        throw new AppError(status.NOT_FOUND, "Restaurant not found");
    }
    return result;
};
const updateRestaurant = async (id, payload, requester) => {
    await assertCanModifyRestaurant(id, requester);
    const { tagIds, ...restaurantData } = payload;
    // If new images are provided, delete old images from Cloudinary
    if (restaurantData.images && restaurantData.images.length > 0) {
        const existingRestaurant = await prisma.restaurant.findFirst({
            where: { id },
            select: { images: true },
        });
        if (existingRestaurant?.images && existingRestaurant.images.length > 0) {
            try {
                await Promise.all(existingRestaurant.images.map((imageUrl) => deleteFileCloudinary(imageUrl).catch((error) => {
                    console.error(`Error deleting image ${imageUrl}:`, error);
                })));
            }
            catch (error) {
                console.error("Error deleting old images from Cloudinary:", error);
                // Continue with update even if deletion fails
            }
        }
    }
    const updatedRestaurant = await prisma.restaurant.update({
        where: { id },
        data: restaurantData
    });
    // Update tags if tagIds are provided
    if (tagIds) {
        // Delete existing tags
        await prisma.restaurantTag.deleteMany({
            where: { restaurantId: id },
        });
        // Create new tags
        if (tagIds.length > 0) {
            await prisma.restaurantTag.createMany({
                data: tagIds.map(tagId => ({
                    restaurantId: id,
                    tagId,
                })),
                skipDuplicates: true,
            });
        }
    }
    return updatedRestaurant;
};
const softDeleteRestaurant = async (id, requester) => {
    await assertCanModifyRestaurant(id, requester);
    // Fetch restaurant to get all images
    const restaurant = await prisma.restaurant.findFirst({
        where: { id },
        select: { images: true },
    });
    // Delete all images from Cloudinary
    if (restaurant?.images && restaurant.images.length > 0) {
        try {
            await Promise.all(restaurant.images.map((imageUrl) => deleteFileCloudinary(imageUrl).catch((error) => {
                console.error(`Error deleting image ${imageUrl}:`, error);
            })));
        }
        catch (error) {
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
};
export const RestaurantService = {
    createRestaurant,
    updateRestaurant,
    softDeleteRestaurant,
    getRestaurants,
    getRestaurantsByUserId,
    getTopRatedRestaurants,
    getRestaurantById,
};
