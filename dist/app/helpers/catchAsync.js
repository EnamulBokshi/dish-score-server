const catchAsync = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        }
        catch (error) {
            console.error("Error in async function:", error);
            res.status(500).json({
                success: false,
                data: null,
                error: error instanceof Error ? error.message : "An unknown error occured",
                message: "An error occurred while processing the request"
            });
        }
    };
};
export default catchAsync;
