const requestValidator = (zodSchema) => {
    return async (req, res, next) => {
        console.log("Received doctor creation request with data:", req.body);
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        const parsedResult = zodSchema.safeParse(req.body);
        if (!parsedResult.success) {
            next(parsedResult.error);
        }
        req.body = parsedResult.data;
        console.log("Validated doctor creation data:", req.body);
        next();
    };
};
export default requestValidator;
