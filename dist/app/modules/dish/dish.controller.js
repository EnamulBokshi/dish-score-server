import catchAsync from "../../helpers/catchAsync";
import { sendResponse } from "../../helpers/sendResponse";
import { DishService } from "./dish.service";
const createDish = catchAsync(async (req, res) => {
    const payload = req.body;
    const result = await DishService.createDish(payload);
    sendResponse(res, {
        httpStatusCode: 201,
        success: true,
        data: result,
        message: "Dish created successfully",
    });
});
const getDishes = catchAsync(async (req, res) => {
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
const updateDish = catchAsync(async (req, res) => {
    const id = req.params.id;
    const payload = req.body;
    const result = await DishService.updateDish(id, payload, req.user);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Dish updated successfully",
    });
});
const deleteDish = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await DishService.deleteDish(id, req.user);
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
