import express from "express";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth";
import path from "node:path";
import cors from "cors";
import { env } from "./config/env";
import qs from "qs";
import logger from "./app/middleware/requestLogger";
const app = express();
app.set("query parser", (str) => qs.parse(str));
app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), "src/templates"));
app.use(cors({
    origin: [env.FRONTEND_URL, env.BETTER_AUTH_URL, "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use("api/auth", toNodeHandler(auth));
// Logger middleware
app.use(logger);
app.use(express.urlencoded({ extended: true }));
// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
export default app;
