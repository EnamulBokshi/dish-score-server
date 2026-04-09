import dotenv from "dotenv";
import status from "http-status";
import AppError from "../app/helpers/errorHelpers/AppError";
dotenv.config();
const loadEnvVariables = () => {
    const requiredEnvVars = [
        "PORT",
        "NODE_ENV",
        "BETTER_AUTH_URL",
        "DATABASE_URL",
        "BETTER_AUTH_SECRET",
        "ACCESS_TOKEN_SECRET",
        "REFRESH_TOKEN_SECRET",
        "ACCESS_TOKEN_EXPIRES_IN",
        "REFRESH_TOKEN_EXPIRES_IN",
        "BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN",
        "BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE",
        "SUPER_ADMIN_NAME",
        "SUPER_ADMIN_EMAIL",
        "SUPER_ADMIN_PASSWORD",
        "SUPER_ADMIN_PHONE",
        "SUPER_ADMIN_PROFILE_PHOTO_URL",
        "EMAIL_SENDER_SMTP_USER",
        "EMAIL_SENDER_SMTP_PASSWORD",
        "EMAIL_SENDER_SMTP_HOST",
        "EMAIL_SENDER_SMTP_PORT",
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET",
        "GOOGLE_CALLBACK_URL",
        "FRONTEND_URL",
    ];
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            throw new AppError(status.NOT_FOUND, `Missing required environment variable: ${envVar}`);
        }
    }
    return {
        PORT: process.env.PORT,
        NODE_ENV: process.env.NODE_ENV,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
        DATABASE_URL: process.env.DATABASE_URL,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
        ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
        REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
        // Values are in seconds for JWT and Better Auth session configuration.
        ACCESS_TOKEN_EXPIRES_IN: 60 * 60 * 24, // 1 day
        REFRESH_TOKEN_EXPIRES_IN: 60 * 60 * 24 * 7, // 7 days
        BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: 60 * 60 * 24, // 1 day
        BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: 60 * 60 * 24, // 1 day
        SUPER_ADMIN_NAME: process.env.SUPER_ADMIN_NAME,
        SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
        SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
        SUPER_ADMIN_PHONE: process.env.SUPER_ADMIN_PHONE,
        SUPER_ADMIN_PROFILE_PHOTO_URL: process.env
            .SUPER_ADMIN_PROFILE_PHOTO_URL,
        AI: {
            PROVIDER: process.env.AI_PROVIDER || "auto",
            OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
            OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
            OPENROUTER_STRICT_MODEL: process.env.OPENROUTER_STRICT_MODEL !== "false",
            OPENAI_API_KEY: process.env.OPENAI_API_KEY,
            OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
        },
        SMTP_SENDER: {
            USER: process.env.EMAIL_SENDER_SMTP_USER,
            PASSWORD: process.env.EMAIL_SENDER_SMTP_PASSWORD,
            HOST: process.env.EMAIL_SENDER_SMTP_HOST,
            PORT: parseInt(process.env.EMAIL_SENDER_SMTP_PORT, 10),
        },
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
        FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
        CLOUDINARY: {
            CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
            API_KEY: process.env.CLOUDINARY_API_KEY,
            API_SECRET: process.env.CLOUDINARY_API_SECRET,
        },
    };
};
export const env = loadEnvVariables();
