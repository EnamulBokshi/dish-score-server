import status from "http-status";
import { UserRole } from "../../../generated/prisma/enums";
import AppError from "../../helpers/errorHelpers/AppError";
import prisma from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
const recalculateRestaurantRatings = async (restaurantId) => {
    const reviewAggregate = await prisma.review.aggregate({
        where: { restaurantId },
        _avg: { rating: true },
        _count: { id: true },
    });
    await prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
            ratingAvg: reviewAggregate._avg.rating ?? 0,
            totalReviews: reviewAggregate._count.id,
        },
    });
};
const recalculateDishRatings = async (dishId) => {
    const reviewAggregate = await prisma.review.aggregate({
        where: { dishId },
        _avg: { rating: true },
        _count: { id: true },
    });
    await prisma.dish.update({
        where: { id: dishId },
        data: {
            ratingAvg: reviewAggregate._avg.rating ?? 0,
            totalReviews: reviewAggregate._count.id,
        },
    });
};
const assertCanMutateReview = async (reviewId, requester) => {
    const review = await prisma.review.findUnique({
        where: { id: reviewId },
        select: {
            id: true,
            userId: true,
            restaurantId: true,
            dishId: true,
        },
    });
    if (!review) {
        throw new AppError(status.NOT_FOUND, "Review not found");
    }
    const isAdmin = requester.role === UserRole.ADMIN || requester.role === UserRole.SUPER_ADMIN;
    if (isAdmin || review.userId === requester.userId) {
        return review;
    }
    throw new AppError(status.FORBIDDEN, "You can only modify your own reviews");
};
const createReview = async (payload, requester) => {
    const restaurant = await prisma.restaurant.findFirst({
        where: {
            id: payload.restaurantId,
            isDeleted: false,
        },
        select: { id: true },
    });
    if (!restaurant) {
        throw new AppError(status.NOT_FOUND, "Restaurant not found");
    }
    if (payload.dishId) {
        const dish = await prisma.dish.findFirst({
            where: {
                id: payload.dishId,
                restaurantId: payload.restaurantId,
            },
            select: { id: true },
        });
        if (!dish) {
            throw new AppError(status.BAD_REQUEST, "Dish must belong to the selected restaurant");
        }
    }
    const result = await prisma.review.create({
        data: {
            rating: payload.rating,
            comment: payload.comment,
            images: payload.images ?? [],
            restaurantId: payload.restaurantId,
            dishId: payload.dishId,
            userId: requester.userId,
        },
    });
    await recalculateRestaurantRatings(payload.restaurantId);
    if (payload.dishId) {
        await recalculateDishRatings(payload.dishId);
    }
    return result;
};
const getReviews = async (query) => {
    const queryBuilder = new QueryBuilder(prisma.review, query, {
        searchableFields: ["comment", "user.name", "restaurant.name", "dish.name"],
        filterableFields: ["restaurantId", "dishId", "userId", "rating"],
    });
    const result = await queryBuilder
        .search()
        .filter()
        .include({
        user: {
            select: {
                id: true,
                name: true,
                email: true,
            },
        },
        restaurant: {
            select: {
                id: true,
                name: true,
                city: true,
                state: true,
            },
        },
        dish: {
            select: {
                id: true,
                name: true,
                restaurantId: true,
            },
        },
        likes: {
            select: {
                id: true,
                userId: true,
            },
        },
    })
        .paginate()
        .sort()
        .execute();
    return result;
};
const updateReview = async (id, payload, requester) => {
    const review = await assertCanMutateReview(id, requester);
    if (payload.userId || payload.restaurantId || payload.dishId) {
        throw new AppError(status.BAD_REQUEST, "Review ownership and target references cannot be changed");
    }
    const result = await prisma.review.update({
        where: { id },
        data: payload,
    });
    await recalculateRestaurantRatings(review.restaurantId);
    if (review.dishId) {
        await recalculateDishRatings(review.dishId);
    }
    return result;
};
const deleteReview = async (id, requester) => {
    const review = await assertCanMutateReview(id, requester);
    const result = await prisma.review.delete({
        where: { id },
    });
    await recalculateRestaurantRatings(review.restaurantId);
    if (review.dishId) {
        await recalculateDishRatings(review.dishId);
    }
    return result;
};
export const ReviewService = {
    createReview,
    getReviews,
    updateReview,
    deleteReview,
};
