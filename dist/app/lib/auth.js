import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { bearer, emailOTP } from "better-auth/plugins";
import { sendEmail } from "../utils/email";
import { UserRole, UserStatus } from "../../generated/prisma/enums";
import { env } from "../../config/env";
// If your Prisma file is located elsewhere, you can change the path
export const auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: UserRole.CONSUMER,
            },
            status: {
                type: "string",
                required: true,
                defaultValue: UserStatus.ACTIVE,
            },
            isDeleted: {
                type: "boolean",
                required: true,
                defaultValue: false,
            },
            deletedAt: {
                type: "date",
                required: false,
                defaultValue: null,
            }
        }
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    socialProviders: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            mapProfileToUser: () => {
                return {
                    role: UserRole.CONSUMER,
                    status: UserStatus.ACTIVE,
                    emailVerified: true,
                    isDeleted: false,
                    deletedAt: null,
                };
            },
        }
    },
    emailVerification: {
        sendOnSignIn: true,
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
    },
    plugins: [
        bearer(),
        emailOTP({
            overrideDefaultEmailVerification: true,
            async sendVerificationOTP({ email, otp, type }) {
                const user = await prisma.user.findUnique({
                    where: {
                        email,
                    },
                });
                if (!user) {
                    return;
                }
                if (type === "forget-password") {
                    await sendEmail({
                        to: email,
                        subject: "Reset your password OTP - Dish Score",
                        template: "reset-password-otp",
                        templateData: {
                            name: user.name,
                            otp,
                            appName: "Dish Score",
                            expiresInMinutes: 2,
                        },
                    });
                    return;
                }
                if (type !== "email-verification") {
                    return;
                }
                // Only send registration verification OTP through this template for consumer accounts.
                if (user.role !== UserRole.CONSUMER || user.emailVerified) {
                    return;
                }
                await sendEmail({
                    to: email,
                    subject: "Verify your email - Dish Score",
                    template: "otp",
                    templateData: {
                        name: user.name,
                        otp,
                        appName: "Dish Score",
                        expiresInMinutes: 2,
                    },
                });
            },
            expiresIn: 2 * 60,
            otpLength: 6,
        })
    ],
    session: {
        expiresIn: env.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN,
        updateAge: env.BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE,
        cookieCache: {
            enabled: true,
            maxAge: env.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN,
        }
    },
    redirectURLS: {
        signIn: `${env.BETTER_AUTH_URL}/api/v1/auth/google/success`,
    },
    trustedOrigins: [env.BETTER_AUTH_URL || "http://localhost:5000", env.FRONTEND_URL || "http://localhost:3000"],
    advanced: {
        // disableCSRFCheck: true, // Disable CSRF check for development purposes. Make sure to enable it in production!
        cookies: {
            state: {
                attributes: {
                    sameSite: "none",
                    secure: env.NODE_ENV === "production",
                    httpOnly: true,
                    path: '/',
                }
            },
        },
        sessionToken: {
            attributes: {
                sameSite: "none",
                secure: env.NODE_ENV === "production",
                httpOnly: true,
                path: '/'
            }
        }
    }
});
