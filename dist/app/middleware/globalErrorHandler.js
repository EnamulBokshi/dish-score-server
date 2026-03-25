import status from "http-status";
import z from "zod";
import { env } from "../../config/env";
import { deleteFileFromGlobalErrorHandler } from "../utils/deleteFilesFromGlobalErrorHandler";
import { Prisma } from "../../generated/prisma/client";
import { handlePrismaClientKnownRequestError, handlePrismaClientUnknownError, handlePrismaClientValidationError, handlerPrismaClientInitializationError, handlerPrismaClientRustPanicError } from "../helpers/errorHelpers/prismaError";
import zodErrorHelper from "../helpers/errorHelpers/zodErrorHelper";
import AppError from "../helpers/errorHelpers/AppError";
export const globalErrorHandler = async (err, req, res, next) => {
    if (env.NODE_ENV === "development") {
        console.error("Error from global error handler:", err);
    }
    await deleteFileFromGlobalErrorHandler(req);
    let statusCode = status.INTERNAL_SERVER_ERROR;
    let message = "An unexpected error occurred";
    let stack = undefined;
    let errorSources = [];
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        const simplifiedError = handlePrismaClientKnownRequestError(err);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorSources = [...simplifiedError.errorSources];
        stack = err.stack;
    }
    else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
        const simplifiedError = handlePrismaClientUnknownError(err);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorSources = [...simplifiedError.errorSources];
        stack = err.stack;
    }
    else if (err instanceof Prisma.PrismaClientValidationError) {
        const simplifiedError = handlePrismaClientValidationError(err);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorSources = [...simplifiedError.errorSources];
        stack = err.stack;
    }
    else if (err instanceof Prisma.PrismaClientRustPanicError) {
        const simplifiedError = handlerPrismaClientRustPanicError();
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorSources = [...simplifiedError.errorSources];
        stack = err.stack;
    }
    else if (err instanceof Prisma.PrismaClientInitializationError) {
        const simplifiedError = handlerPrismaClientInitializationError(err);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorSources = [...simplifiedError.errorSources];
        stack = err.stack;
    }
    else if (err instanceof z.ZodError) {
        const zodErrorResponse = zodErrorHelper(err);
        statusCode = zodErrorResponse.statusCode;
        message =
            zodErrorResponse.message +
                `: ${zodErrorResponse.errorSources.map((source) => `${source.message}`).join(", ")}`;
        errorSources = [...zodErrorResponse.errorSources];
        stack = err.stack;
    }
    else if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        errorSources = [
            {
                path: "",
                message: err.message,
            },
        ];
    }
    else if (err instanceof Error) {
        statusCode = status.INTERNAL_SERVER_ERROR;
        message = err.message;
        stack = err.stack;
        errorSources = [
            {
                path: "",
                message: err.message,
            },
        ];
    }
    const errorResponse = {
        statusCode,
        success: false,
        message,
        errorSources,
        stack: env.NODE_ENV === "development" ? stack : undefined,
        error: env.NODE_ENV === "development" ? err : undefined,
    };
    res.status(statusCode).json(errorResponse);
};
