import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import { sendResponse } from "../../helpers/sendResponse";
import { StatsService } from "./stats.service";

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const result = await StatsService.getDashboardStats(req.user);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "Dashboard stats retrieved successfully",
  });
});

export const StatsController = {
  getDashboardStats,
};
