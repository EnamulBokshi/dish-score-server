import status from "http-status";
const zodErrorHelper = (err) => {
    const statusCode = status.BAD_REQUEST;
    const message = "Zod Validation error";
    const errorSources = [];
    err.issues.forEach((issue) => {
        errorSources.push({
            path: issue.path.join(' '),
            message: issue.message
        });
    });
    return {
        success: false,
        statusCode,
        message,
        errorSources
    };
};
export default zodErrorHelper;
