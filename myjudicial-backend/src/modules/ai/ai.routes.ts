import { Router } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { aiLimiter } from "../../shared/middleware/rateLimiting.js";
import {
  analyzeCase,
  transcribeAudio,
  translateText,
  getRecommendations,
  aiHealthCheck,
  aiMultipartUpload,
} from "./ai.controller.js";

const router = Router();

router.get("/health", asyncHandler(aiHealthCheck));
router.post("/analyze", authenticate, aiLimiter, asyncHandler(analyzeCase));
router.post("/transcribe", authenticate, aiLimiter, aiMultipartUpload.single("audio"), asyncHandler(transcribeAudio));
router.post("/translate", authenticate, aiLimiter, asyncHandler(translateText));
router.post("/recommend", authenticate, aiLimiter, asyncHandler(getRecommendations));

export default router;
