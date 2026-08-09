import { getErrorMessage } from "../../../shared/utils/i18n-messages.js";
import { prisma } from "../../../infrastructure/database/prisma.js";
import { NotFoundError } from "../../../shared/errors/index.js";
import crypto from "crypto";


function generateCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export const ReferralService = {
  async getOrCreate(userId: string) {
    const profile = await prisma.expertProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));

    let referral = await prisma.referralCode.findUnique({
      where: { expertId: profile.id },
    });

    if (!referral) {
      referral = await prisma.referralCode.create({
        data: {
          expertId: profile.id,
          code: generateCode(),
        },
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const link = `${frontendUrl}/register?ref=${referral.code}`;

    return {
      code: referral.code,
      link,
      signups: referral.signups,
      createdAt: referral.createdAt,
    };
  },

  async regenerate(userId: string) {
    const profile = await prisma.expertProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));

    const referral = await prisma.referralCode.upsert({
      where: { expertId: profile.id },
      update: { code: generateCode() },
      create: {
        expertId: profile.id,
        code: generateCode(),
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return {
      code: referral.code,
      link: `${frontendUrl}/register?ref=${referral.code}`,
      signups: referral.signups,
      createdAt: referral.createdAt,
    };
  },
};
