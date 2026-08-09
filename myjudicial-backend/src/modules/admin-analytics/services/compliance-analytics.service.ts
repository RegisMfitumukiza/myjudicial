/**
 * Compliance Analytics Service
 * 
 * Verification and compliance metrics
 */

import { AnalyticsRepository } from "../repositories/analytics.repository.js";
import type { ComplianceAnalytics } from "../types/analytics.types.js";

export const ComplianceAnalyticsService = {
  async getComplianceAnalytics(): Promise<ComplianceAnalytics> {
    const { verificationCounts, certCounts } = 
      await AnalyticsRepository.getComplianceStats();

    // Process verification status
    const approved = verificationCounts.find((v) => v.status === "APPROVED")?._count || 0;
    const pending = verificationCounts.find((v) => v.status === "PENDING")?._count || 0;
    const rejected = verificationCounts.find((v) => v.status === "REJECTED")?._count || 0;

    // Calculate expiring certifications (next 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringCerts = certCounts.filter((cert) => {
      if (!cert.expiryDate) return false;
      return cert.expiryDate >= now && cert.expiryDate <= thirtyDaysFromNow;
    }).length;

    const expiredCerts = certCounts.filter((cert) => {
      if (!cert.expiryDate) return false;
      return cert.expiryDate < now;
    }).length;

    return {
      verifications: {
        approved,
        pending,
        inReview: 0, // No IN_REVIEW status in schema
        rejected,
        total: approved + pending + rejected,
      },
      certifications: {
        total: certCounts.length,
        expiringSoon: expiringCerts,
        expired: expiredCerts,
      },
    };
  },
};
