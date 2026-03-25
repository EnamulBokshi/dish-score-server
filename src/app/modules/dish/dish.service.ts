import status from "http-status";
import { Dish, Prisma } from "../../../generated/prisma/client";
import { UserRole } from "../../../generated/prisma/enums";
import { IQueryParams } from "../../../interfaces/query.interfaces";
import AppError from "../../helpers/errorHelpers/AppError";
import prisma from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { ICreateDishPayload, IUpdateDishPayload } from "./dish.interface";

interface IDishRequester {
  userId: string;
  role: UserRole;
}

const assertCanMutateDish = async (dishId: string, requester: IDishRequester) => {
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

const createDish = async (payload: ICreateDishPayload) => {
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

const getDishes = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<Dish, Prisma.DishWhereInput, Prisma.DishInclude>(
    prisma.dish,
    query,
    {
      searchableFields: ["name", "description", "restaurant.name"],
      filterableFields: ["name", "restaurantId", "price", "ratingAvg"],
    },
  );

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

const updateDish = async (
  id: string,
  payload: IUpdateDishPayload & { restaurantId?: string },
  requester: IDishRequester,
) => {
  await assertCanMutateDish(id, requester);

  if (payload.restaurantId) {
    throw new AppError(status.BAD_REQUEST, "Dish restaurant cannot be changed");
  }

  return await prisma.dish.update({
    where: { id },
    data: payload,
  });
};

const deleteDish = async (id: string, requester: IDishRequester) => {
  await assertCanMutateDish(id, requester);

  return await prisma.dish.delete({
    where: { id },
  });
};

export const DishService = {
  createDish,
  getDishes,
  updateDish,
  deleteDish,
};
