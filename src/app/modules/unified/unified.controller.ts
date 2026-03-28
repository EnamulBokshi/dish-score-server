import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import { sendResponse } from "../../helpers/sendResponse";
import { UnifiedService } from "./unified.service";

const createRestaurantDishReview = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const files = (req.files as Record<string, Express.Multer.File[]>) || {};

  const restaurantImages = (files.restaurantImages || []).map((file) => file.path);
  const dishImages = (files.dishImages || []).map((file) => file.path);
  const reviewImages = (files.reviewImages || []).map((file) => file.path);

  const preparedPayload = {
    ...payload,
    restaurant: {
      ...payload.restaurant,
      images:
        restaurantImages.length > 0
          ? restaurantImages
          : (payload.restaurant?.images ?? []),
    },
    dish: {
      ...payload.dish,
      images: dishImages.length > 0 ? dishImages : (payload.dish?.images ?? []),
    },
    review: {
      ...payload.review,
      images:
        reviewImages.length > 0 ? reviewImages : (payload.review?.images ?? []),
    },
  };

  const result = await UnifiedService.createRestaurantDishReview(preparedPayload, req.user);

  sendResponse(res, {
    httpStatusCode: 201,
    success: true,
    data: result,
    message: "Restaurant, dish and review created successfully",
  });
});

export const UnifiedController = {
  createRestaurantDishReview,
};
