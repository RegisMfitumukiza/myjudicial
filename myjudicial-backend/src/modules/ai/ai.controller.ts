import type { Request, Response } from "express";
import multer from "multer";
import { logger } from "../../shared/utils/logger.js";
import { getSignedDownloadUrl } from "../../infrastructure/storage/oci-object-storage.service.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { LegalSpecialty } from "../../generated/prisma/client.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:5000";
const AI_SERVICE_KEY = process.env.AI_SERVICE_KEY ?? "";

/** Multer instance for multipart/form-data parsing (memory storage, 10MB limit). */
export const aiMultipartUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

async function proxyToAiService(
  req: Request,
  res: Response,
  path: string,
  options: { method?: string } = {}
) {
  const url = `${AI_SERVICE_URL}${path}`;
  const method = options.method ?? req.method;

  const headers: Record<string, string> = {};

  if (AI_SERVICE_KEY) {
    headers["X-API-Key"] = AI_SERVICE_KEY;
  }

  let body: string | FormData | undefined;

  if (method !== "GET" && method !== "HEAD") {
    body = JSON.stringify(req.body);
    headers["Content-Type"] = "application/json";
  }

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`AI service error: ${response.status} (${elapsed}ms) - ${errorBody}`);

      // Sanitize error messages — never expose raw Python/traceback details to clients
      let userMessage = "An error occurred while processing your request.";
      if (response.status === 400) {
        userMessage = "The request could not be processed. Please check your input and try again.";
      } else if (response.status === 422) {
        userMessage = "The provided data is invalid. Please review and try again.";
      } else if (response.status === 429) {
        userMessage = "Too many requests. Please wait a moment and try again.";
      } else if (response.status === 500) {
        userMessage = "An internal error occurred. Please try again later.";
      } else if (response.status === 502 || response.status === 503) {
        userMessage = "The AI service is temporarily unavailable. Please try again later.";
      }

      res.status(response.status).json({
        success: false,
        error: "AI service error",
        message: userMessage,
      });
      return;
    }

    const data = await response.json();
    logger.info(`AI service call: ${path} (${elapsed}ms)`);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.error(`AI service connection failed: ${path} (${elapsed}ms)`, error);
    res.status(502).json({
      success: false,
      error: "AI service unavailable",
      message: "The AI service is not reachable. Please try again later.",
    });
  }
}

export async function analyzeCase(req: Request, res: Response) {
  await proxyToAiService(req, res, "/api/v1/analyze/");
}

export async function transcribeAudio(req: Request, res: Response) {
  const url = `${AI_SERVICE_URL}/api/v1/transcribe/`;

  const headers: Record<string, string> = {};
  if (AI_SERVICE_KEY) {
    headers["X-API-Key"] = AI_SERVICE_KEY;
  }

  // Reconstruct FormData from multer-parsed request
  const formData = new FormData();
  if (req.file) {
    formData.append(
      "audio",
      new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype || "audio/webm" }),
      req.file.originalname || "recording.webm"
    );
  }
  if (req.body?.language) {
    formData.append("language", req.body.language);
  }

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`AI service error: ${response.status} (${elapsed}ms) - ${errorBody}`);

      let userMessage = "An error occurred while processing your request.";
      if (response.status === 400) {
        userMessage = "The request could not be processed. Please check your input and try again.";
      } else if (response.status === 422) {
        userMessage = "The provided data is invalid. Please review and try again.";
      } else if (response.status === 429) {
        userMessage = "Too many requests. Please wait a moment and try again.";
      } else if (response.status === 500) {
        userMessage = "An internal error occurred. Please try again later.";
      } else if (response.status === 502 || response.status === 503) {
        userMessage = "The AI service is temporarily unavailable. Please try again later.";
      }

      res.status(response.status).json({
        success: false,
        error: "AI service error",
        message: userMessage,
      });
      return;
    }

    const data = await response.json();
    logger.info(`AI service call: /transcribe (${elapsed}ms)`);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.error(`AI service connection failed: /transcribe (${elapsed}ms)`, error);
    res.status(502).json({
      success: false,
      error: "AI service unavailable",
      message: "The AI service is not reachable. Please try again later.",
    });
  }
}

export async function translateText(req: Request, res: Response) {
  await proxyToAiService(req, res, "/api/v1/translate/");
}

export async function getRecommendations(req: Request, res: Response) {
  const url = `${AI_SERVICE_URL}/api/v1/recommend/`;
  const headers: Record<string, string> = {};
  if (AI_SERVICE_KEY) {
    headers["X-API-Key"] = AI_SERVICE_KEY;
  }
  headers["Content-Type"] = "application/json";

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(req.body),
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`AI service error: ${response.status} (${elapsed}ms) - ${errorBody}`);

      // If AI service is down or temporarily unavailable, gracefully fall back to database
      if (response.status === 502 || response.status === 503) {
        logger.warn(`[EdgeFallback] AI service returned ${response.status} — using database fallback recommendations`);
        await databaseFallbackRecommendations(req.body, startTime, res);
        return;
      }

      let userMessage = "An error occurred while processing your request.";
      if (response.status === 400) {
        userMessage = "The request could not be processed. Please check your input and try again.";
      } else if (response.status === 422) {
        userMessage = "The provided data is invalid. Please review and try again.";
      } else if (response.status === 429) {
        userMessage = "Too many requests. Please wait a moment and try again.";
      } else if (response.status === 500) {
        userMessage = "An internal error occurred. Please try again later.";
      }

      res.status(response.status).json({
        success: false,
        error: "AI service error",
        message: userMessage,
      });
      return;
    }

    const data = await response.json();

    // If AI service returned 0 recommendations but a specialty was analyzed or provided,
    // double-check with database fallback to ensure clients are never left with an empty result
    if ((!data?.recommendations || data.recommendations.length === 0) && (req.body?.specialty || data?.case_analysis?.specialty)) {
      const specialty = req.body?.specialty || data?.case_analysis?.specialty;
      if (specialty && specialty !== "UNKNOWN") {
        logger.info(`[EdgeFallback] AI service returned 0 recommendations for specialty=${specialty} — checking database fallback`);
        await databaseFallbackRecommendations({ ...req.body, specialty }, startTime, res);
        return;
      }
    }

    // Resolve profile_image_url from raw storage keys to signed URLs
    if (data?.recommendations && Array.isArray(data.recommendations)) {
      await Promise.all(
        data.recommendations.map(async (rec: any) => {
          const key = rec?.expert?.profile_image_url;
          if (key && typeof key === "string" && !key.startsWith("http")) {
            try {
              const { url: signedUrl } = await getSignedDownloadUrl(key);
              rec.expert.profile_image_url = signedUrl;
            } catch (err) {
              logger.warn(`Failed to sign image URL for key: ${key}`, err);
              rec.expert.profile_image_url = null;
            }
          }
        })
      );
    }

    logger.info(`AI service call: /recommend (${elapsed}ms)`);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.warn(`[EdgeFallback] AI service connection failed: /recommend (${elapsed}ms) — falling back to database`, error);
    await databaseFallbackRecommendations(req.body, startTime, res);
  }
}

async function databaseFallbackRecommendations(
  body: any,
  startTime: number,
  res: Response
) {
  try {
    const text: string = body?.text || "";
    let rawSpecialty: string | undefined = body?.specialty;
    let specialty: LegalSpecialty | undefined;

    // Normalize potential aliases from AI service (e.g. BUSINESS_LAW -> COMMERCIAL_LAW)
    if (rawSpecialty) {
      if (rawSpecialty === "BUSINESS_LAW" || rawSpecialty === "CORPORATE") {
        specialty = LegalSpecialty.COMMERCIAL_LAW;
      } else if (rawSpecialty === "LABOR_LAW") {
        specialty = LegalSpecialty.EMPLOYMENT_LAW;
      } else if (Object.values(LegalSpecialty).includes(rawSpecialty as LegalSpecialty)) {
        specialty = rawSpecialty as LegalSpecialty;
      }
    }

    if (!specialty && text) {
      const lower = text.toLowerCase();
      if (/stole|steal|theft|crime|criminal|police|arrest|fraud|jail|assault|robbery/.test(lower)) {
        specialty = LegalSpecialty.CRIMINAL_LAW;
      } else if (/land|property|plot|title|boundary|tenant|eviction|cadastre/.test(lower)) {
        specialty = LegalSpecialty.LAND_LAW;
      } else if (/divorce|child|custody|marriage|alimony|spouse|adoption/.test(lower)) {
        specialty = LegalSpecialty.FAMILY_LAW;
      } else if (/business|contract|company|partner|commercial|corporate|shares/.test(lower)) {
        specialty = LegalSpecialty.COMMERCIAL_LAW;
      } else if (/work|job|employer|employee|fired|salary|wage|workplace/.test(lower)) {
        specialty = LegalSpecialty.EMPLOYMENT_LAW;
      } else if (/tax|rra|revenue|audit|vat|customs/.test(lower)) {
        specialty = LegalSpecialty.TAX_LAW;
      } else if (/visa|passport|immigration|asylum|citizenship|permit/.test(lower)) {
        specialty = LegalSpecialty.IMMIGRATION_LAW;
      }
    }

    const limit = typeof body?.limit === "number" ? Math.min(body.limit, 10) : 5;

    let experts = await prisma.expertProfile.findMany({
      where: {
        status: "VERIFIED",
        ...(specialty
          ? {
              OR: [
                { primarySpecialty: specialty },
                { specialties: { has: specialty } },
              ],
            }
          : {}),
      },
      take: limit,
      orderBy: [
        { averageRating: "desc" },
        { reviewCount: "desc" },
        { yearsExperience: "desc" },
      ],
    });

    if (experts.length === 0) {
      experts = await prisma.expertProfile.findMany({
        where: { status: "VERIFIED" },
        take: limit,
        orderBy: [
          { averageRating: "desc" },
          { reviewCount: "desc" },
          { yearsExperience: "desc" },
        ],
      });
    }

    const recommendations = await Promise.all(
      experts.map(async (expert, index) => {
        let signedUrl: string | null = null;
        if (expert.profileImageObjectKey) {
          try {
            const { url } = await getSignedDownloadUrl(expert.profileImageObjectKey);
            signedUrl = url;
          } catch {
            signedUrl = null;
          }
        }

        return {
          expert: {
            id: expert.id,
            user_id: expert.userId,
            full_name: expert.displayName,
            specialties: expert.specialties,
            bio: expert.bio,
            hourly_rate: expert.baseConsultationFee ? Number(expert.baseConsultationFee) : null,
            rating: expert.averageRating ? Number(expert.averageRating) : null,
            review_count: expert.reviewCount,
            languages: expert.languages,
            years_of_experience: expert.yearsExperience,
            location: expert.city || "Rwanda",
            profile_image_url: signedUrl,
          },
          score: Math.max(0.4, 0.75 - index * 0.05),
          rank: index + 1,
          match_quality: "High",
          explanation: {
            summary: `Verified legal expert in ${expert.primarySpecialty || "law"}.`,
            key_factors: ["Verified credentials", "Specialty match"],
          },
        };
      })
    );

    const elapsed = Date.now() - startTime;
    logger.info(`[EdgeFallback] Database recommendations served: ${recommendations.length} experts (${elapsed}ms)`);

    res.status(200).json({
      success: true,
      data: {
        success: true,
        query: text,
        case_analysis: {
          specialty: specialty || "GENERAL_PRACTICE",
          urgency_level: "MEDIUM",
          budget_range: null,
          key_entities: [],
        },
        recommendations,
        total: recommendations.length,
        filters_applied: {
          specialty: specialty || null,
          max_budget: null,
          min_score: 0.15,
        },
        processing_time: elapsed / 1000,
        fallback_used: true,
      },
    });
  } catch (fallbackError) {
    logger.error("Database fallback recommendations failed:", fallbackError);
    res.status(502).json({
      success: false,
      error: "AI service unavailable",
      message: "The AI service is not reachable. Please try again later.",
    });
  }
}

export async function aiHealthCheck(_req: Request, res: Response) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`);
    const data = await response.json();
    res.status(200).json({ success: true, ai_service: data });
  } catch {
    res.status(503).json({
      success: false,
      error: "AI service is not reachable",
    });
  }
}
