import { prisma } from "../../../infrastructure/database/prisma.js";
import type { CreateEducationDto, UpdateEducationDto } from "./education.schemas.js";

export const EducationRepository = {
  findAllByExpertId: async (expertId: string) => {
    return prisma.expertEducation.findMany({
      where: { expertId },
      orderBy: { yearCompleted: "desc" },
    });
  },

  findById: async (id: string) => {
    return prisma.expertEducation.findUnique({ where: { id } });
  },

  create: async (expertId: string, dto: CreateEducationDto) => {
    return prisma.expertEducation.create({
      data: { expertId, ...dto },
    });
  },

  update: async (id: string, dto: UpdateEducationDto) => {
    return prisma.expertEducation.update({
      where: { id },
      data: dto,
    });
  },

  delete: async (id: string) => {
    return prisma.expertEducation.delete({ where: { id } });
  },
};
