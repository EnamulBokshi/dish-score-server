import catchAsync from "../../helpers/catchAsync";
import { RestaurantService } from "./restaurant.service";
import { sendResponse } from "../../helpers/sendResponse";
const createRestaurant = catchAsync(async (req, res) => {
    const payload = req.body;
    const result = await RestaurantService.createRestaurant(payload, req.user.userId);
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
const updateRestaurant = catchAsync(async (req, res) => {
    const id = req.params.id;
    const payload = req.body;
    const result = await RestaurantService.updateRestaurant(id, payload, req.user);
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
export const RestaurantController = {
    createRestaurant,
    getRestaurants,
    updateRestaurant,
    softDeleteRestaurant
};
