import status from "http-status";
import { UserRole } from "../../../generated/prisma/enums";
import AppError from "../../helpers/errorHelpers/AppError";
import prisma from "../../lib/prisma";
const buildRatingWiseBarChart = (ratings) => {
    const buckets = new Map();
    for (let rating = 0; rating <= 5; rating += 1) {
        buckets.set(rating, 0);
    }
    ratings.forEach((rating) => {
        const safeRating = Number.isFinite(rating) ? rating : 0;
        const bucket = Math.max(0, Math.min(5, Math.round(safeRating)));
        buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([rating, count]) => ({
        rating,
        count,
    }));
};
const getMonthlyReviewCreations = async () => {
    const data = await prisma.$queryRaw `
    SELECT DATE_TRUNC('month', "createdAt") AS month,
           CAST(COUNT(*) AS INTEGER) AS count
    FROM "Review"
    GROUP BY month
    ORDER BY month ASC;
  `;
    return data.map((item) => ({
        month: item.month.toISOString().slice(0, 7),
        count: Number(item.count),
    }));
};
const getMonthlyUserRegistration = async () => {
    const data = await prisma.$queryRaw `
    SELECT DATE_TRUNC('month', "createdAt") AS month,
           CAST(COUNT(*) AS INTEGER) AS count
    FROM "user"
    GROUP BY month
    ORDER BY month ASC;
  `;
    return data.map((item) => ({
        month: item.month.toISOString().slice(0, 7),
        count: Number(item.count),
    }));
};
const getConsumerStatsData = async (user) => {
    const [totalReviewsWritten, totalLikes, totalDishes, totalRestaurants, likeWiseReviews,] = await Promise.all([
        prisma.review.count({
            where: {
                userId: user.userId,
            },
        }),
        prisma.like.count({
            where: {
                review: {
                    userId: user.userId,
                },
            },
        }),
        prisma.dish.count({
            where: {
                restaurant: {
                    isDeleted: false,
                    createdByUserId: user.userId,
                },
            },
        }),
        prisma.restaurant.count({
            where: {
                isDeleted: false,
                createdByUserId: user.userId,
            },
        }),
        prisma.review.findMany({
            where: {
                userId: user.userId,
            },
            select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
                _count: {
                    select: {
                        likes: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        }),
    ]);
    return {
        totalReviewsWritten,
        totalLikes,
        totalDishes,
        totalRestaurants,
        likeWiseReviews: likeWiseReviews.map((review) => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            likeCount: review._count.likes,
        })),
    };
};
const getAdminStatsData = async () => {
    const [groupedUsers, totalReviews, totalRestaurants, restaurantRatings, dishRatings, monthlyReviewCreations, monthlyUserRegistration,] = await Promise.all([
        prisma.user.groupBy({
            by: ["role"],
            _count: {
                _all: true,
            },
            where: {
                isDeleted: false,
            },
        }),
        prisma.review.count(),
        prisma.restaurant.count({
            where: {
                isDeleted: false,
            },
        }),
        prisma.restaurant.findMany({
            where: {
                isDeleted: false,
            },
            select: {
                ratingAvg: true,
            },
        }),
        prisma.dish.findMany({
            where: {
                restaurant: {
                    isDeleted: false,
                },
            },
            select: {
                ratingAvg: true,
            },
        }),
        getMonthlyReviewCreations(),
        getMonthlyUserRegistration(),
    ]);
    const roleCountMap = groupedUsers.reduce((acc, item) => {
        acc[item.role] = item._count._all;
        return acc;
    }, {});
    return {
        userStats: {
            totalAdmin: roleCountMap[UserRole.ADMIN] ?? 0,
            totalConsumer: roleCountMap[UserRole.CONSUMER] ?? 0,
            totalOwner: roleCountMap[UserRole.OWNER] ?? 0,
            totalSuperAdmin: roleCountMap[UserRole.SUPER_ADMIN] ?? 0,
        },
        totalReviews,
        totalRestaurants,
        ratingWiseRestaurantBarChart: buildRatingWiseBarChart(restaurantRatings.map((item) => item.ratingAvg)),
        ratingWiseDishBarChart: buildRatingWiseBarChart(dishRatings.map((item) => item.ratingAvg)),
        monthlyReviewCreations,
        monthlyUserRegistration,
    };
};
const getOwnerStatsData = async (user) => {
    const [totalDishes, avgRatingResult, dishRatings] = await Promise.all([
        prisma.dish.count({
            where: {
                restaurant: {
                    createdByUserId: user.userId,
                    isDeleted: false,
                },
            },
        }),
        prisma.dish.aggregate({
            where: {
                restaurant: {
                    createdByUserId: user.userId,
                    isDeleted: false,
                },
            },
            _avg: {
                ratingAvg: true,
            },
        }),
        prisma.dish.findMany({
            where: {
                restaurant: {
                    createdByUserId: user.userId,
                    isDeleted: false,
                },
            },
            select: {
                ratingAvg: true,
            },
        }),
    ]);
    return {
        totalDishes,
        avgRating: avgRatingResult._avg.ratingAvg ?? 0,
        ratingWiseDishesBarChart: buildRatingWiseBarChart(dishRatings.map((item) => item.ratingAvg)),
    };
};
const getDashboardStats = async (user) => {
    let statsData;
    switch (user.role) {
        case UserRole.SUPER_ADMIN:
            statsData = getAdminStatsData();
            break;
        case UserRole.ADMIN:
            statsData = getAdminStatsData();
            break;
        case UserRole.OWNER:
            statsData = getOwnerStatsData(user);
            break;
        case UserRole.CONSUMER:
            statsData = getConsumerStatsData(user);
            break;
        default:
            throw new AppError(status.BAD_REQUEST, "Invalid user role");
    }
    return statsData;
};
const getPublicStats = async () => {
    const [totalReviews, totalReviewer, totalRestaurants, totalDishes] = await Promise.all([
        prisma.review.count(),
        prisma.user.count({
            where: {
                role: UserRole.CONSUMER,
                isDeleted: false,
            },
        }),
        prisma.restaurant.count({
            where: {
                isDeleted: false,
            },
        }),
        prisma.dish.count({
            where: {
                restaurant: {
                    isDeleted: false,
                },
            },
        }),
    ]);
    return {
        totalReviews,
        totalReviewer,
        totalRestaurants,
        totalDishes,
    };
};
export const StatsService = {
    getDashboardStats,
    getPublicStats,
};
