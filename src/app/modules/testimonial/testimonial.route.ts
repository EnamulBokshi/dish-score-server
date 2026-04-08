import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import authCheck from "../../middleware/authCheck";
import requestValidator from "../../middleware/requestValidator";
import { TestimonialController } from "./testimonial.controller";
import { createTestimonialSchema, updateTestimonialSchema } from "./testimonial.validation";

const router = Router();

router.post(
  "/",
  authCheck(UserRole.CONSUMER, UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  requestValidator(createTestimonialSchema),
  TestimonialController.createTestimonial,
);

router.get(
  "/",
  authCheck(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  TestimonialController.getTestimonials,
);

router.get(
  "/my",
  authCheck(UserRole.CONSUMER, UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  TestimonialController.getMyTestimonials,
);

router.get(
  "/:id",
  authCheck(UserRole.CONSUMER, UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  TestimonialController.getTestimonialById,
);

router.patch(
  "/:id",
  authCheck(UserRole.CONSUMER, UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  requestValidator(updateTestimonialSchema),
  TestimonialController.updateTestimonial,
);

router.delete(
  "/:id",
  authCheck(UserRole.CONSUMER, UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  TestimonialController.deleteTestimonial,
);

export const testimonialRoute = router;
