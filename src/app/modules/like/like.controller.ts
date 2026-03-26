import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import { sendResponse } from "../../helpers/sendResponse";
import { LikeService } from "./like.service";

const createLike = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await LikeService.createLike(payload, req.user);

  sendResponse(res, {
    httpStatusCode: 201,
    success: true,
    data: result,
    message: "Like created successfully",
  });
});

const toggleLike = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await LikeService.toggleLike(payload, req.user);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "Like toggled successfully",
  });
});

const getLikes = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await LikeService.getLikes(query);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result.data,
    meta: result.meta,
    message: "Likes retrieved successfully",
  });
});

const getReviewLikeSummary = catchAsync(async (req: Request, res: Response) => {
  const reviewId = req.params.reviewId;
  const result = await LikeService.getReviewLikeSummary(reviewId as string);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "Review like summary retrieved successfully",
  });
});

const deleteLike = catchAsync(async (req: Request, res: Response) => {
  const reviewId = req.params.reviewId;
  const result = await LikeService.deleteLike(reviewId as string, req.user);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "Like removed successfully",
  });
});

export const LikeController = {
  createLike,
  toggleLike,
  getLikes,
  getReviewLikeSummary,
  deleteLike,
};
