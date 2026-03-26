import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import { sendResponse } from "../../helpers/sendResponse";
import { ReviewService } from "./review.service";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const files = (req.files as Express.Multer.File[]) || [];
  const imagePaths = files.map((file) => file.path);

  const result = await ReviewService.createReview(
    { ...payload, images: imagePaths.length > 0 ? imagePaths : payload.images },
    req.user,
  );

  sendResponse(res, {
    httpStatusCode: 201,
    success: true,
    data: result,
    message: "Review created successfully",
  });
});

const getReviews = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await ReviewService.getReviews(query);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result.data,
    meta: result.meta,
    message: "Reviews retrieved successfully",
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const payload = req.body;
  const files = (req.files as Express.Multer.File[]) || [];
  const imagePaths = files.map((file) => file.path);

  const result = await ReviewService.updateReview(
    id as string,
    { ...payload, ...(imagePaths.length > 0 && { images: imagePaths }) },
    req.user,
  );

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "Review updated successfully",
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await ReviewService.deleteReview(id as string, req.user);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "Review deleted successfully",
  });
});

export const ReviewController = {
  createReview,
  getReviews,
  updateReview,
  deleteReview,
};
