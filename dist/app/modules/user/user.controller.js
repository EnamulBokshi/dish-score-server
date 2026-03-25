import catchAsync from "../../helpers/catchAsync";
import { sendResponse } from "../../helpers/sendResponse";
import { adminService } from "./user.service";
import { tokenUtils } from "../../utils/token";
const createAdmin = catchAsync(async (req, res) => {
    const payload = req.body;
    const result = await adminService.createAdmin(payload);
    tokenUtils.setAccessTokenCookie(res, result.accessToken);
    tokenUtils.setRefreshTokenCookie(res, result.refreshToken);
    sendResponse(res, {
        httpStatusCode: 201,
        success: true,
        data: result.admin,
        message: "Admin created successfully"
    });
});
const getAdminByUserId = catchAsync(async (req, res) => {
    const userId = req.params.userId || req.params.id;
    const result = await adminService.getAdminByUserId(userId);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Admin retrieved successfully"
    });
});
const updateAdmin = catchAsync(async (req, res) => {
    const userId = req.params.userId || req.params.id;
    const payload = req.body;
    const result = await adminService.updateAdmin(userId, payload);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Admin updated successfully"
    });
});
const getAllUsers = catchAsync(async (req, res) => {
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
const deleteAdmin = catchAsync(async (req, res) => {
    const userId = req.params.userId || req.params.id;
    const result = await adminService.deleteAdmin(userId);
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
};
