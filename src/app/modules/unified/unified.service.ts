import { Dish, Restaurant } from "../../../generated/prisma/client";
import prisma from "../../lib/prisma";
import { IUnifiedCreatePayload, IUnifiedRequester } from "./unified.interface";

const normalizeReviewImages = (payload: IUnifiedCreatePayload["review"] | undefined) => {
  if (!payload) return [];
  
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

const getDishImage = (payload: IUnifiedCreatePayload["dish"] | undefined) => {
  if (!payload) return undefined;
  
  if (payload.images && payload.images.length > 0) {
    return payload.images[0];
  }

  return payload.data?.image;
};

const createRestaurantDishReview = async (
  payload: IUnifiedCreatePayload,
  requester: IUnifiedRequester,
) => {
  const { restaurantId, restaurant, dishId, dish, review } = payload;

  const result = await prisma.$transaction(async (tx) => {
    // Handle restaurant: use existing ID or create new
    let resId: string;
    let createdRestaurant: Restaurant;
    if (restaurantId) {
      const existingRestaurant = await tx.restaurant.findUnique({
        where: { id: restaurantId, isDeleted: false },
      });
      if (!existingRestaurant) {
        throw new Error(`Restaurant with ID ${restaurantId} not found or is deleted`);
      }
      resId = restaurantId;
      createdRestaurant = existingRestaurant;
    } else {
      const restaurantData = restaurant!.data!;
      createdRestaurant = await tx.restaurant.create({
        data: {
          name: restaurantData.name,
          address: restaurantData.address,
          city: restaurantData.city,
          state: restaurantData.state,
          road: restaurantData.road,
          location: restaurantData.location,
          description: restaurantData.description ?? "",
          contact: restaurantData.contact,
          tags: restaurantData.tags ?? [],
          images: restaurant?.images ?? [],
          createdByUserId: requester.userId,
        },
      });
      resId = createdRestaurant.id;
    }

    // Handle dish: use existing ID or create new
    let dishIdFinal: string;
    let createdDish: Dish;
    if (dishId) {
      const existingDish = await tx.dish.findUnique({
        where: { id: dishId },
        include: { restaurant: { select: { isDeleted: true } } },
      });
      if (!existingDish || existingDish.restaurant.isDeleted) {
        throw new Error(`Dish with ID ${dishId} not found or belongs to deleted restaurant`);
      }
      if (existingDish.restaurantId !== resId) {
        throw new Error(`Dish with ID ${dishId} does not belong to the specified restaurant`);
      }
      dishIdFinal = dishId;
      createdDish = existingDish;
    } else {
      const dishData = dish!.data!;
      createdDish = await tx.dish.create({
        data: {
          name: dishData.name,
          ingredients: dishData.ingredients ?? [],
          description: dishData.description ?? "",
          price: dishData.price,
          tags: dishData.tags ?? [],
          image: getDishImage(dish!),
          restaurantId: resId,
        },
      });
      dishIdFinal = createdDish.id;
    }

    // Create review
    const createdReview = await tx.review.create({
      data: {
        ...review.data,
        images: normalizeReviewImages(review),
        restaurantId: resId,
        dishId: dishIdFinal,
        userId: requester.userId,
      },
    });

    // Recalculate restaurant ratings from all reviews
    const restaurantReviews = await tx.review.findMany({
      where: { restaurantId: resId },
      select: { rating: true },
    });
    const restAvgRating =
      restaurantReviews.length > 0
        ? restaurantReviews.reduce((sum, r) => sum + r.rating, 0) / restaurantReviews.length
        : 0;

    await tx.restaurant.update({
      where: { id: resId },
      data: {
        ratingAvg: restAvgRating,
        totalReviews: restaurantReviews.length,
      },
    });

    // Recalculate dish ratings from all reviews
    const dishReviews = await tx.review.findMany({
      where: { dishId: dishIdFinal },
      select: { rating: true },
    });
    const dishAvgRating =
      dishReviews.length > 0
        ? dishReviews.reduce((sum, r) => sum + r.rating, 0) / dishReviews.length
        : 0;

    await tx.dish.update({
      where: { id: dishIdFinal },
      data: {
        ratingAvg: dishAvgRating,
        totalReviews: dishReviews.length,
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
