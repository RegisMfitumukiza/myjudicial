import {
  Heart, Briefcase, Users, Building2, Shield, Landmark,
  Globe, Scale, Gavel, Lightbulb, type LucideIcon,
} from "lucide-react";

/** Map LegalSpecialty enum values to Lucide icons. */
export const SPECIALTY_ICON_MAP: Record<string, LucideIcon> = {
  FAMILY_LAW: Heart,
  COMMERCIAL_LAW: Briefcase,
  EMPLOYMENT_LAW: Users,
  LAND_LAW: Building2,
  CRIMINAL_LAW: Shield,
  TAX_LAW: Landmark,
  IMMIGRATION_LAW: Globe,
  CORPORATE_LAW: Scale,
  CONTRACT_LAW: Gavel,
  INTELLECTUAL_PROPERTY: Lightbulb,
};

/**
 * Brand-compliant icon chip styling for practice area cards.
 * Uses only brand-blue tinted backgrounds — no non-brand colors.
 */
export const SPECIALTY_ICON_CHIP =
  "bg-brand-blue/10 text-brand-dark dark:bg-white/10 dark:text-white";
