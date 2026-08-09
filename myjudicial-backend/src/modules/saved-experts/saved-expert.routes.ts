import { Router } from "express";
import { SavedExpertController } from "./saved-expert.controller.js";
import { authenticate } from "../../shared/middleware/authenticate.js";

const router = Router();

/**
 * GET /api/v1/saved-experts
 * List saved experts for the authenticated user
 */
router.get("/", authenticate, SavedExpertController.listSavedExperts);

/**
 * POST /api/v1/saved-experts
 * Save an expert
 */
router.post("/", authenticate, SavedExpertController.saveExpert);

/**
 * DELETE /api/v1/saved-experts/:expertId
 * Remove a saved expert
 */
router.delete("/:expertId", authenticate, SavedExpertController.removeSavedExpert);

/**
 * GET /api/v1/saved-experts/check/:expertId
 * Check if an expert is saved
 */
router.get("/check/:expertId", authenticate, SavedExpertController.checkSaved);

export default router;
