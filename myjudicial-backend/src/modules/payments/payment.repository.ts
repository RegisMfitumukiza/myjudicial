import { prisma } from "../../infrastructure/database/prisma.js";
import { PaymentStatus } from "../../generated/prisma/client.js";
import { Prisma } from "../../generated/prisma/client.js";

export const PaymentRepository = {
  create: async (data: Prisma.PaymentUncheckedCreateInput, tx?: any) => {
    const db = tx || prisma;
    return db.payment.create({ data });
  },

  findByBookingId: async (bookingId: string, tx?: any) => {
    const db = tx || prisma;
    return db.payment.findUnique({
      where: { bookingId },
    });
  },

  findByBookingIdWithDetails: async (bookingId: string, tx?: any) => {
    const db = tx || prisma;
    return db.payment.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            citizen: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            expert: {
              select: {
                id: true,
                displayName: true,
                momoNumber: true,
              },
            },
          },
        },
      },
    });
  },

  findByTxRef: async (txRef: string, tx?: any) => {
    const db = tx || prisma;
    return db.payment.findUnique({
      where: { txRef },
    });
  },

  findByProviderTransactionId: async (providerTransactionId: string, tx?: any) => {
    const db = tx || prisma;
    return db.payment.findFirst({
      where: { providerTransactionId },
      include: {
        booking: true,
      },
    });
  },

  findByPayoutRef: async (providerPayoutRef: string, tx?: any) => {
    const db = tx || prisma;
    return db.payment.findFirst({
      where: { providerPayoutRef },
      include: {
        booking: {
          include: {
            citizen: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            expert: {
              select: {
                id: true,
                displayName: true,
                momoNumber: true,
                user: {
                  select: {
                    id: true,
                    email: true,
                    phone: true,
                    preferredLanguage: true,
                  },
                },
              },
            },
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  },

  updateByBookingId: async (
    bookingId: string,
    data: Prisma.PaymentUpdateInput,
    tx?: any
  ) => {
    const db = tx || prisma;
    return db.payment.update({
      where: { bookingId },
      data,
    });
  },

  updateManyByPayoutRef: async (providerPayoutRef: string, data: Prisma.PaymentUpdateInput, tx?: any) => {
    const db = tx || prisma;
    return db.payment.updateMany({
      where: { providerPayoutRef },
      data,
    });
  },
};
