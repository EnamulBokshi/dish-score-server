import status from "http-status";
import { AuthService } from "./auth.service";
import catchAsync from "../../helpers/catchAsync";
import { tokenUtils } from "../../utils/token";
import { sendResponse } from "../../helpers/sendResponse";
import AppError from "../../helpers/errorHelpers/AppError";
import { env } from "../../../config/env";
import { auth } from "../../lib/auth";
import { cookieUtils } from "../../utils/cookie";
const isProduction = env.NODE_ENV === "production";
const cookieSameSite = isProduction ? "none" : "lax";
const getRequestOrigin = (req) => {
    const forwardedProto = req.headers["x-forwarded-proto"];
    const proto = Array.isArray(forwardedProto)
        ? forwardedProto[0]
        : forwardedProto || req.protocol;
    const host = req.get("host");
    return `${proto}://${host}`;
};
const registerUser = catchAsync(async (req, res) => {
    console.log("Registering reviewer with payload", req.body);
    const payload = req.body?.data ? JSON.parse(req.body.data) : req.body;
    const imagePath = req.file?.path;
    if (!payload.name || !payload.email || !payload.password) {
        throw new AppError(status.BAD_REQUEST, "Missing required fields: name, email, password");
    }
    const data = await AuthService.registerUser({ ...payload, ...(imagePath && { image: imagePath }) });
    const { accessToken, refreshToken, token, ...rest } = data;
    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, token);
    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "User registered successfully",
        data: {
            token,
            accessToken,
            refreshToken,
            ...rest
        }
    });
});
const loginUser = catchAsync(async (req, res) => {
    const payload = req.body;
    if (!payload.email || !payload.password) {
        throw new AppError(status.BAD_REQUEST, "Missing required fields: email, password");
    }
    const data = await AuthService.loginUser(payload);
    const { accessToken, refreshToken, token, ...rest } = data;
    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, token);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User logged in successfully",
        data: {
            token,
            accessToken,
            refreshToken,
            ...rest,
        },
    });
});
const getMe = catchAsync(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new AppError(status.UNAUTHORIZED, "Unauthorized: No user information found in request");
    }
    const data = await AuthService.getMe(user);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User information retrieved successfully",
        data,
    });
});
const getNewToken = catchAsync(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    const sessionToken = cookieUtils.getBetterAuthSessionToken(req);
    if (!refreshToken) {
        throw new AppError(status.UNAUTHORIZED, "Refresh token is missing");
    }
    if (!sessionToken) {
        throw new AppError(status.UNAUTHORIZED, "Session token is missing");
    }
    const result = await AuthService.getNewToken(refreshToken, sessionToken);
    const { accessToken, refreshToken: newRefreshToken, sessionToken: newSessionToken, } = result;
    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, newRefreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, newSessionToken);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "New access token generated successfully",
        data: {
            accessToken,
            refreshToken: newRefreshToken,
            sessionToken: newSessionToken,
        },
    });
});
const changePassword = catchAsync(async (req, res) => {
    const sessionToken = cookieUtils.getBetterAuthSessionToken(req);
    const payload = req.body;
    if (!sessionToken) {
        throw new AppError(status.UNAUTHORIZED, "Session token is missing");
    }
    if (!payload.currentPassword || !payload.newPassword) {
        throw new AppError(status.BAD_REQUEST, "Missing required fields: currentPassword, newPassword");
    }
    const result = await AuthService.changePassword(payload, sessionToken);
    const { accessToken, refreshToken, token } = result;
    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, token);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Password changed successfully",
        data: result,
    });
});
const logoutUser = catchAsync(async (req, res) => {
    const sessionToken = cookieUtils.getBetterAuthSessionToken(req);
    if (!sessionToken) {
        throw new AppError(status.BAD_REQUEST, "Session token is missing");
    }
    await AuthService.logoutUser(sessionToken);
    cookieUtils.clearCookie(res, "accessToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: cookieSameSite,
        path: "/",
    });
    cookieUtils.clearCookie(res, "refreshToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: cookieSameSite,
        path: "/",
    });
    cookieUtils.clearBetterAuthSessionCookies(res, {
        httpOnly: true,
        secure: isProduction,
        sameSite: cookieSameSite,
        path: "/",
    });
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User logged out successfully",
    });
});
const verifyEmail = catchAsync(async (req, res) => {
    const { otp, email } = req.body;
    if (!otp || !email) {
        throw new AppError(status.BAD_REQUEST, "Missing required fields: otp, email");
    }
    console.log("Verifying email with OTP", { email, otp });
    await AuthService.verifyEmail(otp, email);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Email verified successfully",
    });
});
const resendOtp = catchAsync(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new AppError(status.BAD_REQUEST, "Email is required");
    }
    await AuthService.resendVerificationOtp(email);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Verification OTP sent successfully",
    });
});
const forgetPassword = catchAsync(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new AppError(status.BAD_REQUEST, "Email is required");
    }
    await AuthService.forgetPassword(email);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Password reset OTP sent to email successfully",
    });
});
const resetPassword = catchAsync(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        throw new AppError(status.BAD_REQUEST, "Missing required fields: email, otp, newPassword");
    }
    await AuthService.resetPassword({ email, otp, newPassword });
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Password reset successfully",
    });
});
// /api/v1/login/google?redirect=/profile
const googleSignIn = catchAsync(async (req, res) => {
    const redirectPath = req.query.redirect || "/dashboard";
    const encodedRedirectPath = encodeURIComponent(redirectPath);
    const authBaseUrl = getRequestOrigin(req);
    const callbackURL = `${authBaseUrl}/api/v1/auth/google/success?redirect=${encodedRedirectPath}`;
    res.render("googleRedirect", {
        callbackURL,
        betterAuthUrl: authBaseUrl,
    });
});
const googleSignInSuccess = catchAsync(async (req, res) => {
    const redirectPath = req.query.redirect || "/dashboard";
    const sessionToken = cookieUtils.getBetterAuthSessionToken(req);
    if (!sessionToken) {
        return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
    }
    const session = await auth.api.getSession({
        headers: {
            Cookie: `better-auth.session_token=${sessionToken}`,
        },
    });
    if (!session) {
        return res.redirect(`${env.FRONTEND_URL}/login?error=no_session_found`);
    }
    if (!session?.user) {
        return res.redirect(`${env.FRONTEND_URL}/login?error=no_user_found`);
    }
    const result = await AuthService.googleSignInSuccess(session);
    const { accessToken, refreshToken } = result;
    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
    const isValidRedirectPath = redirectPath.startsWith("/") && !redirectPath.startsWith("//");
    const finalRedirectPath = isValidRedirectPath ? redirectPath : "/dashboard";
    res.redirect(`${env.FRONTEND_URL}${finalRedirectPath}`);
});
const googleSignInFailure = catchAsync(async (req, res) => {
    const error = req.query.error || "oauth_failed";
    res.redirect(`${env.FRONTEND_URL}/login?error=${error}`);
});
export const AuthController = {
    loginUser,
    registerUser,
    getNewToken,
    getMe,
    changePassword,
    logoutUser,
    verifyEmail,
    resendOtp,
    forgetPassword,
    resetPassword,
    googleSignIn,
    googleSignInSuccess,
    googleSignInFailure,
};
