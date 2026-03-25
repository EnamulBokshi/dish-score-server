import { Router } from "express";
import { RestaurantController } from "./restaurant.controller";
import requestValidator from "../../middleware/requestValidator";
import { createRestaurantSchema, updateRestaurantSchema } from "./restaurant.validation";

const router = Router();

router.post("/", requestValidator(createRestaurantSchema), RestaurantController.createRestaurant);
router.get("/", RestaurantController.getRestaurants);
router.patch("/:id", requestValidator(updateRestaurantSchema), RestaurantController.updateRestaurant);
router.delete("/:id", RestaurantController.softDeleteRestaurant);

export const restaurantRoute = router;

