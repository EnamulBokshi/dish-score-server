import status from "http-status";
import { Prisma, Review } from "../../../generated/prisma/client";
import { UserRole } from "../../../generated/prisma/enums";
import { IQueryParams } from "../../../interfaces/query.interfaces";
import AppError from "../../helpers/errorHelpers/AppError";
import { deleteFileCloudinary } from "../../../config/cloudinary";
import prisma from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { ICreateReviewPayload, IUpdateReviewPayload } from "./review.interface";

interface IReviewRequester {
  userId: string;
  role: UserRole;
}

const recalculateRestaurantRatings = async (restaurantId: string) => {
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

const recalculateDishRatings = async (dishId: string) => {
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

const assertCanMutateReview = async (reviewId: string, requester: IReviewRequester) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      userId: true,
      restaurantId: true,
      dishId: true,
      images: true,
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

const createReview = async (payload: ICreateReviewPayload, requester: IReviewRequester) => {
  const { tagIds, ...reviewData } = payload;

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
      rating: reviewData.rating,
      comment: reviewData.comment,
      images: reviewData.images ?? [],
      restaurantId: reviewData.restaurantId,
      dishId: reviewData.dishId,
      userId: requester.userId,
    },
  });

  // Create review tags if tagIds are provided
  if (tagIds && tagIds.length > 0) {
    await prisma.reviewTag.createMany({
      data: tagIds.map(tagId => ({
        reviewId: result.id,
        tagId,
      })),
      skipDuplicates: true,
    });
  }

  await recalculateRestaurantRatings(payload.restaurantId);
  if (payload.dishId) {
    await recalculateDishRatings(payload.dishId);
  }

  return result;
};

const getReviews = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<Review, Prisma.ReviewWhereInput, Prisma.ReviewInclude>(
    prisma.review,
    query,
    {
      searchableFields: ["comment", "user.name", "restaurant.name", "dish.name"],
      filterableFields: ["restaurantId", "dishId", "userId", "rating"],
    },
  );

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

const getReviewsByUserId = async (userId: string, query: IQueryParams) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isDeleted: true,
    },
  });

  if (!user || user.isDeleted) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const queryBuilder = new QueryBuilder<Review, Prisma.ReviewWhereInput, Prisma.ReviewInclude>(
    prisma.review,
    query,
    {
      searchableFields: ["comment", "restaurant.name", "dish.name"],
      filterableFields: ["restaurantId", "dishId", "rating"],
    },
  );

  const result = await queryBuilder
    .search()
    .filter()
    .where({ userId })
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

const updateReview = async (id: string, payload: IUpdateReviewPayload & { userId?: string; restaurantId?: string; dishId?: string }, requester: IReviewRequester) => {
  const review = await assertCanMutateReview(id, requester);

  if (payload.userId || payload.restaurantId || payload.dishId) {
    throw new AppError(status.BAD_REQUEST, "Review ownership and target references cannot be changed");
  }

  const { tagIds, ...reviewData } = payload;

  if (reviewData.images && reviewData.images.length > 0) {
    const existingReview = await prisma.review.findUnique({
      where: { id },
      select: { images: true },
    });

    if (existingReview?.images && existingReview.images.length > 0) {
      await Promise.all(
        existingReview.images.map((imageUrl) =>
          deleteFileCloudinary(imageUrl).catch((error) => {
            console.error(`Error deleting image ${imageUrl}:`, error);
          }),
        ),
      );
    }
  }

  const result = await prisma.review.update({
    where: { id },
    data: reviewData,
  });

  // Update tags if tagIds are provided
  if (tagIds) {
    // Delete existing tags
    await prisma.reviewTag.deleteMany({
      where: { reviewId: id },
    });

    // Create new tags
    if (tagIds.length > 0) {
      await prisma.reviewTag.createMany({
        data: tagIds.map(tagId => ({
          reviewId: id,
          tagId,
        })),
        skipDuplicates: true,
      });
    }
  }

  await recalculateRestaurantRatings(review.restaurantId);
  if (review.dishId) {
    await recalculateDishRatings(review.dishId);
  }

  return result;
};

const deleteReview = async (id: string, requester: IReviewRequester) => {
  const review = await assertCanMutateReview(id, requester);

  if (review.images && review.images.length > 0) {
    await Promise.all(
      review.images.map((imageUrl) =>
        deleteFileCloudinary(imageUrl).catch((error) => {
          console.error(`Error deleting image ${imageUrl}:`, error);
        }),
      ),
    );
  }

  const result = await prisma.review.delete({
    where: { id },
  });

  await recalculateRestaurantRatings(review.restaurantId);
  if (review.dishId) {
    await recalculateDishRatings(review.dishId);
  }

  return result;
};

const getReviewById = async (id: string) => {
  const result = await prisma.review.findUnique({
    where: { id },
    include: {
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
    },
  });

  if (!result) {
    throw new AppError(status.NOT_FOUND, "Review not found");
  }

  return result;
};

export const ReviewService = {
  createReview,
  getReviews,
  getReviewById,
  getReviewsByUserId,
  updateReview,
  deleteReview,
};
