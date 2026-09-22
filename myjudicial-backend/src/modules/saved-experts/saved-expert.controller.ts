import { Request, Response, NextFunction } from "express";
import { prisma } from "../../infrastructure/database/prisma.js";
import { AuthorizationError, NotFoundError, ValidationError } from "../../shared/errors/index.js";

export class SavedExpertController {
  static async listSavedExperts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AuthorizationError("UNAUTHORIZED");
      }

      const saved = await prisma.savedExpert.findMany({
        where: { userId },
        include: {
          expert: {
            select: {
              id: true,
              displayName: true,
              bio: true,
              primarySpecialty: true,
              specialties: true,
              baseConsultationFee: true,
              currency: true,
              averageRating: true,
              reviewCount: true,
              city: true,
              country: true,
              profileImageObjectKey: true,
              yearsExperience: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json({
        success: true,
        data: saved.map((s) => ({
          id: s.id,
          expertId: s.expertId,
          savedAt: s.createdAt,
          expert: s.expert,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  static async saveExpert(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AuthorizationError("UNAUTHORIZED");
      }

      const { expertId } = req.body;
      if (!expertId) {
        throw new ValidationError("REQUIRED_FIELD_MISSING");
      }

      // Check expert exists
      const expert = await prisma.expertProfile.findUnique({ where: { id: expertId } });
      if (!expert) {
        throw new NotFoundError("EXPERT_NOT_FOUND");
      }

      // Upsert (idempotent)
      const saved = await prisma.savedExpert.upsert({
        where: { userId_expertId: { userId, expertId } },
        create: { userId, expertId },
        update: {},
      });

      return res.status(201).json({
        success: true,
        data: { id: saved.id, expertId: saved.expertId, savedAt: saved.createdAt },
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeSavedExpert(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AuthorizationError("UNAUTHORIZED");
      }

      const expertId = req.params.expertId as string;

      const existing = await prisma.savedExpert.findUnique({
        where: { userId_expertId: { userId, expertId } },
      });

      if (!existing) {
        throw new NotFoundError("EXPERT_NOT_FOUND");
      }

      await prisma.savedExpert.delete({
        where: { userId_expertId: { userId, expertId } },
      });

      return res.status(200).json({ success: true, message: "Expert removed from saved list" });
    } catch (error) {
      next(error);
    }
  }

  static async checkSaved(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AuthorizationError("UNAUTHORIZED");
      }

      const expertId = req.params.expertId as string;

      const existing = await prisma.savedExpert.findUnique({
        where: { userId_expertId: { userId, expertId } },
      });

      return res.status(200).json({
        success: true,
        data: { saved: !!existing },
      });
    } catch (error) {
      next(error);
    }
  }
}
