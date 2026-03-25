import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import authCheck from "../../middleware/authCheck";
import requestValidator from "../../middleware/requestValidator";
import { ReviewController } from "./review.controller";
import { createReviewSchema, updateReviewSchema } from "./review.validation";

const router = Router();

router.post(
  "/",
  authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CONSUMER),
  requestValidator(createReviewSchema),
  ReviewController.createReview,
);
router.get("/", ReviewController.getReviews);
router.patch(
  "/:id",
  authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CONSUMER),
  requestValidator(updateReviewSchema),
  ReviewController.updateReview,
);
router.delete(
  "/:id",
  authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CONSUMER),
  ReviewController.deleteReview,
);

export const reviewRoute = router;
