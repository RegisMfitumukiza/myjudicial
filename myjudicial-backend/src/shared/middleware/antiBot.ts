import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

/**
 * Known honeypot field names to check in request body.
 * Legitimate UI forms never fill these fields.
 */
const HONEYPOT_FIELDS = [
  "website_url",
  "_hp_website",
  "_hp_company",
  "company_fax",
  "honeypot",
] as const;

/**
 * Minimum elapsed time (in milliseconds) a human user needs to interact
 * with and submit a public form. Automated bots submit in < 500ms.
 */
const MIN_SUBMISSION_TIME_MS = 1500;

/**
 * Middleware that silently intercepts automated spam bots targeting public
 * submission routes (e.g., Careers application, Contact inqueries).
 *
 * When a bot is detected, we respond with a synthetic HTTP 200 OK
 * ("tarpit / shadow-drop") so the bot believes its spam was accepted.
 * This prevents the bot from retrying or adapting while completely protecting
 * the backend, Brevo email quota, and team inboxes.
 */
export function antiBotGuard(req: Request, res: Response, next: NextFunction): void {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;

    // 1. Check for Honeypot trap trigger
    for (const field of HONEYPOT_FIELDS) {
      const val = body[field];
      if (typeof val === "string" && val.trim().length > 0) {
        logger.warn("AntiBot: Honeypot trap triggered by bot", {
          field,
          ip: req.ip,
          path: req.originalUrl || req.path,
          userAgent: req.get("user-agent"),
        });

        // Return synthetic success to fool the bot
        res.status(200).json({
          success: true,
          message: "Application submitted successfully",
        });
        return;
      }
    }

    // 2. Check for Speed Trap (Time-to-submit gate)
    if (body._form_render_ts) {
      const renderTs = Number(body._form_render_ts);
      if (Number.isFinite(renderTs)) {
        const elapsed = Date.now() - renderTs;

        // If submitted too fast (under 1.5 seconds), it's an automated script
        if (elapsed > 0 && elapsed < MIN_SUBMISSION_TIME_MS) {
          logger.warn("AntiBot: Submission speed trap triggered by bot", {
            elapsedMs: elapsed,
            minRequiredMs: MIN_SUBMISSION_TIME_MS,
            ip: req.ip,
            path: req.originalUrl || req.path,
            userAgent: req.get("user-agent"),
          });

          // Return synthetic success to fool the bot
          res.status(200).json({
            success: true,
            message: "Application submitted successfully",
          });
          return;
        }
      }
    }

    // Pass through for genuine human requests
    next();
  } catch (err) {
    logger.error("AntiBot middleware encountered an error; failing open", { err });
    next();
  }
}
