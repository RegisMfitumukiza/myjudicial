import type { Request, Response } from "express";
import multer from "multer";
import { logger } from "../../shared/utils/logger.js";
import { getSignedDownloadUrl } from "../../infrastructure/storage/oci-object-storage.service.js";

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
    logger.error(`AI service connection failed: /recommend (${elapsed}ms)`, error);
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
