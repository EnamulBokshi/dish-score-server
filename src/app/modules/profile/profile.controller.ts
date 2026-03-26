import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import { sendResponse } from "../../helpers/sendResponse";
import { ProfileService } from "./profile.service";

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await ProfileService.getMyProfile(req.user.userId);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "Profile retrieved successfully",
  });
});

const updateOwnerProfile = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await ProfileService.updateOwnerProfile(req.user.userId, payload);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "Owner profile updated successfully",
  });
});

const updateReviewerProfile = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await ProfileService.updateReviewerProfile(req.user.userId, payload);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "Reviewer profile updated successfully",
  });
});

export const ProfileController = {
  getMyProfile,
  updateOwnerProfile,
  updateReviewerProfile,
};
