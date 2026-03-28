import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import authCheck from "../../middleware/authCheck";
import requestValidator from "../../middleware/requestValidator";
import { ReviewController } from "./review.controller";
import { createReviewSchema, updateReviewSchema } from "./review.validation";
import { multerUpload } from "../../../config/multerConfig";

const router = Router();

router.post(
  "/",
  authCheck(UserRole.CONSUMER),
  multerUpload.array("images", 5),
  requestValidator(createReviewSchema),
  ReviewController.createReview,
);
router.get("/", ReviewController.getReviews);
// user specific reviews

router.get(
  "/my",
  authCheck(UserRole.CONSUMER),
  ReviewController.getMyReviews,
);

router.patch(
  "/my/:id",
  authCheck(UserRole.CONSUMER),
  multerUpload.array("images", 5),
  requestValidator(updateReviewSchema),
  ReviewController.updateMyReview,
);
router.delete(
  "/my/:id",
  authCheck(UserRole.CONSUMER),
  ReviewController.deleteMyReview,
);

router.get("/:id", ReviewController.getReviewById);

router.patch(
  "/:id",
  authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CONSUMER),
  multerUpload.array("images", 5),
  requestValidator(updateReviewSchema),
  ReviewController.updateReview,
);
router.delete(
  "/:id",
  authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CONSUMER),
  ReviewController.deleteReview,
);


export const reviewRoute = router;
