import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import authCheck from "../../middleware/authCheck";
import { StatsController } from "./stats.controller";

const router = Router();

router.get("/public", StatsController.getPublicStats);

router.get(
  "/",
  authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CONSUMER),
  StatsController.getDashboardStats,
);

export const statsRoute = router;
