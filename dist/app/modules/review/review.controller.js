import catchAsync from "../../helpers/catchAsync";
import { sendResponse } from "../../helpers/sendResponse";
import { ReviewService } from "./review.service";
const createReview = catchAsync(async (req, res) => {
    const payload = req.body;
    const result = await ReviewService.createReview(payload, req.user);
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
const updateReview = catchAsync(async (req, res) => {
    const id = req.params.id;
    const payload = req.body;
    const result = await ReviewService.updateReview(id, payload, req.user);
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
export const ReviewController = {
    createReview,
    getReviews,
    updateReview,
    deleteReview,
};
