import { prisma } from "../../../infrastructure/database/prisma.js";
import type { CreateCertificationDto, UpdateCertificationDto } from "./certifications.schemas.js";

export const CertificationsRepository = {
  findAllByExpertId: async (expertId: string) => {
    return prisma.expertCertification.findMany({
      where: { expertId },
      orderBy: { issueDate: "desc" },
    });
  },

  findById: async (id: string) => {
    return prisma.expertCertification.findUnique({ where: { id } });
  },

  create: async (expertId: string, dto: CreateCertificationDto) => {
    return prisma.expertCertification.create({
      data: {
        expertId,
        certificateName: dto.certificateName,
        issuer: dto.issuer,
        issueDate: new Date(dto.issueDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      },
    });
  },

  update: async (id: string, dto: UpdateCertificationDto) => {
    return prisma.expertCertification.update({
      where: { id },
      data: {
        ...(dto.certificateName && { certificateName: dto.certificateName }),
        ...(dto.issuer && { issuer: dto.issuer }),
        ...(dto.issueDate && { issueDate: new Date(dto.issueDate) }),
        ...(dto.expiryDate !== undefined && {
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        }),
      },
    });
  },

  delete: async (id: string) => {
    return prisma.expertCertification.delete({ where: { id } });
  },
};
