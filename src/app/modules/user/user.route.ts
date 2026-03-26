import { Router } from "express";
import { userController } from "./user.controller";
import requestValidator from "../../middleware/requestValidator";
import { createAdminSchema, updateAdminSchema } from "./user.validation";
import authCheck from "../../middleware/authCheck";
import { UserRole } from "../../../generated/prisma/enums";
import { multerUpload } from "../../../config/multerConfig";

const router = Router();

router.post("/admins", authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN), multerUpload.single("profilePhoto"), requestValidator(createAdminSchema), userController.createAdmin);
router.get("/", authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN), userController.getAllUsers);
router.get("/admins/:userId", userController.getAdminByUserId);
router.patch("/admins/:userId", authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN), multerUpload.single("profilePhoto"), requestValidator(updateAdminSchema), userController.updateAdmin);
router.delete("/admins/:userId", authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN), userController.deleteAdmin);


export const userRoute = router;

