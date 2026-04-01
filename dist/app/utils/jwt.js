import jwt from "jsonwebtoken";
const createToken = (payload, secret, { expiresIn }) => {
    const token = jwt.sign(payload, secret, { expiresIn });
    return token;
};
const verifyToken = (token, secret) => {
    try {
        const decoded = jwt.verify(token, secret);
        return {
            success: true,
            data: decoded
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Token verification failed";
        return {
            success: false,
            message
        };
    }
};
const decodeToken = (token) => {
    const decoded = jwt.decode(token);
    return decoded;
};
export const jwtUtils = {
    createToken,
    verifyToken,
    decodeToken
};
