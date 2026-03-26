import { Response, Request } from "express";
import status from "http-status";
import { UserRole } from "../../../generated/prisma/enums";
import catchAsync from "../../helpers/catchAsync";
import AppError from "../../helpers/errorHelpers/AppError";
import { sendResponse } from "../../helpers/sendResponse";
import { UserServices } from "./user.service";
import { tokenUtils } from "../../utils/token";

const createAdmin = catchAsync(async (req: Request, res: Response) => {
    const requesterRole = req.user?.role;
    if (requesterRole !== UserRole.ADMIN && requesterRole !== UserRole.SUPER_ADMIN) {
        throw new AppError(status.FORBIDDEN, "Only admin or super admin can create an admin");
    }

    const payload = req.body;
    const profilePhoto = req.file?.path;
    const result = await UserServices.createAdmin({ ...payload, ...(profilePhoto && { profilePhoto }) });

    tokenUtils.setAccessTokenCookie(res, result.accessToken);
    tokenUtils.setRefreshTokenCookie(res, result.refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, result.token as string)
    sendResponse(res, {
        httpStatusCode: 201,
        success: true,
        data: result,
        message: "Admin created successfully"
    });
});

const getAdminByUserId = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId || req.params.id;
    const result = await UserServices.getAdminByUserId(userId as string);

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Admin retrieved successfully"
    });

});

const updateAdmin = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId || req.params.id;
    const payload = req.body;
    const profilePhoto = req.file?.path;
    const result = await UserServices.updateAdmin(userId as string, { ...payload, ...(profilePhoto && { profilePhoto }) });

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Admin updated successfully"
    });

});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await UserServices.getAllUsers(query);

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result.data,
        meta: result.meta,
        message: "Users retrieved successfully"
    });
});

const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId || req.params.id;
    const result = await UserServices.deleteAdmin(userId as string);

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Admin deleted successfully"
    });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId || req.params.id;
    const result = await UserServices.getUserById(userId as string);

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "User retrieved successfully"
    });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId || req.params.id;
    const payload = req.body.data? JSON.parse(req.body.data) : req.body;
    const profilePhoto = req.file?.path;
    const result = await UserServices.updateUser(userId as string, { ...payload, ...(profilePhoto && { profilePhoto }) });

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "User updated successfully"
    });

});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId || req.params.id;
    const result = await UserServices.deleteUser(userId as string);

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "User deleted successfully"
    });
});


export const userController = {
    createAdmin,
    getAdminByUserId,
    updateAdmin,
    getAllUsers,
    deleteAdmin,
    getUserById,
    updateUser,
    deleteUser,
}