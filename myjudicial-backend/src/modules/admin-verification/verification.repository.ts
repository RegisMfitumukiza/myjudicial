import { prisma } from "../../infrastructure/database/prisma.js";
import type { VerificationStatus } from "../../generated/prisma/client.js";

export const VerificationRepository = {
  /** List verification requests by status — admin queue */
  findByStatus: async (status: string, skip: number, take: number) => {
    return prisma.expertVerification.findMany({
      where: { status: status as any },
      orderBy: { createdAt: "asc" },
      skip,
      take,
      include: {
        expert: {
          select: {
            id: true,
            displayName: true,
            barNumber: true,
            primarySpecialty: true,
            city: true,
            status: true,
            profileImageObjectKey: true,
            user: { select: { email: true, firstName: true, lastName: true, preferredLanguage: true } },
          },
        },
      },
    });
  },

  countByStatus: async (status: string) => {
    return prisma.expertVerification.count({ where: { status: status as any } });
  },

  findById: async (id: string) => {
    return prisma.expertVerification.findUnique({
      where: { id },
      include: {
        expert: {
          select: {
            id: true,
            displayName: true,
            barNumber: true,
            primarySpecialty: true,
            city: true,
            status: true,
            profileImageObjectKey: true,
            user: { select: { email: true, firstName: true, lastName: true, preferredLanguage: true } },
          },
        },
      },
    });
  },

  findByExpertId: async (expertId: string) => {
    return prisma.expertVerification.findFirst({
      where: { expertId },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Create a new verification request when expert submits documents */
  create: async (
    expertId: string,
    identityDocumentObjectKey?: string,
    barCertificateObjectKey?: string,
    additionalDocumentKeys: string[] = []
  ) => {
    return prisma.expertVerification.create({
      data: {
        expertId,
        status: "PENDING",
        identityDocumentObjectKey,
        barCertificateObjectKey,
        additionalDocumentKeys,
      },
    });
  },

  /** Approve — sets verification APPROVED and expert status VERIFIED */
  approve: async (verificationId: string, reviewedById: string) => {
    return prisma.$transaction(async (tx) => {
      const verification = await tx.expertVerification.update({
        where: { id: verificationId },
        data: {
          status: "APPROVED",
          reviewedById,
          reviewedAt: new Date(),
        },
        include: { expert: { select: { id: true } } },
      });

      await tx.expertProfile.update({
        where: { id: verification.expert.id },
        data: { status: "VERIFIED" },
      });

      await tx.mapMarker.updateMany({
        where: { expertId: verification.expert.id },
        data: { isVisible: true },
      });

      return verification;
    });
  },

  /** Reject — sets verification REJECTED and expert status REJECTED */
  reject: async (verificationId: string, reviewedById: string, reason: string) => {
    return prisma.$transaction(async (tx) => {
      const verification = await tx.expertVerification.update({
        where: { id: verificationId },
        data: {
          status: "REJECTED",
          rejectionReason: reason,
          reviewedById,
          reviewedAt: new Date(),
        },
        include: { expert: { select: { id: true } } },
      });

      await tx.expertProfile.update({
        where: { id: verification.expert.id },
        data: { status: "REJECTED" },
      });

      await tx.mapMarker.updateMany({
        where: { expertId: verification.expert.id },
        data: { isVisible: false },
      });

      return verification;
    });
  },
};
