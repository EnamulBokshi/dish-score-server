import { NextFunction, Request, Response } from "express";
import z from "zod";

const requestValidator = (zodSchema: z.ZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    console.log("Received request with data:", req.body);

    if (req.body?.data) {
      req.body = JSON.parse(req.body.data);
    }

    const parsedResult = zodSchema.safeParse(req.body);
    if (!parsedResult.success) {
      return next(parsedResult.error);
    }

    req.body = parsedResult.data;
    console.log("Validated request data:", req.body);
    next();
  };
};

export default requestValidator;