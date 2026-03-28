import catchAsync from "../../helpers/catchAsync";
import { sendResponse } from "../../helpers/sendResponse";
import { ReviewService } from "./review.service";
const createReview = catchAsync(async (req, res) => {
    const payload = req.body;
    const files = req.files || [];
    const imagePaths = files.map((file) => file.path);
    const result = await ReviewService.createReview({ ...payload, images: imagePaths.length > 0 ? imagePaths : payload.images }, req.user);
    sendResponse(res, {
        httpStatusCode: 201,
        success: true,
        data: result,
        message: "Review created successfully",
    });
});
const getReviews = catchAsync(async (req, res) => {
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
const getReviewById = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await ReviewService.getReviewById(id);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Review retrieved successfully",
    });
});
const getReviewsByUserId = catchAsync(async (req, res) => {
    const userId = req.params.userId;
    const query = req.query;
    const result = await ReviewService.getReviewsByUserId(userId, query);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result.data,
        meta: result.meta,
        message: "User reviews retrieved successfully",
    });
});
const getMyReviews = catchAsync(async (req, res) => {
    const query = req.query;
    const result = await ReviewService.getReviewsByUserId(req.user.userId, query);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result.data,
        meta: result.meta,
        message: "My reviews retrieved successfully",
    });
});
const updateReview = catchAsync(async (req, res) => {
    const id = req.params.id;
    const payload = req.body;
    const files = req.files || [];
    const imagePaths = files.map((file) => file.path);
    const result = await ReviewService.updateReview(id, { ...payload, ...(imagePaths.length > 0 && { images: imagePaths }) }, req.user);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Review updated successfully",
    });
});
const deleteReview = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await ReviewService.deleteReview(id, req.user);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Review deleted successfully",
    });
});
const updateMyReview = catchAsync(async (req, res) => {
    const id = req.params.id;
    const payload = req.body;
    const files = req.files || [];
    const imagePaths = files.map((file) => file.path);
    const result = await ReviewService.updateReview(id, { ...payload, ...(imagePaths.length > 0 && { images: imagePaths }) }, req.user);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "My review updated successfully",
    });
});
const deleteMyReview = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await ReviewService.deleteReview(id, req.user);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "My review deleted successfully",
    });
});
export const ReviewController = {
    createReview,
    getReviews,
    getReviewById,
    getReviewsByUserId,
    getMyReviews,
    updateReview,
    deleteReview,
    updateMyReview,
    deleteMyReview,
};
