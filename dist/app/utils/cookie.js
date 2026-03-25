const setCookie = (res, key, value, options) => {
    res.cookie(key, value, options);
};
const getCookie = (req, key) => {
    return req.cookies[key];
};
const clearCookie = (res, key, options) => {
    res.clearCookie(key, options);
};
export const cookieUtils = {
    setCookie,
    getCookie,
    clearCookie
};
