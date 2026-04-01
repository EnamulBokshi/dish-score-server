import { CookieOptions, Request, Response } from "express";

const BETTER_AUTH_SESSION_COOKIE_CANDIDATES = [
    "better-auth.session_token",
    "__Secure-better-auth.session_token",
    "__Host-better-auth.session_token",
] as const;

const setCookie  = (res:Response, key: string, value: string, options: CookieOptions) => {
    res.cookie(key, value, options);
}

const getCookie = (req: Request, key: string) => {
    return req.cookies[key];
}

const getBetterAuthSessionToken = (req: Request) => {
    for (const key of BETTER_AUTH_SESSION_COOKIE_CANDIDATES) {
        const value = req.cookies?.[key];
        if (value) {
            return value as string;
        }
    }
    return undefined;
};

const clearCookie = (res: Response, key: string, options: CookieOptions) => {
    res.clearCookie(key, options);
}

const clearBetterAuthSessionCookies = (res: Response, options: CookieOptions) => {
    for (const key of BETTER_AUTH_SESSION_COOKIE_CANDIDATES) {
        res.clearCookie(key, options);
    }
};



export const cookieUtils = {
    setCookie,
    getCookie,
    clearCookie,
    getBetterAuthSessionToken,
    clearBetterAuthSessionCookies,
}
