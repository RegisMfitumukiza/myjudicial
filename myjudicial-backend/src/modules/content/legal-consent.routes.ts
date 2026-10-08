import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../infrastructure/database/prisma.js";
import { authenticateOptional, authenticate } from "../../shared/middleware/authenticate.js";
import { ContentService } from "./content.service.js";
import { toContentLocale } from "./content.types.js";
import { logger } from "../../shared/utils/logger.js";
import type { LegalDocumentType, ConsentContext } from "../../generated/prisma/client.js";

const router = Router();

const recordConsentSchema = z.object({
  documentType: z.enum(["TERMS", "PRIVACY", "COOKIES", "ADVOCATE_AGREEMENT"]),
  version: z.string().trim().min(1).max(20),
  context: z.enum(["REGISTRATION", "BOOKING_CHECKOUT", "PORTAL_REACCEPTANCE", "VOLUNTARY_UPDATE"]).default("REGISTRATION"),
});

/**
 * GET /content/legal/status
 * Returns current published version of each legal document and the calling user's consent record if authenticated.
 */
router.get("/legal/status", authenticateOptional, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locale = toContentLocale(req.query.locale);
    const userId = req.user?.id;

    // Fetch published status & version for core legal documents with zero-crash resilience
    let termsPage: any = null;
    let privacyPage: any = null;
    let cookiesPage: any = null;

    try {
      [termsPage, privacyPage, cookiesPage] = await Promise.all([
        ContentService.getPublished("TERMS", locale).catch(() => null),
        ContentService.getPublished("PRIVACY", locale).catch(() => null),
        ContentService.getPublished("COOKIES", locale).catch(() => null),
      ]);
    } catch (e) {
      logger.warn("[LegalStatus] Content service query failed, returning baseline status", { error: e });
    }

    // Check if TERMS is published and has substantive sections (more than 4 placeholder blocks)
    const isTermsApproved = Boolean(
      termsPage &&
      termsPage.status === "published" &&
      Array.isArray(termsPage.blocks) &&
      termsPage.blocks.length > 4
    );

    const documents = {
      TERMS: {
        slug: "TERMS",
        status: isTermsApproved ? "published" : "draft",
        version: termsPage?.version ?? "1.0",
        effectiveDate: termsPage?.effectiveDate ?? null,
        isFinalized: isTermsApproved,
      },
      PRIVACY: {
        slug: "PRIVACY",
        status: privacyPage ? "published" : "draft",
        version: privacyPage?.version ?? "1.0",
        effectiveDate: privacyPage?.effectiveDate ?? null,
        isFinalized: Boolean(privacyPage && privacyPage.status === "published"),
      },
      COOKIES: {
        slug: "COOKIES",
        status: cookiesPage ? "published" : "draft",
        version: cookiesPage?.version ?? "1.0",
        effectiveDate: cookiesPage?.effectiveDate ?? null,
        isFinalized: Boolean(cookiesPage && cookiesPage.status === "published"),
      },
    };

    let userConsent: {
      isCompliant: boolean;
      consents: Array<{
        documentType: string;
        version: string;
        acceptedAt: string;
        context: string;
      }>;
    } | null = null;

    if (userId) {
      try {
        const userConsents = await prisma.userLegalConsent.findMany({
          where: { userId },
          orderBy: { acceptedAt: "desc" },
        });

        const latestByType = new Map<string, string>();
        for (const consent of userConsents) {
          if (!latestByType.has(consent.documentType)) {
            latestByType.set(consent.documentType, consent.version);
          }
        }

        const currentTermsVersion = documents.TERMS.version;
        const acceptedTermsVersion = latestByType.get("TERMS");
        const isCompliant = isTermsApproved
          ? acceptedTermsVersion === currentTermsVersion
          : true;

        userConsent = {
          isCompliant,
          consents: userConsents.map((c) => ({
            documentType: c.documentType,
            version: c.version,
            acceptedAt: c.acceptedAt.toISOString(),
            context: c.context,
          })),
        };
      } catch (err) {
        logger.warn("[LegalStatus] User consent query failed", { error: err, userId });
      }
    }

    res.json({
      success: true,
      data: {
        documents,
        userConsent,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /content/legal/consent
 * Authenticated endpoint to record versioned legal consent in the immutable ledger.
 */
router.post("/legal/consent", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const parsed = recordConsentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid consent payload" });
      return;
    }

    const { documentType, version, context } = parsed.data;
    const locale = toContentLocale(req.query.locale || req.body.locale);
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"]?.slice(0, 500);

    const consent = await prisma.userLegalConsent.create({
      data: {
        userId,
        documentType: documentType as LegalDocumentType,
        version,
        context: context as ConsentContext,
        locale,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });

    logger.info(`[LegalConsent] User ${userId} accepted ${documentType} v${version} via ${context}`);

    res.status(201).json({
      success: true,
      data: {
        consentId: consent.id,
        documentType: consent.documentType,
        version: consent.version,
        acceptedAt: consent.acceptedAt.toISOString(),
        context: consent.context,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
