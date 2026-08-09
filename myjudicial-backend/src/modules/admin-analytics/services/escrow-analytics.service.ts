/**
 * Escrow Analytics Service
 * 
 * Detailed escrow fund tracking and analytics
 */

import { EscrowLedgerRepository } from "../../payments/escrow.repository.js";
import type { EscrowAnalytics } from "../types/analytics.types.js";

export const EscrowAnalyticsService = {
  async getEscrowAnalytics(): Promise<EscrowAnalytics> {
    const escrowStats = await EscrowLedgerRepository.getEscrowStats();

    return {
      balance: {
        totalEscrowBalance: escrowStats.totalEscrowBalance,
        lockedFunds: escrowStats.byStatus.LOCKED.total,
        heldInEscrow: escrowStats.byStatus.HELD_IN_ESCROW.total,
      },
      flows: {
        totalDisbursed: escrowStats.totalDisbursed,
        totalRefunded: escrowStats.totalRefunded,
        pendingDisbursements: escrowStats.byStatus.LOCKED.total + escrowStats.byStatus.HELD_IN_ESCROW.total,
      },
      byStatus: escrowStats.byStatus,
    };
  },
};