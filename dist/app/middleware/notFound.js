import status from "http-status";
const notFound = (req, res) => {
    res.status(status.NOT_FOUND).json({
        success: false,
        message: `Cannot find ${req.originalUrl} on this server`,
    });
};
export const NotFoundMiddleware = notFound;
