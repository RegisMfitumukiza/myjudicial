import { Request, Response } from "express";
import { prisma } from "../../infrastructure/database/prisma.js";

export class SavedExpertController {
  static async listSavedExperts(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
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
      console.error("List saved experts error:", error);
      return res.status(500).json({ success: false, message: "Failed to list saved experts" });
    }
  }

  static async saveExpert(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const { expertId } = req.body;
      if (!expertId) {
        return res.status(400).json({ success: false, message: "expertId is required" });
      }

      // Check expert exists
      const expert = await prisma.expertProfile.findUnique({ where: { id: expertId } });
      if (!expert) {
        return res.status(404).json({ success: false, message: "Expert not found" });
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
      console.error("Save expert error:", error);
      return res.status(500).json({ success: false, message: "Failed to save expert" });
    }
  }

  static async removeSavedExpert(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const expertId = req.params.expertId as string;

      const existing = await prisma.savedExpert.findUnique({
        where: { userId_expertId: { userId, expertId } },
      });

      if (!existing) {
        return res.status(404).json({ success: false, message: "Not saved" });
      }

      await prisma.savedExpert.delete({
        where: { userId_expertId: { userId, expertId } },
      });

      return res.status(200).json({ success: true, message: "Expert removed from saved list" });
    } catch (error) {
      console.error("Remove saved expert error:", error);
      return res.status(500).json({ success: false, message: "Failed to remove saved expert" });
    }
  }

  static async checkSaved(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
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
      console.error("Check saved error:", error);
      return res.status(500).json({ success: false, message: "Failed to check saved status" });
    }
  }
}
