import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import authCheck from "../../middleware/authCheck";
import requestValidator from "../../middleware/requestValidator";
import { DishController } from "./dish.controller";
import { createDishSchema, updateDishSchema } from "./dish.validation";
import { multerUpload } from "../../../config/multerConfig";

const router = Router();

router.post(
  "/",
  authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CONSUMER),
  requestValidator(createDishSchema),
  multerUpload.single("file"),
  DishController.createDish,
);
router.get("/", DishController.getDishes);
router.patch(
  "/:id",
  authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CONSUMER),
  requestValidator(updateDishSchema),
  multerUpload.single("image"),
  DishController.updateDish,
);
router.delete(
  "/:id",
  authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CONSUMER),
  DishController.deleteDish,
);

export const dishRoute = router;
