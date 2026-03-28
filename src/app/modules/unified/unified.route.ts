import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import authCheck from "../../middleware/authCheck";
import requestValidator from "../../middleware/requestValidator";
import { UnifiedController } from "./unified.controller";
import { createUnifiedSchema } from "./unified.validation";
import { multerUpload } from "../../../config/multerConfig";

const router = Router();

router.post(
  "/create-all",
  authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CONSUMER),
  multerUpload.fields([
    { name: "restaurantImages", maxCount: 10 },
    { name: "dishImages", maxCount: 5 },
    { name: "reviewImages", maxCount: 5 },
  ]),
  requestValidator(createUnifiedSchema),
  UnifiedController.createRestaurantDishReview,
);

export const unifiedRoute = router;
