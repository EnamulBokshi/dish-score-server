import status from "http-status";
import { UserRole } from "../../../generated/prisma/enums";
import AppError from "../../helpers/errorHelpers/AppError";
import prisma from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { deleteFileCloudinary } from "../../../config/cloudinary";
const assertCanMutateDish = async (dishId, requester) => {
    const dish = await prisma.dish.findFirst({
        where: {
            id: dishId,
            restaurant: {
                isDeleted: false,
            },
        },
        select: {
            id: true,
            restaurant: {
                select: {
                    createdByUserId: true,
                },
            },
        },
    });
    if (!dish) {
        throw new AppError(status.NOT_FOUND, "Dish not found");
    }
    const isAdmin = requester.role === UserRole.ADMIN || requester.role === UserRole.SUPER_ADMIN;
    const isOwnerOrConsumer = requester.role === UserRole.OWNER || requester.role === UserRole.CONSUMER;
    if (isAdmin) {
        return;
    }
    if (isOwnerOrConsumer && dish.restaurant.createdByUserId === requester.userId) {
        return;
    }
    throw new AppError(status.FORBIDDEN, "You can only modify dishes of your own restaurant profiles");
};
const createDish = async (payload) => {
    const restaurant = await prisma.restaurant.findFirst({
        where: {
            id: payload.restaurantId,
            isDeleted: false,
        },
        select: {
            id: true,
        },
    });
    if (!restaurant) {
        throw new AppError(status.NOT_FOUND, "Restaurant not found");
    }
    return await prisma.dish.create({
        data: payload,
    });
};
const getDishes = async (query) => {
    const queryBuilder = new QueryBuilder(prisma.dish, query, {
        searchableFields: ["name", "description", "restaurant.name"],
        filterableFields: ["name", "restaurantId", "price", "ratingAvg"],
    });
    const result = await queryBuilder
        .search()
        .filter()
        .where({
        restaurant: {
            isDeleted: false,
        },
    })
        .include({
        restaurant: {
            select: {
                id: true,
                name: true,
                city: true,
                state: true,
            },
        },
        dishTags: {
            select: {
                tag: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        },
        reviews: {
            select: {
                id: true,
                rating: true,
                comment: true,
            },
        },
    })
        .paginate()
        .sort()
        .execute();
    return result;
};
const getDishById = async (id) => {
    const result = await prisma.dish.findFirst({
        where: {
            id,
            restaurant: {
                isDeleted: false,
            },
        },
        include: {
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    city: true,
                    state: true,
                },
            },
            dishTags: {
                select: {
                    tag: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
            reviews: {
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                },
            },
        },
    });
    if (!result) {
        throw new AppError(status.NOT_FOUND, "Dish not found");
    }
    return result;
};
const getDishesByUserId = async (userId, query) => {
    const queryBuilder = new QueryBuilder(prisma.dish, query, {
        searchableFields: ["name", "description", "restaurant.name"],
        filterableFields: ["name", "restaurantId", "price", "ratingAvg"],
    });
    const result = await queryBuilder
        .search()
        .filter()
        .where({
        restaurant: {
            isDeleted: false,
            createdByUserId: userId,
        },
    })
        .include({
        restaurant: {
            select: {
                id: true,
                name: true,
                city: true,
                state: true,
            },
        },
        dishTags: {
            select: {
                tag: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        },
        reviews: {
            select: {
                id: true,
                rating: true,
                comment: true,
            },
        },
    })
        .paginate()
        .sort()
        .execute();
    return result;
};
const getTrendingDishes = async () => {
    const result = await prisma.dish.findMany({
        where: {
            ratingAvg: {
                gt: 2.5,
            },
            restaurant: {
                isDeleted: false,
            },
        },
        orderBy: [
            {
                totalReviews: "desc",
            },
            {
                ratingAvg: "desc",
            },
            {
                createdAt: "desc",
            },
        ],
        take: 10,
        include: {
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    city: true,
                    state: true,
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
const getTrendingDishesByRestaurant = async (restaurantId) => {
    const restaurant = await prisma.restaurant.findFirst({
        where: {
            id: restaurantId,
            isDeleted: false,
        },
        select: {
            id: true,
            name: true,
        },
    });
    if (!restaurant) {
        throw new AppError(status.NOT_FOUND, "Restaurant not found");
    }
    const result = await prisma.dish.findMany({
        where: {
            restaurantId,
            ratingAvg: {
                gt: 2.5,
            },
            restaurant: {
                isDeleted: false,
            },
        },
        orderBy: [
            {
                totalReviews: "desc",
            },
            {
                ratingAvg: "desc",
            },
            {
                createdAt: "desc",
            },
        ],
        take: 10,
        include: {
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    city: true,
                    state: true,
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
    return {
        restaurant,
        dishes: result,
    };
};
const updateDish = async (id, payload, requester) => {
    await assertCanMutateDish(id, requester);
    if (payload.restaurantId) {
        throw new AppError(status.BAD_REQUEST, "Dish restaurant cannot be changed");
    }
    // If a new image is provided, delete the old image from Cloudinary
    if (payload.image) {
        const existingDish = await prisma.dish.findFirst({
            where: { id },
            select: { image: true },
        });
        if (existingDish?.image) {
            try {
                await deleteFileCloudinary(existingDish.image);
            }
            catch (error) {
                console.error("Error deleting old image from Cloudinary:", error);
                // Continue with update even if deletion fails
            }
        }
    }
    return await prisma.dish.update({
        where: { id },
        data: payload,
    });
};
const deleteDish = async (id, requester) => {
    await assertCanMutateDish(id, requester);
    // Fetch the dish to get the image URL
    const dish = await prisma.dish.findFirst({
        where: { id },
        select: { image: true },
    });
    // Delete the image from Cloudinary if it exists
    if (dish?.image) {
        try {
            await deleteFileCloudinary(dish.image);
        }
        catch (error) {
            console.error("Error deleting image from Cloudinary:", error);
            // Continue with delete even if image deletion fails
        }
    }
    return await prisma.dish.delete({
        where: { id },
    });
};
export const DishService = {
    createDish,
    getDishes,
    getDishById,
    getDishesByUserId,
    getTrendingDishes,
    getTrendingDishesByRestaurant,
    updateDish,
    deleteDish,
};
