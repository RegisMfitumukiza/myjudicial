import { prisma } from "../../../infrastructure/database/prisma.js";
import type { CreateServiceDto, UpdateServiceDto } from "./services.schemas.js";

export const ServicesRepository = {
  findAllByExpertId: async (expertId: string, activeOnly = false) => {
    return prisma.legalService.findMany({
      where: {
        expertId,
        ...(activeOnly && { isActive: true }),
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  },

  findById: async (id: string) => {
    return prisma.legalService.findUnique({ where: { id } });
  },

  findDefaultByExpertId: async (expertId: string) => {
    return prisma.legalService.findFirst({ where: { expertId, isDefault: true } });
  },

  create: async (expertId: string, dto: CreateServiceDto) => {
    return prisma.legalService.create({
      data: { expertId, ...dto },
    });
  },

  createDefault: async (
    expertId: string,
    data: {
      name: string;
      description?: string;
      category?: string;
      deliveryMode: string;
      durationMin: number;
      flatFee: number;
      currency: string;
    }
  ) => {
    return prisma.legalService.create({
      data: {
        expertId,
        ...data,
        isActive: true,
        isDefault: true,
      },
    });
  },

  update: async (id: string, dto: UpdateServiceDto) => {
    return prisma.legalService.update({
      where: { id },
      data: dto,
    });
  },

  delete: async (id: string) => {
    return prisma.legalService.delete({ where: { id } });
  },

  hasBookings: async (serviceId: string): Promise<boolean> => {
    const count = await prisma.booking.count({ where: { serviceId } });
    return count > 0;
  },
};
