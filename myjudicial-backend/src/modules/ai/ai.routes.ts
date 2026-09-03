import { Router } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
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

// AI endpoints are public — anyone can use triage without signing up.
// Rate limiting (aiLimiter) prevents abuse. Auth is only required for
// booking an expert, which is a separate endpoint.
router.get("/health", asyncHandler(aiHealthCheck));
router.post("/analyze", aiLimiter, asyncHandler(analyzeCase));
router.post("/transcribe", aiLimiter, aiMultipartUpload.single("audio"), asyncHandler(transcribeAudio));
router.post("/translate", aiLimiter, asyncHandler(translateText));
router.post("/recommend", aiLimiter, asyncHandler(getRecommendations));

export default router;
