import { Router } from "express";
import { dishRoute } from "../modules/dish/dish.route";
import { profileRoute } from "../modules/profile/profile.route";
import { reviewRoute } from "../modules/review/review.route";
import { userRoute } from "../modules/user/user.route";
import { restaurantRoute } from "../modules/restaurant/restaurant.route";
import { authRoute } from "../modules/auth/auth.route";

const router =  Router();

router.use("/auth", authRoute)
router.use("/users", userRoute);
router.use("/profile", profileRoute);
router.use("/restaurants", restaurantRoute);
router.use("/dishes", dishRoute);
router.use("/reviews", reviewRoute);

 const IndexRoute = router;
 export default IndexRoute;