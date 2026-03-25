import { Router } from "express";
import { userRoute } from "../modules/user/user.route";
import { restaurantRoute } from "../modules/restaurant/restaurant.route";

const router =  Router();

router.use("/users", userRoute);
router.use("/restaurants", restaurantRoute);

export const indexRoute = router;