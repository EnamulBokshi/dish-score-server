import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import { sendResponse } from "../../helpers/sendResponse";
import { TestimonialService } from "./testimonial.service";

const createTestimonial = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await TestimonialService.createTestimonial(payload, req.user);

  sendResponse(res, {
    httpStatusCode: 201,
    success: true,
    data: result,
    message: "Testimonial created successfully",
  });
});

const getTestimonials = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await TestimonialService.getTestimonials(query, req.user);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result.data,
    meta: result.meta,
    message: "Testimonials retrieved successfully",
  });
});

const getMyTestimonials = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await TestimonialService.getMyTestimonials(req.user.userId, query);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result.data,
    meta: result.meta,
    message: "My testimonials retrieved successfully",
  });
});

const getTestimonialById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await TestimonialService.getTestimonialById(id as string, req.user);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "Testimonial retrieved successfully",
  });
});

const updateTestimonial = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const payload = req.body;
  const result = await TestimonialService.updateTestimonial(id as string, payload, req.user);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "Testimonial updated successfully",
  });
});

const deleteTestimonial = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await TestimonialService.deleteTestimonial(id as string, req.user);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "Testimonial deleted successfully",
  });
});

export const TestimonialController = {
  createTestimonial,
  getTestimonials,
  getMyTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
};
