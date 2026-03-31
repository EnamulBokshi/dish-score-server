import catchAsync from "../../helpers/catchAsync";
import { RestaurantService } from "./restaurant.service";
import { sendResponse } from "../../helpers/sendResponse";
const createRestaurant = catchAsync(async (req, res) => {
    const payload = req.body;
    const files = req.files || [];
    const imagePaths = files.map((file) => file.path);
    const result = await RestaurantService.createRestaurant({ ...payload, images: imagePaths.length > 0 ? imagePaths : payload.images }, req.user.userId);
    sendResponse(res, {
        httpStatusCode: 201,
        success: true,
        data: result,
        message: "Restaurant created successfully"
    });
});
const getRestaurants = catchAsync(async (req, res) => {
    const query = req.query;
    const result = await RestaurantService.getRestaurants(query);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result.data,
        meta: result.meta,
        message: "Restaurants retrieved successfully"
    });
});
const getMyRestaurants = catchAsync(async (req, res) => {
    const query = req.query;
    const result = await RestaurantService.getRestaurantsByUserId(req.user.userId, query);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result.data,
        meta: result.meta,
        message: "My restaurants retrieved successfully"
    });
});
const getTopRatedRestaurants = catchAsync(async (_req, res) => {
    const result = await RestaurantService.getTopRatedRestaurants();
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Top rated restaurants retrieved successfully"
    });
});
const getRestaurantById = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await RestaurantService.getRestaurantById(id);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Restaurant retrieved successfully"
    });
});
const updateRestaurant = catchAsync(async (req, res) => {
    const id = req.params.id;
    const payload = req.body;
    const files = req.files || [];
    const imagePaths = files.map((file) => file.path);
    const result = await RestaurantService.updateRestaurant(id, { ...payload, ...(imagePaths.length > 0 && { images: imagePaths }) }, req.user);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Restaurant updated successfully"
    });
});
const softDeleteRestaurant = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await RestaurantService.softDeleteRestaurant(id, req.user);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Restaurant deleted successfully"
    });
});
const updateMyRestaurant = catchAsync(async (req, res) => {
    const id = req.params.id;
    const payload = req.body;
    const files = req.files || [];
    const imagePaths = files.map((file) => file.path);
    const result = await RestaurantService.updateRestaurant(id, { ...payload, ...(imagePaths.length > 0 && { images: imagePaths }) }, req.user);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "My restaurant updated successfully"
    });
});
const softDeleteMyRestaurant = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await RestaurantService.softDeleteRestaurant(id, req.user);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "My restaurant deleted successfully"
    });
});
export const RestaurantController = {
    createRestaurant,
    getRestaurants,
    getMyRestaurants,
    getTopRatedRestaurants,
    getRestaurantById,
    updateRestaurant,
    softDeleteRestaurant,
    updateMyRestaurant,
    softDeleteMyRestaurant
};
