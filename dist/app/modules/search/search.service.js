import prisma from "../../lib/prisma";
const toPositiveInt = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};
const toSortOrder = (value) => {
    if (value === "asc")
        return "asc";
    return "desc";
};
const includesTerm = (value, term) => {
    if (typeof value !== "string")
        return false;
    return value.toLowerCase().includes(term);
};
const paginateArray = (data, page, limit) => {
    const skip = (page - 1) * limit;
    return data.slice(skip, skip + limit);
};
const shouldInclude = (scope, target) => {
    return scope === "all" || scope === target;
};
const matchesRestaurantSearchTerm = (item, term) => {
    return (includesTerm(item.name, term) ||
        includesTerm(item.description, term) ||
        includesTerm(item.address, term) ||
        includesTerm(item.city, term) ||
        includesTerm(item.state, term) ||
        includesTerm(item.road, term) ||
        item.tags.some((tag) => includesTerm(tag, term)));
};
const matchesDishSearchTerm = (item, term) => {
    return (includesTerm(item.name, term) ||
        includesTerm(item.description, term) ||
        includesTerm(item.restaurantName, term) ||
        item.tags.some((tag) => includesTerm(tag, term)) ||
        item.ingredients.some((ingredient) => includesTerm(ingredient, term)) ||
        item.reviewComments.some((comment) => includesTerm(comment, term)));
};
const matchesReviewSearchTerm = (item, term) => {
    return (includesTerm(item.comment, term) ||
        includesTerm(item.userName, term) ||
        includesTerm(item.restaurantName, term) ||
        includesTerm(item.dishName, term) ||
        item.tags.some((tag) => includesTerm(tag, term)));
};
const getGlobalSearchResults = async (query) => {
    const rawSearchTerm = typeof query.searchTerm === "string" ? query.searchTerm.trim() : "";
    const normalizedSearchTerm = rawSearchTerm.toLowerCase();
    const restaurantId = typeof query.restaurantId === "string" ? query.restaurantId.trim() : undefined;
    const scopeRaw = typeof query.scope === "string" ? query.scope.toLowerCase() : "all";
    const scope = ["all", "restaurants", "dishes", "reviews"].includes(scopeRaw)
        ? scopeRaw
        : "all";
    const page = toPositiveInt(query.page, 1);
    const limit = toPositiveInt(query.limit, 10);
    const sortOrder = toSortOrder(query.sortOrder);
    const restaurantWhere = {
        isDeleted: false,
        ...(restaurantId ? { id: restaurantId } : {}),
        ...(rawSearchTerm
            ? {
                OR: [
                    { name: { contains: rawSearchTerm, mode: "insensitive" } },
                    { description: { contains: rawSearchTerm, mode: "insensitive" } },
                    { address: { contains: rawSearchTerm, mode: "insensitive" } },
                    { city: { contains: rawSearchTerm, mode: "insensitive" } },
                    { state: { contains: rawSearchTerm, mode: "insensitive" } },
                    { road: { contains: rawSearchTerm, mode: "insensitive" } },
                    { tags: { has: rawSearchTerm } },
                ],
            }
            : {}),
    };
    const dishWhere = {
        restaurant: {
            isDeleted: false,
            ...(restaurantId ? { id: restaurantId } : {}),
        },
        ...(rawSearchTerm
            ? {
                OR: [
                    { name: { contains: rawSearchTerm, mode: "insensitive" } },
                    { description: { contains: rawSearchTerm, mode: "insensitive" } },
                    { restaurant: { name: { contains: rawSearchTerm, mode: "insensitive" } } },
                    { reviews: { some: { comment: { contains: rawSearchTerm, mode: "insensitive" } } } },
                    { tags: { has: rawSearchTerm } },
                    { ingredients: { has: rawSearchTerm } },
                ],
            }
            : {}),
    };
    const reviewWhere = {
        restaurant: {
            isDeleted: false,
            ...(restaurantId ? { id: restaurantId } : {}),
        },
        ...(rawSearchTerm
            ? {
                OR: [
                    { comment: { contains: rawSearchTerm, mode: "insensitive" } },
                    { user: { name: { contains: rawSearchTerm, mode: "insensitive" } } },
                    { restaurant: { name: { contains: rawSearchTerm, mode: "insensitive" } } },
                    { dish: { name: { contains: rawSearchTerm, mode: "insensitive" } } },
                    { tags: { has: rawSearchTerm } },
                ],
            }
            : {}),
    };
    if (normalizedSearchTerm) {
        const restaurantsPromise = shouldInclude(scope, "restaurants")
            ? prisma.restaurant.findMany({
                where: { isDeleted: false, ...(restaurantId ? { id: restaurantId } : {}) },
                orderBy: { createdAt: sortOrder },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    address: true,
                    city: true,
                    state: true,
                    road: true,
                    tags: true,
                    ratingAvg: true,
                    totalReviews: true,
                    createdAt: true,
                },
            })
            : Promise.resolve([]);
        const dishesPromise = shouldInclude(scope, "dishes")
            ? prisma.dish.findMany({
                where: {
                    restaurant: {
                        isDeleted: false,
                        ...(restaurantId ? { id: restaurantId } : {}),
                    },
                },
                orderBy: { createdAt: sortOrder },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    ingredients: true,
                    tags: true,
                    price: true,
                    ratingAvg: true,
                    totalReviews: true,
                    createdAt: true,
                    restaurant: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    reviews: {
                        select: {
                            comment: true,
                        },
                    },
                },
            })
            : Promise.resolve([]);
        const reviewsPromise = shouldInclude(scope, "reviews")
            ? prisma.review.findMany({
                where: {
                    restaurant: {
                        isDeleted: false,
                        ...(restaurantId ? { id: restaurantId } : {}),
                    },
                },
                orderBy: { createdAt: sortOrder },
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    tags: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    restaurant: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    dish: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            })
            : Promise.resolve([]);
        const [restaurantsRaw, dishesRaw, reviewsRaw] = await Promise.all([
            restaurantsPromise,
            dishesPromise,
            reviewsPromise,
        ]);
        const filteredRestaurants = restaurantsRaw.filter((item) => matchesRestaurantSearchTerm({
            name: item.name,
            description: item.description,
            address: item.address,
            city: item.city,
            state: item.state,
            road: item.road,
            tags: item.tags,
        }, normalizedSearchTerm));
        const filteredDishes = dishesRaw.filter((item) => matchesDishSearchTerm({
            name: item.name,
            description: item.description,
            restaurantName: item.restaurant.name,
            tags: item.tags,
            ingredients: item.ingredients,
            reviewComments: item.reviews.map((review) => review.comment),
        }, normalizedSearchTerm));
        const filteredReviews = reviewsRaw.filter((item) => matchesReviewSearchTerm({
            comment: item.comment,
            userName: item.user.name,
            restaurantName: item.restaurant.name,
            dishName: item.dish?.name ?? null,
            tags: item.tags,
        }, normalizedSearchTerm));
        const paginatedRestaurants = paginateArray(filteredRestaurants, page, limit).map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            city: item.city,
            state: item.state,
            road: item.road,
            tags: item.tags,
            ratingAvg: item.ratingAvg,
            totalReviews: item.totalReviews,
            createdAt: item.createdAt,
        }));
        const paginatedDishes = paginateArray(filteredDishes, page, limit).map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            ingredients: item.ingredients,
            tags: item.tags,
            price: item.price,
            ratingAvg: item.ratingAvg,
            totalReviews: item.totalReviews,
            createdAt: item.createdAt,
            restaurant: item.restaurant,
        }));
        const paginatedReviews = paginateArray(filteredReviews, page, limit);
        const combined = [
            ...paginatedRestaurants.map((item) => ({
                type: "restaurant",
                createdAt: item.createdAt,
                data: item,
            })),
            ...paginatedDishes.map((item) => ({
                type: "dish",
                createdAt: item.createdAt,
                data: item,
            })),
            ...paginatedReviews.map((item) => ({
                type: "review",
                createdAt: item.createdAt,
                data: item,
            })),
        ].sort((a, b) => {
            const delta = a.createdAt.getTime() - b.createdAt.getTime();
            return sortOrder === "asc" ? delta : -delta;
        });
        return {
            searchTerm: rawSearchTerm,
            restaurantId: restaurantId ?? null,
            scope,
            restaurants: {
                total: filteredRestaurants.length,
                data: paginatedRestaurants,
            },
            dishes: {
                total: filteredDishes.length,
                data: paginatedDishes,
            },
            reviews: {
                total: filteredReviews.length,
                data: paginatedReviews,
            },
            combined,
            summary: {
                total: filteredRestaurants.length + filteredDishes.length + filteredReviews.length,
                page,
                limit,
            },
        };
    }
    const skip = (page - 1) * limit;
    const restaurantsPromise = shouldInclude(scope, "restaurants")
        ? Promise.all([
            prisma.restaurant.count({ where: restaurantWhere }),
            prisma.restaurant.findMany({
                where: restaurantWhere,
                orderBy: { createdAt: sortOrder },
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    city: true,
                    state: true,
                    road: true,
                    tags: true,
                    ratingAvg: true,
                    totalReviews: true,
                    createdAt: true,
                },
            }),
        ])
        : Promise.resolve([0, []]);
    const dishesPromise = shouldInclude(scope, "dishes")
        ? Promise.all([
            prisma.dish.count({ where: dishWhere }),
            prisma.dish.findMany({
                where: dishWhere,
                orderBy: { createdAt: sortOrder },
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    ingredients: true,
                    tags: true,
                    price: true,
                    ratingAvg: true,
                    totalReviews: true,
                    createdAt: true,
                    restaurant: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
        ])
        : Promise.resolve([0, []]);
    const reviewsPromise = shouldInclude(scope, "reviews")
        ? Promise.all([
            prisma.review.count({ where: reviewWhere }),
            prisma.review.findMany({
                where: reviewWhere,
                orderBy: { createdAt: sortOrder },
                skip,
                take: limit,
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    tags: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    restaurant: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    dish: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
        ])
        : Promise.resolve([0, []]);
    const [[restaurantTotal, restaurants], [dishTotal, dishes], [reviewTotal, reviews]] = await Promise.all([restaurantsPromise, dishesPromise, reviewsPromise]);
    const combined = [
        ...restaurants.map((item) => ({
            type: "restaurant",
            createdAt: item.createdAt,
            data: item,
        })),
        ...dishes.map((item) => ({
            type: "dish",
            createdAt: item.createdAt,
            data: item,
        })),
        ...reviews.map((item) => ({
            type: "review",
            createdAt: item.createdAt,
            data: item,
        })),
    ].sort((a, b) => {
        const delta = a.createdAt.getTime() - b.createdAt.getTime();
        return sortOrder === "asc" ? delta : -delta;
    });
    return {
        searchTerm: rawSearchTerm,
        restaurantId: restaurantId ?? null,
        scope,
        restaurants: {
            total: restaurantTotal,
            data: restaurants,
        },
        dishes: {
            total: dishTotal,
            data: dishes,
        },
        reviews: {
            total: reviewTotal,
            data: reviews,
        },
        combined,
        summary: {
            total: restaurantTotal + dishTotal + reviewTotal,
            page,
            limit,
        },
    };
};
export const SearchService = {
    getGlobalSearchResults,
};
