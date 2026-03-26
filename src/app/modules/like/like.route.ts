import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import authCheck from "../../middleware/authCheck";
import requestValidator from "../../middleware/requestValidator";
import { LikeController } from "./like.controller";
import { createLikeSchema } from "./like.validation";

const router = Router();

router.post(
  "/",
  authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CONSUMER),
  requestValidator(createLikeSchema),
  LikeController.createLike,
);
router.post(
  "/toggle",
  authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CONSUMER),
  requestValidator(createLikeSchema),
  LikeController.toggleLike,
);
router.get("/", LikeController.getLikes);
router.get("/reviews/:reviewId", LikeController.getReviewLikeSummary);
router.delete(
  "/:reviewId",
  authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CONSUMER),
  LikeController.deleteLike,
);

export const likeRoute = router;
