import status from "http-status";
import { Like, Prisma, UserRole } from "../../../generated/prisma/client";
import { IQueryParams } from "../../../interfaces/query.interfaces";
import AppError from "../../helpers/errorHelpers/AppError";
import prisma from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { ICreateLikePayload } from "./like.interface";

interface ILikeRequester {
  userId: string;
  role: UserRole;
}

const assertReviewExists = async (reviewId: string) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true },
  });

  if (!review) {
    throw new AppError(status.NOT_FOUND, "Review not found");
  }
};

const createLike = async (payload: ICreateLikePayload, requester: ILikeRequester) => {
  await assertReviewExists(payload.reviewId);

  const existingLike = await prisma.like.findUnique({
    where: {
      userId_reviewId: {
        userId: requester.userId,
        reviewId: payload.reviewId,
      },
    },
  });

  if (existingLike) {
    throw new AppError(status.BAD_REQUEST, "You have already liked this review");
  }

  const result = await prisma.like.create({
    data: {
      userId: requester.userId,
      reviewId: payload.reviewId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      review: {
        select: {
          id: true,
          rating: true,
          comment: true,
          restaurantId: true,
          dishId: true,
        },
      },
    },
  });

  return result;
};

const toggleLike = async (payload: ICreateLikePayload, requester: ILikeRequester) => {
  await assertReviewExists(payload.reviewId);

  const existingLike = await prisma.like.findUnique({
    where: {
      userId_reviewId: {
        userId: requester.userId,
        reviewId: payload.reviewId,
      },
    },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: { id: existingLike.id },
    });

    const totalLikes = await prisma.like.count({
      where: { reviewId: payload.reviewId },
    });

    return {
      action: "UNLIKED",
      liked: false,
      reviewId: payload.reviewId,
      totalLikes,
    };
  }

  const createdLike = await prisma.like.create({
    data: {
      userId: requester.userId,
      reviewId: payload.reviewId,
    },
  });

  const totalLikes = await prisma.like.count({
    where: { reviewId: payload.reviewId },
  });

  return {
    action: "LIKED",
    liked: true,
    reviewId: payload.reviewId,
    totalLikes,
    like: createdLike,
  };
};

const getLikes = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<Like, Prisma.LikeWhereInput, Prisma.LikeInclude>(
    prisma.like,
    query,
    {
      searchableFields: ["id", "user.name", "user.email", "review.comment"],
      filterableFields: ["id", "userId", "reviewId"],
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
      review: {
        select: {
          id: true,
          rating: true,
          comment: true,
          restaurantId: true,
          dishId: true,
        },
      },
    })
    .paginate()
    .sort()
    .execute();

  return result;
};

const getReviewLikeSummary = async (reviewId: string) => {
  await assertReviewExists(reviewId);

  const totalLikes = await prisma.like.count({
    where: { reviewId },
  });

  return {
    reviewId,
    totalLikes,
  };
};

const deleteLike = async (reviewId: string, requester: ILikeRequester) => {
  const existingLike = await prisma.like.findUnique({
    where: {
      userId_reviewId: {
        userId: requester.userId,
        reviewId,
      },
    },
  });

  if (!existingLike) {
    throw new AppError(status.NOT_FOUND, "Like not found for this user and review");
  }

  const result = await prisma.like.delete({
    where: { id: existingLike.id },
  });

  return result;
};

export const LikeService = {
  createLike,
  toggleLike,
  getLikes,
  getReviewLikeSummary,
  deleteLike,
};
