import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import authCheck from "../../middleware/authCheck";
import requestValidator from "../../middleware/requestValidator";
import { ProfileController } from "./profile.controller";
import { updateOwnerProfileSchema, updateReviewerProfileSchema } from "./profile.validation";

const router = Router();

router.get("/me", authCheck(), ProfileController.getMyProfile);
router.patch(
  "/me/owner",
  authCheck(UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  requestValidator(updateOwnerProfileSchema),
  ProfileController.updateOwnerProfile,
);
router.patch(
  "/me/reviewer",
  authCheck(UserRole.CONSUMER, UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  requestValidator(updateReviewerProfileSchema),
  ProfileController.updateReviewerProfile,
);

export const profileRoute = router;
