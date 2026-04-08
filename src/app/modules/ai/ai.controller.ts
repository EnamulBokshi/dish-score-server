import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import { sendResponse } from "../../helpers/sendResponse";
import { AIService } from "./ai.service";

const chat = catchAsync(async (req: Request, res: Response) => {
  const result = await AIService.chat(req.body);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "AI chat response generated successfully",
  });
});

const generateReviewDescription = catchAsync(async (req: Request, res: Response) => {
  const result = await AIService.generateReviewDescription(req.body);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "Review description generated successfully",
  });
});

const searchSuggestions = catchAsync(async (req: Request, res: Response) => {
  const result = await AIService.searchSuggestions(req.body);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "Search suggestions generated successfully",
  });
});

export const AIController = {
  chat,
  generateReviewDescription,
  searchSuggestions,
};
