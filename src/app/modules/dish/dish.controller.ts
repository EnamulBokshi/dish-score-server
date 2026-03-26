import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import { sendResponse } from "../../helpers/sendResponse";
import { DishService } from "./dish.service";

const createDish = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const filePath = req.file?.path;

  const result = await DishService.createDish({...payload, image: filePath});
  sendResponse(res, {
    httpStatusCode: 201,
    success: true,
    data: result,
    message: "Dish created successfully",
  });
});

const getDishes = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await DishService.getDishes(query);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result.data,
    meta: result.meta,
    message: "Dishes retrieved successfully",
  });
});

const updateDish = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const payload = req.body;
  const filePath = req.file?.path;

  const result = await DishService.updateDish(
    id as string,
    { ...payload, ...(filePath && { image: filePath }) },
    req.user
  );

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "Dish updated successfully",
  });
});

const deleteDish = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await DishService.deleteDish(id as string, req.user);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "Dish deleted successfully",
  });
});

export const DishController = {
  createDish,
  getDishes,
  updateDish,
  deleteDish,
};
