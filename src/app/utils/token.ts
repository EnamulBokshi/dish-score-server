import { JwtPayload, SignOptions } from "jsonwebtoken";
import { jwtUtils } from "./jwt";
import { env } from "../../config/env";
import { Response } from "express";
import { cookieUtils } from "./cookie";

const isProduction = env.NODE_ENV === "production";
const cookieSameSite: "lax" | "none" = isProduction ? "none" : "lax";

const getAccessToken = (payload: JwtPayload) => {
    const accessToken = jwtUtils.createToken(payload, env.ACCESS_TOKEN_SECRET, {expiresIn: env.ACCESS_TOKEN_EXPIRES_IN} as  SignOptions)
    return accessToken;
}

const getRefreshToken = (payload: JwtPayload) => {
    const refreshToken = jwtUtils.createToken(payload, env.REFRESH_TOKEN_SECRET, {expiresIn: env.REFRESH_TOKEN_EXPIRES_IN} as SignOptions)
    return refreshToken;
}

const setAccessTokenCookie = (res: Response, token: string) => {
    cookieUtils.setCookie(res, "accessToken", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: cookieSameSite,

        // Express cookie maxAge expects milliseconds.
        maxAge:  env.ACCESS_TOKEN_EXPIRES_IN * 1000,
        path: "/"
    })
}
 

const setRefreshTokenCookie = (res: Response, token: string) => {
    
    cookieUtils.setCookie(res, "refreshToken", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: cookieSameSite,
        // 7d
        maxAge: env.REFRESH_TOKEN_EXPIRES_IN * 1000,
        path: "/"

    })
}

const setBetterAuthSessionCookie = (res: Response, token: string) => {
    
    cookieUtils.setCookie(res, "better-auth.session_token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: cookieSameSite,
        maxAge: env.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN * 1000,
        path: "/"
    })
}

export const tokenUtils = {
    getAccessToken,
    getRefreshToken,
    setAccessTokenCookie,
    setRefreshTokenCookie,
    setBetterAuthSessionCookie
}