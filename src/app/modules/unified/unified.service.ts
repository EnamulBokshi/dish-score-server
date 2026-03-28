import prisma from "../../lib/prisma";
import { IUnifiedCreatePayload, IUnifiedRequester } from "./unified.interface";

const normalizeReviewImages = (payload: IUnifiedCreatePayload["review"]) => {
  if (payload.images && payload.images.length > 0) {
    return payload.images;
  }

  if (Array.isArray(payload.image)) {
    return payload.image;
  }

  if (typeof payload.image === "string" && payload.image.length > 0) {
    return [payload.image];
  }

  return [];
};

const getDishImage = (payload: IUnifiedCreatePayload["dish"]) => {
  if (payload.images && payload.images.length > 0) {
    return payload.images[0];
  }

  return payload.data.image;
};

const createRestaurantDishReview = async (
  payload: IUnifiedCreatePayload,
  requester: IUnifiedRequester,
) => {
  const { restaurant, dish, review } = payload;

  const result = await prisma.$transaction(async (tx) => {
    const createdRestaurant = await tx.restaurant.create({
      data: {
        ...restaurant.data,
        images: restaurant.images ?? [],
        createdByUserId: requester.userId,
      },
    });

    const createdDish = await tx.dish.create({
      data: {
        ...dish.data,
        image: getDishImage(dish),
        restaurantId: createdRestaurant.id,
      },
    });

    const createdReview = await tx.review.create({
      data: {
        ...review.data,
        images: normalizeReviewImages(review),
        restaurantId: createdRestaurant.id,
        dishId: createdDish.id,
        userId: requester.userId,
      },
    });

    await tx.restaurant.update({
      where: { id: createdRestaurant.id },
      data: {
        ratingAvg: createdReview.rating,
        totalReviews: 1,
      },
    });

    await tx.dish.update({
      where: { id: createdDish.id },
      data: {
        ratingAvg: createdReview.rating,
        totalReviews: 1,
      },
    });

    return {
      restaurant: createdRestaurant,
      dish: createdDish,
      review: createdReview,
    };
  });

  return result;
};

export const UnifiedService = {
  createRestaurantDishReview,
};
