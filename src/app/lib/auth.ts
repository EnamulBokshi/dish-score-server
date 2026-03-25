import { PrismaClient } from "@prisma/client/extension";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { bearer, emailOTP } from "better-auth/plugins";
import { sendEmail } from "../utils/email";

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
            defaultValue: "CONSUMER",
        },
        status: {
            type: "string",
            required: true,
            defaultValue: "ACTIVE",
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
      clientId: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET,

     
    }
  },

  emailVerification: {
    sendOnSignIn: true,
    sendOnSignUp: true,
    autoSignInAfterVerification: true,

  },
  plugins: [
    bearer(),
    // emailOTP({
    //   overrideDefaultEmailVerification: true,
    //   async sendVerificationOTP({email, otp, type}) {
    //     console.log("Sending OTP", {email, otp, type});
    //     if(type === "email-verification"){
    //       const user = await prisma.user.findUnique({
    //         where: {
    //           email
    //         }
    //       });

    //       if(!user) {
    //         console.error(`User with email ${email} not found for sending OTP`);
    //         return;
    //       }
    //       if(user.role === UserRole.SUPER_ADMIN) {
    //         console.log(`User with email ${email} is a super admin. Skipping OTP email.`);
    //         return;
    //       }

    //       if(user && !user.emailVerified) {
    //         sendEmail({
    //           to: email,
    //           subject: "Verify your email",
    //           template: "otp",
    //           templateData: {
    //             name: user.name,
    //             otp,
    //           }
    //         })
    //       }
    //     } else if(type === "forget-password"){
    //       const user = await prisma.user.findUnique({
    //         where: {
    //           email
    //         }
    //       });
    //       if(user) {
    //         sendEmail({
    //           to: email,
    //           subject: "Reset your password",
    //           template: "reset-password-otp",
    //           templateData: {
    //             name: user.name,
    //             otp,
    //           }
    //         })
    //       }
    //     }
    //   },
    //   expiresIn: 2 * 60, // 2 minutes
    //   otpLength: 6,
    // })
  ],
  session: {
    expiresIn: 60*60*60*24*1, // 1 day
    updateAge: 60*60*60*24*1, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60*60*60*24*1, // 1 day
    }
  },
  redirectURLS:{
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
