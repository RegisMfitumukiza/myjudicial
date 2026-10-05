import { Router } from "express";
import { ContentService } from "./content.service.js";
import {
  CONTENT_PAGE_SLUGS,
  CONTENT_LOCALES,
  toContentLocale,
} from "./content.types.js";
import { AdminSettingService } from "../settings/admin-setting.service.js";
import {
  sendCareerApplicationEmail,
  sendContactInquiryEmail,
} from "../../infrastructure/email/email.service.js";
import { antiBotGuard } from "../../shared/middleware/antiBot.js";
import { publicFormLimiter } from "../../shared/middleware/rateLimiting.js";

const router = Router();

/**
 * Public, unauthenticated read of a published content page.
 *
 * `GET /content/pages/:slug?locale=fr`
 *
 * Returns `{ page: null }` when the page has never been published, which is the
 * signal for the frontend to render its unpublished state. The response also
 * reports which locale was actually served so a visitor reading the English
 * fallback can be told.
 */
router.get("/pages/:slug", async (req, res, next) => {
  try {
    const slug = String(req.params.slug).toUpperCase();
    if (!(CONTENT_PAGE_SLUGS as readonly string[]).includes(slug)) {
      res.status(404).json({ success: false, error: "Unknown content page" });
      return;
    }

    const locale = toContentLocale(req.query.locale);

    const result = await ContentService.getPublishedWithFallback(
      slug as (typeof CONTENT_PAGE_SLUGS)[number],
      locale
    );

    res.json({
      success: true,
      data: {
        page: result.page,
        servedLocale: result.servedLocale,
        isFallback: result.isFallback,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Public submission of a job application.
 *
 * `POST /content/careers/apply`
 */
router.post("/careers/apply", publicFormLimiter, antiBotGuard, async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      roleTitle,
      linkedin,
      portfolio,
      resumeLink,
      resumeFileName,
      resumeBase64,
      coverNote,
    } = req.body ?? {};

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      res.status(400).json({ success: false, error: "Full Name is required" });
      return;
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({ success: false, error: "Valid email address is required" });
      return;
    }
    if (!coverNote || typeof coverNote !== "string" || !coverNote.trim()) {
      res.status(400).json({ success: false, error: "Cover note is required" });
      return;
    }

    // Determine target careers inbox from Admin Platform Settings
    let careersEmail = "support@myjudicial.com";
    try {
      const settings = await AdminSettingService.getAll();
      careersEmail = settings.data.supportEmail || "support@myjudicial.com";
    } catch {
      // Fallback to default
    }

    await sendCareerApplicationEmail({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? String(phone).trim() : undefined,
      roleTitle: roleTitle ? String(roleTitle).trim() : undefined,
      linkedin: linkedin ? String(linkedin).trim() : undefined,
      portfolio: portfolio ? String(portfolio).trim() : undefined,
      resumeLink: resumeLink ? String(resumeLink).trim() : undefined,
      resumeFileName: resumeFileName ? String(resumeFileName).trim() : undefined,
      resumeBase64: resumeBase64 ? String(resumeBase64) : undefined,
      coverNote: coverNote.trim(),
      careersEmail,
    });

    res.status(200).json({
      success: true,
      message: "Application submitted successfully",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Public submission of a general contact inquiry.
 *
 * `POST /content/contact/inquiry`
 */
router.post("/contact/inquiry", publicFormLimiter, antiBotGuard, async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      department,
      reference,
      subject,
      message,
    } = req.body ?? {};

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      res.status(400).json({ success: false, error: "Full Name is required" });
      return;
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({ success: false, error: "Valid email address is required" });
      return;
    }
    if (!subject || typeof subject !== "string" || !subject.trim()) {
      res.status(400).json({ success: false, error: "Subject is required" });
      return;
    }
    if (!message || typeof message !== "string" || message.trim().length < 10) {
      res.status(400).json({ success: false, error: "Message must be at least 10 characters" });
      return;
    }

    // Determine target support inbox from Admin Platform Settings
    let supportEmail = "support@myjudicial.com";
    try {
      const settings = await AdminSettingService.getAll();
      supportEmail = settings.data.supportEmail || "support@myjudicial.com";
    } catch {
      // Fallback to default
    }

    // Generate unique official ticket ID: e.g. MJ-2026-K9X2P
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const ticketId = `MJ-2026-${randomSuffix}`;

    await sendContactInquiryEmail({
      ticketId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? String(phone).trim() : undefined,
      department: department ? String(department).trim() : "general",
      reference: reference ? String(reference).trim() : undefined,
      subject: subject.trim(),
      message: message.trim(),
      supportEmail,
    });

    res.status(200).json({
      success: true,
      data: {
        ticketId,
      },
      message: "Inquiry submitted successfully",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
