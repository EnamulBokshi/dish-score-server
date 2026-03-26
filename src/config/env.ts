import dotenv from "dotenv";
import status from "http-status";
import AppError from "../app/helpers/errorHelpers/AppError";


dotenv.config();

interface EnvConfig {
  PORT: string;
  NODE_ENV: string;
  BETTER_AUTH_URL: string;
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  ACCESS_TOKEN_SECRET: string;
  REFRESH_TOKEN_SECRET: string;
  ACCESS_TOKEN_EXPIRES_IN: number;
  REFRESH_TOKEN_EXPIRES_IN: number;
  BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: number;
  BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: number;
  SUPER_ADMIN_NAME: string;
  SUPER_ADMIN_EMAIL: string;
  SUPER_ADMIN_PASSWORD: string;
  SUPER_ADMIN_PHONE: string;
  SUPER_ADMIN_PROFILE_PHOTO_URL: string;

  SMTP_SENDER: {
    USER: string;
    PASSWORD: string;
    HOST: string;
    PORT: number;
  };
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  FRONTEND_URL: string;
  CLOUDINARY: {
    CLOUD_NAME: string;
    API_KEY: string;
    API_SECRET: string;
  };

}

const loadEnvVariables = (): EnvConfig => {
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
  ];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new AppError(
        status.NOT_FOUND,
        `Missing required environment variable: ${envVar}`,
      );
    }
  }
  return {
    PORT: process.env.PORT as string,
    NODE_ENV: process.env.NODE_ENV as string,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
    // Values are in seconds for JWT and Better Auth session configuration.
    ACCESS_TOKEN_EXPIRES_IN: 60 * 60 * 24, // 1 day
    REFRESH_TOKEN_EXPIRES_IN: 60 * 60 * 24 * 7, // 7 days
    BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: 60 * 60 * 24, // 1 day
    BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: 60 * 60 * 24, // 1 day
    SUPER_ADMIN_NAME: process.env.SUPER_ADMIN_NAME as string,
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL as string,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD as string,
    SUPER_ADMIN_PHONE: process.env.SUPER_ADMIN_PHONE as string,
    SUPER_ADMIN_PROFILE_PHOTO_URL: process.env
      .SUPER_ADMIN_PROFILE_PHOTO_URL as string,
    SMTP_SENDER: {
      USER: process.env.EMAIL_SENDER_SMTP_USER as string,
      PASSWORD: process.env.EMAIL_SENDER_SMTP_PASSWORD as string,
      HOST: process.env.EMAIL_SENDER_SMTP_HOST as string,
      PORT: parseInt(process.env.EMAIL_SENDER_SMTP_PORT as string, 10),
    },
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string || "http://localhost:3000",
    CLOUDINARY: {
      CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
      API_KEY: process.env.CLOUDINARY_API_KEY as string,
      API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
    },
  };
};

export const env = loadEnvVariables();
