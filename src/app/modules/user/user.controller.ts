import { Response, Request } from "express";
import status from "http-status";
import { UserRole } from "../../../generated/prisma/enums";
import catchAsync from "../../helpers/catchAsync";
import AppError from "../../helpers/errorHelpers/AppError";
import { sendResponse } from "../../helpers/sendResponse";
import { adminService } from "./user.service";
import { tokenUtils } from "../../utils/token";

const createAdmin = catchAsync(async (req: Request, res: Response) => {
    const requesterRole = req.user?.role;
    if (requesterRole !== UserRole.ADMIN && requesterRole !== UserRole.SUPER_ADMIN) {
        throw new AppError(status.FORBIDDEN, "Only admin or super admin can create an admin");
    }

    const payload = req.body;
    const profilePhoto = req.file?.path;
    const result = await adminService.createAdmin({ ...payload, ...(profilePhoto && { profilePhoto }) });

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
    const result = await adminService.getAdminByUserId(userId as string);

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
    const result = await adminService.updateAdmin(userId as string, { ...payload, ...(profilePhoto && { profilePhoto }) });

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Admin updated successfully"
    });

});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await adminService.getAllUsers(query);

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
    const result = await adminService.deleteAdmin(userId as string);

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Admin deleted successfully"
    });
});

export const userController = {
    createAdmin,
    getAdminByUserId,
    updateAdmin,
    getAllUsers,
    deleteAdmin
}