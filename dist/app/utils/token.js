import { jwtUtils } from "./jwt";
import { env } from "../../config/env";
import { cookieUtils } from "./cookie";
const getAccessToken = (payload) => {
    const accessToken = jwtUtils.createToken(payload, env.ACCESS_TOKEN_SECRET, { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN });
    return accessToken;
};
const getRefreshToken = (payload) => {
    const refreshToken = jwtUtils.createToken(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN });
    return refreshToken;
};
const setAccessTokenCookie = (res, token) => {
    cookieUtils.setCookie(res, "accessToken", token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: env.ACCESS_TOKEN_EXPIRES_IN,
        path: "/"
    });
};
const setRefreshTokenCookie = (res, token) => {
    cookieUtils.setCookie(res, "refreshToken", token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "none",
        // 7d
        maxAge: env.REFRESH_TOKEN_EXPIRES_IN,
        path: "/"
    });
};
const setBetterAuthSessionCookie = (res, token) => {
    cookieUtils.setCookie(res, "better-auth.session_token", token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: env.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN,
        path: "/"
    });
};
export const tokenUtils = {
    getAccessToken,
    getRefreshToken,
    setAccessTokenCookie,
    setRefreshTokenCookie,
    setBetterAuthSessionCookie
};
