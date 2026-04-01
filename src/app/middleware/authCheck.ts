import { NextFunction, Request, Response } from "express";
import { UserRole, UserStatus } from "../../generated/prisma/enums";
import { cookieUtils } from "../utils/cookie";
import prisma from "../lib/prisma";
import AppError from "../helpers/errorHelpers/AppError";
import status from "http-status";
import { jwtUtils } from "../utils/jwt";
import { env } from "../../config/env";

export const  authCheck = (...roles: UserRole[]) => {
    return async (req: Request, res: Response, next: NextFunction)=> {
        try {
            // session token check
            console.log("Checking authentication for request to:", req.path);
            const sessionToken = cookieUtils.getBetterAuthSessionToken(req);
            if(!sessionToken) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: No session token provided"
                })
            }
            const sessionExists = await prisma.session.findFirst({
                where: {
                    token: sessionToken,
                    expiresAt: {
                        gt: new Date()
                    },
                
                },
                include: {
                    user: true
                }
                
            })
            if(sessionExists && sessionExists.user) {
                const user = sessionExists.user;

                const now = new Date();
                const expiresAt = sessionExists.expiresAt;
                const createdAt = sessionExists.createdAt;

                const sessionLifeTime = expiresAt.getTime() - createdAt.getTime();
                const timeLeft = expiresAt.getTime() - now.getTime();

                const percentageLeft = (timeLeft / sessionLifeTime) * 100;
                if(percentageLeft < 20) {
                    res.setHeader("X-Session-Refresh", 'true');
                    res.setHeader('X-Session-Expires-At', expiresAt.toDateString());

                    res.setHeader("X-Session-Remaining-Time", timeLeft.toString());
                    console.log(`Session for user ${user.email} is about to expire. Time left: ${timeLeft} ms (${percentageLeft.toFixed(2)}%)`);
                }

                if(user.status === UserStatus.BANNED) {
                    throw new AppError(status.UNAUTHORIZED, 'Your account has been suspended. Please contact support for more information.');
                }
                if(user.status === UserStatus.DELETED) {
                    throw new AppError(status.UNAUTHORIZED, 'Your account has been deleted. Please contact support for more information.');
                }
                if(roles.length > 0 && !roles.includes(user.role as UserRole)) {
                    throw new AppError(status.FORBIDDEN, "Forbidden: You don't have permission to access this resource");
                }

                req.user = {
                   userId: user.id,
                     email: user.email,
                     role: user.role as UserRole,
                }
            }

            
            const accessToken = cookieUtils.getCookie(req, "accessToken");
            if(!accessToken) {
                throw new AppError(status.UNAUTHORIZED, "Unauthorized: No access token provided");
            }

            const verifiedToken = jwtUtils.verifyToken(accessToken, env.ACCESS_TOKEN_SECRET as string);
            if(!verifiedToken.success){
                throw new AppError(status.UNAUTHORIZED, "Unauthorized: Invalid access token");
            }
            
            if(verifiedToken.data!.role && roles.length > 0 && !roles.includes(verifiedToken.data!.role as UserRole)) {
                throw new AppError(status.FORBIDDEN, "Forbidden: You don't have permission to access this resource");
            }
            
            // Ensure req.user is always set from access token if not already set from session
            if (!req.user) {
                req.user = {
                    userId: verifiedToken.data!.userId,
                    email: verifiedToken.data!.email,
                    role: verifiedToken.data!.role as UserRole,
                };
            }
            
            console.log("Authentication successful for user:", verifiedToken.data!.email);
            next();
        } catch (error) {
            next(error)
        }
    }
}


export default authCheck;