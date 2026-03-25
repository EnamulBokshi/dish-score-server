import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import { RestaurantService } from "./restaurant.service";
import { sendResponse } from "../../helpers/sendResponse";

const createRestaurant = catchAsync(async(req: Request, res: Response) => {
    const payload = req.body;
    const result = await RestaurantService.createRestaurant(payload);
    sendResponse(res, {
        httpStatusCode: 201,
        success: true,
        data: result,
        message: "Restaurant created successfully"
    })
});

const getRestaurants = catchAsync(async(req: Request, res: Response) => {
    const query = req.query;
    const result = await RestaurantService.getRestaurants(query);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Restaurants retrieved successfully"
    })
});

const updateRestaurant = catchAsync(async(req: Request, res: Response) => {
    const id = req.params.id;
    const payload = req.body;
    const result = await RestaurantService.updateRestaurant(id as string, payload);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Restaurant updated successfully"
    })
});

const softDeleteRestaurant = catchAsync(async(req: Request, res: Response) => {
    const id = req.params.id;
    const result = await RestaurantService.softDeleteRestaurant(id as string);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Restaurant deleted successfully"
    })
});

export const RestaurantController = {
    createRestaurant,
    getRestaurants,
    updateRestaurant,
    softDeleteRestaurant
}   