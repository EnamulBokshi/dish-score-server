const BETTER_AUTH_SESSION_COOKIE_CANDIDATES = [
    "better-auth.session_token",
    "__Secure-better-auth.session_token",
    "__Host-better-auth.session_token",
];
const setCookie = (res, key, value, options) => {
    res.cookie(key, value, options);
};
const getCookie = (req, key) => {
    return req.cookies[key];
};
const getBetterAuthSessionToken = (req) => {
    for (const key of BETTER_AUTH_SESSION_COOKIE_CANDIDATES) {
        const value = req.cookies?.[key];
        if (value) {
            return value;
        }
    }
    return undefined;
};
const clearCookie = (res, key, options) => {
    res.clearCookie(key, options);
};
const clearBetterAuthSessionCookies = (res, options) => {
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
};
