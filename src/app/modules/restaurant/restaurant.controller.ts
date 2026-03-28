import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import { RestaurantService } from "./restaurant.service";
import { sendResponse } from "../../helpers/sendResponse";

const createRestaurant = catchAsync(async(req: Request, res: Response) => {
    const payload = req.body;
    const files = (req.files as Express.Multer.File[]) || [];
    const imagePaths = files.map((file) => file.path);

    const result = await RestaurantService.createRestaurant(
        { ...payload, images: imagePaths.length > 0 ? imagePaths : payload.images },
        req.user.userId
    );
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
        data: result.data,
        meta: result.meta,
        message: "Restaurants retrieved successfully"
    })
});

const getMyRestaurants = catchAsync(async(req: Request, res: Response) => {
    const query = req.query;
    const result = await RestaurantService.getRestaurantsByUserId(req.user.userId, query);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result.data,
        meta: result.meta,
        message: "My restaurants retrieved successfully"
    })
});

const getTopRatedRestaurants = catchAsync(async(_req: Request, res: Response) => {
    const result = await RestaurantService.getTopRatedRestaurants();

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Top rated restaurants retrieved successfully"
    })
});

const updateRestaurant = catchAsync(async(req: Request, res: Response) => {
    const id = req.params.id;
    const payload = req.body;
    const files = (req.files as Express.Multer.File[]) || [];
    const imagePaths = files.map((file) => file.path);

    const result = await RestaurantService.updateRestaurant(
        id as string,
        { ...payload, ...(imagePaths.length > 0 && { images: imagePaths }) },
        req.user
    );
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Restaurant updated successfully"
    })
});

const softDeleteRestaurant = catchAsync(async(req: Request, res: Response) => {
    const id = req.params.id;
    const result = await RestaurantService.softDeleteRestaurant(id as string, req.user);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Restaurant deleted successfully"
    })
});

const updateMyRestaurant = catchAsync(async(req: Request, res: Response) => {
    const id = req.params.id;
    const payload = req.body;
    const files = (req.files as Express.Multer.File[]) || [];
    const imagePaths = files.map((file) => file.path);

    const result = await RestaurantService.updateRestaurant(
        id as string,
        { ...payload, ...(imagePaths.length > 0 && { images: imagePaths }) },
        req.user
    );

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "My restaurant updated successfully"
    })
});

const softDeleteMyRestaurant = catchAsync(async(req: Request, res: Response) => {
    const id = req.params.id;
    const result = await RestaurantService.softDeleteRestaurant(id as string, req.user);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "My restaurant deleted successfully"
    })
});

export const RestaurantController = {
    createRestaurant,
    getRestaurants,
    getMyRestaurants,
    getTopRatedRestaurants,
    updateRestaurant,
    softDeleteRestaurant,
    updateMyRestaurant,
    softDeleteMyRestaurant
}   