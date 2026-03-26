import { Router } from "express";
import { RestaurantController } from "./restaurant.controller";
import requestValidator from "../../middleware/requestValidator";
import { createRestaurantSchema, updateRestaurantSchema } from "./restaurant.validation";
import authCheck from "../../middleware/authCheck";
import { UserRole } from "../../../generated/prisma/enums";
import { multerUpload } from "../../../config/multerConfig";

const router = Router();

router.post("/", authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CONSUMER), multerUpload.array("images"), requestValidator(createRestaurantSchema), RestaurantController.createRestaurant);
router.get("/", RestaurantController.getRestaurants);
router.patch("/:id", authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CONSUMER), multerUpload.array("images"), requestValidator(updateRestaurantSchema), RestaurantController.updateRestaurant);
router.delete("/:id", authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CONSUMER), RestaurantController.softDeleteRestaurant);

export const restaurantRoute = router;

