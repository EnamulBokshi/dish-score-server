import { NextFunction, Request, RequestHandler, Response } from "express";

const catchAsync = (fn:RequestHandler) => {
    return async (req:Request, res:Response, next:NextFunction) => {
        try {
            await fn(req, res, next);
        } catch (error: unknown) {
            console.error("Error in async function:", error);
            res.status(500).json({
                success: false,
                data: null,
                message: error instanceof Error ? error.message : "An unknown error occured",
                error: "An error occurred while processing the request"
            })
            
        }
    }
   
}



export default catchAsync;

