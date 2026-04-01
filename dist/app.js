import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import cors from "cors";
import { env } from "./config/env";
import qs from "qs";
import logger from "./app/middleware/requestLogger";
import IndexRoute from "./app/routes";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { NotFoundMiddleware } from "./app/middleware/notFound";
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
app.use(logger);
let authHandlerPromise = null;
const getAuthHandler = async () => {
    if (!authHandlerPromise) {
        authHandlerPromise = (async () => {
            const [{ toNodeHandler }, { auth }] = await Promise.all([
                import("better-auth/node"),
                import("./app/lib/auth"),
            ]);
            return toNodeHandler(auth);
        })();
    }
    return authHandlerPromise;
};
app.use("/api/auth/", async (req, res, next) => {
    try {
        const authHandler = await getAuthHandler();
        return authHandler(req, res, next);
    }
    catch (error) {
        return next(error);
    }
});
// Logger middleware
app.use(express.urlencoded({ extended: true }));
// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
app.get("/", (req, res) => {
    res.send("Hello World!");
});
app.use("/api/v1", IndexRoute);
app.use(globalErrorHandler);
app.use(NotFoundMiddleware);
export default app;
