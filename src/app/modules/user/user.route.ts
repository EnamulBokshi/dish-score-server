import { Router } from "express";
import { userController } from "./user.controller";
import requestValidator from "../../middleware/requestValidator";
import { createAdminSchema, updateAdminSchema } from "./user.validation";

const router = Router();

router.post("/admins", requestValidator(createAdminSchema), userController.createAdmin);
router.get("/", userController.getAllUsers);
router.get("/admins/:userId", userController.getAdminByUserId);
router.patch("/admins/:userId", requestValidator(updateAdminSchema), userController.updateAdmin);
router.delete("/admins/:userId", userController.deleteAdmin);


export const userRoute = router;

