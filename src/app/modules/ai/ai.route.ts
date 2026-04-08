import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import authCheck from "../../middleware/authCheck";
import requestValidator from "../../middleware/requestValidator";
import { AIController } from "./ai.controller";
import {
  chatRequestSchema,
  reviewDescriptionRequestSchema,
  searchSuggestionsRequestSchema,
} from "./ai.validation";

const router = Router();

router.post(
  "/chat",
  authCheck(UserRole.CONSUMER, UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  requestValidator(chatRequestSchema),
  AIController.chat,
);

router.post(
  "/review-description",
  authCheck(UserRole.CONSUMER, UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  requestValidator(reviewDescriptionRequestSchema),
  AIController.generateReviewDescription,
);

router.post(
  "/search-suggestions",
  authCheck(UserRole.CONSUMER, UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  requestValidator(searchSuggestionsRequestSchema),
  AIController.searchSuggestions,
);

export const aiRoute = router;
