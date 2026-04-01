import catchAsync from "../../helpers/catchAsync";
import { sendResponse } from "../../helpers/sendResponse";
import { DishService } from "./dish.service";
const createDish = catchAsync(async (req, res) => {
    const payload = req.body.data ? JSON.parse(req.body.data) : req.body;
    const filePath = req.file?.path;
    const result = await DishService.createDish({ ...payload, ...(filePath && { image: filePath }) });
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
const getDishById = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await DishService.getDishById(id);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Dish retrieved successfully",
    });
});
const getMyDishes = catchAsync(async (req, res) => {
    const query = req.query;
    const result = await DishService.getDishesByUserId(req.user.userId, query);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result.data,
        meta: result.meta,
        message: "My dishes retrieved successfully",
    });
});
const getTrendingDishes = catchAsync(async (_req, res) => {
    const result = await DishService.getTrendingDishes();
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Trending dishes retrieved successfully",
    });
});
const getTrendingDishesByRestaurant = catchAsync(async (req, res) => {
    const restaurantId = req.params.restaurantId;
    const result = await DishService.getTrendingDishesByRestaurant(restaurantId);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Restaurant trending dishes retrieved successfully",
    });
});
const updateDish = catchAsync(async (req, res) => {
    const id = req.params.id;
    const payload = req.body.data ? JSON.parse(req.body.data) : req.body;
    const filePath = req.file?.path;
    const result = await DishService.updateDish(id, { ...payload, ...(filePath && { image: filePath }) }, req.user);
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
const updateMyDish = catchAsync(async (req, res) => {
    const id = req.params.id;
    const payload = req.body.data ? JSON.parse(req.body.data) : req.body;
    const filePath = req.file?.path;
    const result = await DishService.updateDish(id, { ...payload, ...(filePath && { image: filePath }) }, req.user);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "My dish updated successfully",
    });
});
const deleteMyDish = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await DishService.deleteDish(id, req.user);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "My dish deleted successfully",
    });
});
export const DishController = {
    createDish,
    getDishes,
    getDishById,
    getMyDishes,
    getTrendingDishes,
    getTrendingDishesByRestaurant,
    updateDish,
    deleteDish,
    updateMyDish,
    deleteMyDish,
};
