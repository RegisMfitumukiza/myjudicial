import { prisma } from "../../../infrastructure/database/prisma.js";
import { NotFoundError } from "../../../shared/errors/index.js";
import type { CreateQuotationDto, UpdateQuotationDto, UpdateQuotationStatusDto } from "./quotations.schemas.js";

export const QuotationsService = {
  async getAll(expertId: string) {
    return prisma.quotation.findMany({
      where: { expertId },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string, expertId: string) {
    const quotation = await prisma.quotation.findFirst({
      where: { id, expertId },
    });
    if (!quotation) throw new NotFoundError("Quotation");
    return quotation;
  },

  async create(expertId: string, dto: CreateQuotationDto) {
    return prisma.quotation.create({
      data: {
        expertId,
        clientName: dto.clientName,
        clientEmail: dto.clientEmail,
        clientPhone: dto.clientPhone,
        title: dto.title,
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        notes: dto.notes,
      },
    });
  },

  async update(id: string, expertId: string, dto: UpdateQuotationDto) {
    const existing = await prisma.quotation.findFirst({
      where: { id, expertId },
    });
    if (!existing) throw new NotFoundError("Quotation");

    return prisma.quotation.update({
      where: { id },
      data: {
        ...(dto.clientName !== undefined && { clientName: dto.clientName }),
        ...(dto.clientEmail !== undefined && { clientEmail: dto.clientEmail }),
        ...(dto.clientPhone !== undefined && { clientPhone: dto.clientPhone }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.validUntil !== undefined && { validUntil: new Date(dto.validUntil) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  },

  async updateStatus(id: string, expertId: string, dto: UpdateQuotationStatusDto) {
    const existing = await prisma.quotation.findFirst({
      where: { id, expertId },
    });
    if (!existing) throw new NotFoundError("Quotation");

    return prisma.quotation.update({
      where: { id },
      data: { status: dto.status },
    });
  },

  async delete(id: string, expertId: string) {
    const existing = await prisma.quotation.findFirst({
      where: { id, expertId },
    });
    if (!existing) throw new NotFoundError("Quotation");

    await prisma.quotation.delete({ where: { id } });
  },
};
