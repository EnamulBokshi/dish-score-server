import status from "http-status";
import { User, UserStatus } from "../../../generated/prisma/client";
import { auth } from "../../lib/auth";
import prisma from "../../lib/prisma";
import { tokenUtils } from "../../utils/token";
import { jwtUtils } from "../../utils/jwt";
import { env } from "../../../config/env";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../helpers/errorHelpers/AppError";
import { IRequestUser } from "../../../interfaces";
import { IChangePasswordPayload, RegisterUserPayload } from "./auth.interface";

const registerUser = async(payload: RegisterUserPayload) => {
    const {name,email, password, image} = payload;
    const isUserExist = await prisma.user.findUnique({
        where: {
            email
        }
    });
    if(isUserExist) {
        throw new AppError(status.BAD_REQUEST, "User with this email already exists");
    }
    const data = await auth.api.signUpEmail({
        body: {
            name, 
            email, 
            password,
            image,
        }
    })

    if(!data.user) {
       throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to register user");
    }

   try {
     const reviwer = await prisma.$transaction(async (tx)=> {
         const createdReviewerProfile = await tx.reviewerProfile.create({
             data: {
                 userId: data.user.id,
                 bio: "",
 
             }
         })
         return createdReviewerProfile;
     })
     const accessToken = tokenUtils.getAccessToken({
        userId: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        emailVerified: data.user.emailVerified,
        isDeleted: data.user.isDeleted,
        status: data.user.status
    })

    const refreshToken = tokenUtils.getRefreshToken({
        userId: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        emailVerified: data.user.emailVerified,
        isDeleted: data.user.isDeleted,
        status: data.user.status
    })

     return {
         ...data,
         accessToken,
         refreshToken,
         reviwer
         
     }
   } catch (error) {
    console.error("Error creating reviwer profile:", error);
    await prisma.user.delete({
        where: {
            id: data.user.id
        }
    })
    throw error;
   }


}

const loginUser = async(payload: {email: string, password: string}) => {
    const {email, password} = payload;
    const data = await auth.api.signInEmail({
        body: {
            email, 
            password
        }
    })

    if(!data.user) {
        throw new AppError(status.UNAUTHORIZED, "Invalid email or password");
    }
    if( data.user.status === UserStatus.BANNED){
        throw new AppError(status.FORBIDDEN, "Your account is suspended. Please contact support.");
    }
    if(data.user.status === UserStatus.DELETED){
        throw new AppError(status.FORBIDDEN, "Your account is deleted. Please contact support.");
    }
    if(data.user.status === UserStatus.INACTIVE){
        throw new AppError(status.FORBIDDEN, "Your account is inactive. Please contact support.");
    }

    const accessToken = tokenUtils.getAccessToken({
        userId: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        emailVerified: data.user.emailVerified,
        isDeleted: data.user.isDeleted,
        status: data.user.status
    })

    const refreshToken = tokenUtils.getRefreshToken({
        userId: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        emailVerified: data.user.emailVerified,
        isDeleted: data.user.isDeleted,
        status: data.user.status
    })
    
    return {
        ...data,
        accessToken,
        refreshToken
    };

 
}



const getMe = async(user:IRequestUser)=> {
    const isUserExist = await prisma.user.findUnique({
        where: {
            id: user.userId,
            isDeleted: false
         },
         include: {
            restaurants: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    location: true,
                    ratingAvg: true,
                    totalReviews: true,
                    createdAt: true,
                    updatedAt: true,
                }
            },
            reviewerProfile: true,
            ownerProfile: true,
            admin: true,
         }
    });
    if(!isUserExist) {
        throw new AppError(status.NOT_FOUND, "User not found");
     }
     if(isUserExist.status === UserStatus.BANNED){
        throw new AppError(status.FORBIDDEN, "Your account is suspended. Please contact support.");
    }
    if(isUserExist.status === UserStatus.DELETED){
        throw new AppError(status.FORBIDDEN, "Your account is deleted. Please contact support.");
    }
    if(isUserExist.status === UserStatus.INACTIVE){
        throw new AppError(status.FORBIDDEN, "Your account is inactive. Please contact support.");
     }

    return isUserExist;

}

const getNewToken = async(refreshToken: string, sessionToken: string) => {

    const isSessionTokenExist = await prisma.session.findUnique({
        where: {
            token: sessionToken,
            
        },
        include: {
            user: true,
        }
    });
    if(!isSessionTokenExist) {
        throw new AppError(status.UNAUTHORIZED, "Invalid session token");
    }
    const verifiedRefreshToken = jwtUtils.verifyToken(refreshToken, env.REFRESH_TOKEN_SECRET);
    if(!verifiedRefreshToken.success){
        throw new AppError(status.UNAUTHORIZED, "Invalid refresh token");
    }
    
    const data = verifiedRefreshToken.data as JwtPayload;
    const newAccessTokenPayload = {
        userId: data.userId,
        email: data.email,
        name: data.name,
        role: data.role,
        emailVerified: data.emailVerified,
        isDeleted: data.isDeleted,
        status: data.status
    }


    const newAccessToken = tokenUtils.getAccessToken(newAccessTokenPayload);
    const newRefreshToken = tokenUtils.getRefreshToken(newAccessTokenPayload);

    const {token} = await prisma.session.update({
        where: {
            token: sessionToken,
        },
        data: {
            token: sessionToken,
            expiresAt: new Date(Date.now()+ env.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN*1000),
            updatedAt: new Date(),
        }
    })
    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        sessionToken: token,
    }
}

const changePassword = async(payload:IChangePasswordPayload, sessionToken: string) => {
    const session = await auth.api.getSession({
        headers: {
            Authorization: `Bearer ${sessionToken}`
        }
    });
    if(!session){
        throw new AppError(status.UNAUTHORIZED, "Invalid session token");
    }
    const account = await prisma.account.findFirst({
        where: {
            userId: session.user.id,
            providerId: "email",
        }
    });
    if(account?.providerId === "google"){
        throw new AppError(status.BAD_REQUEST, "Password change is not allowed for Google sign in users");
    }
    const {currentPassword, newPassword} = payload;
    const result = await auth.api.changePassword({
        body: {
            currentPassword,
            newPassword,
            revokeOtherSessions: true,
        },
        headers: {
            Authorization: `Bearer ${sessionToken}`
        }
    });

    

    const tokenPayload = {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        emailVerified: session.user.emailVerified,
        isDeleted: session.user.isDeleted,
        status: session.user.status
    }
    const  accessToken = tokenUtils.getAccessToken(tokenPayload);
    const refreshToken = tokenUtils.getRefreshToken(tokenPayload);
  


    return {
        ...result,
        accessToken,
        refreshToken
    };

}


const logoutUser= async(sessionToken: string) => {
    const result = auth.api.signOut({
        headers: new Headers({
            Authorization: `Bearer ${sessionToken}`
        })
    })

    return result;
}


const verifyEmail = async( otp: string,email: string) => {
    console.log("Verifying email with OTP in service", {email, otp});
    const result = await auth.api.verifyEmailOTP({
        body: {
            email,
            otp
        }
    })
    console.log("Result from verifyEmailOTP API", result);
    if(result.status &&  !result.user.emailVerified) {
        await prisma.user.update({
            where: {
                email
            },
            data: {
                emailVerified: true,
                status: UserStatus.ACTIVE
            }
        })
    } 
}

const resendVerificationOtp = async (email: string) => {
    const isUserExist = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (!isUserExist) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    if (isUserExist.emailVerified) {
        throw new AppError(status.BAD_REQUEST, "Email is already verified");
    }

    if (isUserExist.status === UserStatus.BANNED || isUserExist.status === UserStatus.DELETED) {
        throw new AppError(status.FORBIDDEN, "Your account is not active. Please contact support.");
    }

    await auth.api.sendVerificationOTP({
        body: {
            email,
            type: "email-verification",
        },
    });
}

const forgetPassword = async(email: string) => {
    const isUserExist = await prisma.user.findUnique({  
        where: {
            email
        }
    });
    if(!isUserExist) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }
    if(!isUserExist.emailVerified){
        throw new AppError(status.BAD_REQUEST, "Email is not verified. Please verify your email before resetting password.");
    }
    if(isUserExist.status === UserStatus.BANNED || isUserExist.status === UserStatus.DELETED){
        throw new AppError(status.FORBIDDEN, "Your account is not active. Please contact support.");                                                                                                                                                                    
    }
    const account = await prisma.account.findFirst({
        where: {
            userId: isUserExist.id,
        }
    });
    if(account?.providerId === "google"){
        throw new AppError(status.BAD_REQUEST, "Password reset is not allowed for Google sign in users");
    }

     await auth.api.requestPasswordResetEmailOTP({
        body: {
            email
        }
    })
}
const resetPassword = async(payload: {email: string, otp: string, newPassword: string}) => {
    const isUserExist = await prisma.user.findUnique({  
        where: {
            email: payload.email
        }
    });
    if(!isUserExist) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }
    if(!isUserExist.emailVerified){
        throw new AppError(status.BAD_REQUEST, "Email is not verified. Please verify your email before resetting password.");
    }
    if(isUserExist.status === UserStatus.BANNED || isUserExist.status === UserStatus.DELETED){
        throw new AppError(status.FORBIDDEN, "Your account is not active. Please contact support.");                                                                                                                                                                    
    }
    const account = await prisma.account.findFirst({
        where: {
            userId: isUserExist.id,
        }
    });
    if(account?.providerId === "google"){
        throw new AppError(status.BAD_REQUEST, "Password reset is not allowed for Google sign in users");
    }
    await auth.api.resetPasswordEmailOTP({
        body: {
            email: payload.email,
            otp: payload.otp,
            password: payload.newPassword
         }
    })

   

    await prisma.session.deleteMany({
        where: {
            userId: isUserExist.id
         }
     })
}

const googleSignInSuccess = async(session: Record<string, any>) => {
    const isReviewerExist = await prisma.user.findUnique({
        where: {
            id: session.user.id,
        }
    });
    if(!isReviewerExist){
        const user = await prisma.reviewerProfile.create({
            data: {
                userId: session.user.id,
                bio: "",
            }
        })
    };

    const accessToken = tokenUtils.getAccessToken({
        userId: session.user.id,
        name: session.user.name,
        role: session.user.role,
    });
    const refreshToken = tokenUtils.getRefreshToken({
        userId: session.user.id,
        name: session.user.name,
        role: session.user.role,
    });

    return {
        accessToken,
        refreshToken,

    }


}


export const AuthService = {
    registerUser,
    loginUser,
    getMe,
    getNewToken,
    changePassword,
    logoutUser,
    verifyEmail,
    resendVerificationOtp,
    forgetPassword,
    resetPassword,
    googleSignInSuccess,
}