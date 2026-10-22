import { z } from "zod";

export const socialLinksSchema = z.object({
  x: z.string().trim().optional(),
  linkedin: z.string().trim().optional(),
  facebook: z.string().trim().optional(),
  instagram: z.string().trim().optional(),
  youtube: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
});

export const coreValueSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500),
  icon: z.string().trim().min(1).max(50),
});

export const careerRoleSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1).max(120),
  department: z.string().trim().min(1).max(80),
  location: z.string().trim().min(1).max(80),
  type: z.string().trim().min(1).max(50),
  applyUrl: z.string().trim().max(300).optional().default(""),
  // Optional, forward-looking fields. The public careers page renders them when
  // present and ignores them when absent, so nothing here is required today.
  slug: z.string().trim().max(120).optional(),
  summary: z.string().trim().max(300).optional(),
  description: z.string().trim().max(2000).optional(),
  responsibilities: z.array(z.string().trim().min(1).max(300)).max(30).optional(),
  requirements: z.array(z.string().trim().min(1).max(300)).max(30).optional(),
  niceToHave: z.array(z.string().trim().min(1).max(300)).max(30).optional(),
  applicationInstructions: z.string().trim().max(1000).optional(),
  published: z.boolean().optional(),
});

export const supplementalFaqSchema = z.object({
  id: z.string().trim().min(1),
  question: z.string().trim().min(1).max(200),
  answer: z.string().trim().min(1).max(2000),
  category: z.string().trim().min(1).max(50),
});

export const milestoneItemSchema = z.object({
  id: z.string().trim().min(1),
  year: z.string().trim().min(1).max(20),
  title: z.string().trim().min(1).max(150),
  description: z.string().trim().min(1).max(500),
});

export const updateSettingsSchema = z.object({
  platformName: z.string().min(1).max(100).optional(),
  maintenanceMode: z.boolean().optional(),
  defaultRole: z.enum(["CITIZEN", "EXPERT"]).optional(),
  platformFeePercent: z.number().min(0).max(100).optional(),
  minEscrowDurationSeconds: z.number().int().min(0).optional(),
  paymentMode: z.enum(["BOOKING_FIRST", "PAYMENT_REQUIRED"]).optional(),
  airtelEnabled: z.boolean().optional(),
  socialLinks: socialLinksSchema.optional(),
  // Company & Contact Details
  supportEmail: z.string().email().optional(),
  hotlinePhone: z.string().trim().optional(),
  whatsappNumber: z.string().trim().optional(),
  officeBuilding: z.string().trim().optional(),
  officeStreet: z.string().trim().optional(),
  officeDistrict: z.string().trim().optional(),
  officePoBox: z.string().trim().optional(),
  supportWorkingHours: z.string().trim().optional(),
  // Public Editorial Content (About Us)
  aboutVision: z.string().trim().optional(),
  aboutMission: z.string().trim().optional(),
  aboutStory: z.string().trim().optional(),
  aboutHeroBadge: z.string().trim().optional(),
  aboutHeroTitle: z.string().trim().optional(),
  aboutHeroSubtitle: z.string().trim().optional(),
  aboutCoreValues: z.array(coreValueSchema).optional(),
  aboutMilestones: z.array(milestoneItemSchema).optional(),
  // Careers & Talent
  careersEmail: z.string().email().optional(),
  careersHiringStatus: z.enum(["ACTIVELY_HIRING", "TALENT_POOL", "PAUSED"]).optional(),
  careersHeroTitle: z.string().trim().optional(),
  careersHeroSubtitle: z.string().trim().optional(),
  careersOpenRoles: z.array(careerRoleSchema).optional(),
  careersRequirePhone: z.boolean().optional(),
  careersRequireLinkedIn: z.boolean().optional(),
  careersRequirePortfolio: z.boolean().optional(),
  careersRequireResume: z.boolean().optional(),
  careersRequireCoverNote: z.boolean().optional(),
  // Help & Supplemental FAQs
  supplementalFaqs: z.array(supplementalFaqSchema).optional(),
  // Legal Policies & Compliance
  legalEffectiveDate: z.string().trim().optional(),
  dpoContactEmail: z.string().email().optional(),
  // SEO & Open Graph Social Sharing
  ogImageUrl: z.string().trim().optional(),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional(),
  seoKeywords: z.string().trim().optional(),
  // Brand & Public Identity
  platformTagline: z.string().trim().optional(),
  copyrightNotice: z.string().trim().optional(),
  // Maintenance & Broadcast Notices
  maintenanceNotice: z.string().trim().optional(),
  // Legal & Regulatory Disclaimers
  legalDisclaimer: z.string().trim().optional(),
  // Consultation Governance Rules
  minAdvanceBookingHours: z.number().int().min(0).max(168).optional(),
  cancellationGraceHours: z.number().int().min(0).max(168).optional(),
});
