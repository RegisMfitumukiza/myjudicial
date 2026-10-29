/**
 * Safe Migration & Data Reconciliation Script for Rwanda Administrative Locations
 * 
 * Reconciles:
 * 1. ExpertProfile.city against authoritative AdministrativeDivision records
 * 2. ExpertProfile.sectorId links
 * 3. Audits suspicious default Kigali (-1.9441, 30.0619) coordinates on non-Kigali experts
 * 4. User.clientDistrictId from User.onboarding JSON
 */
import { prisma } from "../src/infrastructure/database/prisma.js";
import { LocationService } from "../src/modules/locations/location.service.js";
import { logger } from "../src/shared/utils/logger.js";

export async function reconcileLocations() {
  console.log("=== Starting Location Reconciliation Audit ===");

  const stats = {
    expertProfilesTotal: 0,
    expertProfilesReconciled: 0,
    suspiciousKigaliDefaultMarkers: [] as Array<{ expertId: string; displayName: string; city: string; address: string | null }>,
    clientOnboardingChecked: 0,
    clientDistrictsLinked: 0,
  };

  // 1. Audit and Reconcile Expert Profiles
  try {
    const experts = await prisma.expertProfile.findMany({
      select: {
        id: true,
        displayName: true,
        city: true,
        officeAddress: true,
        latitude: true,
        longitude: true,
        sectorId: true,
      },
    });

    stats.expertProfilesTotal = experts.length;

    for (const exp of experts) {
      // Check suspicious default Kigali coordinates
      const lat = exp.latitude ? Number(exp.latitude) : null;
      const lng = exp.longitude ? Number(exp.longitude) : null;

      const isKigaliCityCenter =
        lat !== null &&
        lng !== null &&
        Math.abs(lat - -1.9441) < 0.0001 &&
        Math.abs(lng - 30.0619) < 0.0001;

      const cityLower = (exp.city || "").toLowerCase();
      const isOutsideKigali =
        exp.city &&
        !cityLower.includes("kigali") &&
        !cityLower.includes("gasabo") &&
        !cityLower.includes("kicukiro") &&
        !cityLower.includes("nyarugenge");

      if (isKigaliCityCenter && isOutsideKigali) {
        stats.suspiciousKigaliDefaultMarkers.push({
          expertId: exp.id,
          displayName: exp.displayName,
          city: exp.city || "Unknown",
          address: exp.officeAddress,
        });
      }

      // Try linking sector or normalizing district name
      if (exp.city) {
        const resolved = await LocationService.resolveLocation(exp.city);
        if (resolved) {
          await prisma.expertProfile.update({
            where: { id: exp.id },
            data: {
              ...(resolved.level === "SECTOR" && !exp.sectorId && { sectorId: resolved.id }),
            },
          });
          stats.expertProfilesReconciled++;
        }
      }
    }
  } catch (err) {
    console.warn("Notice: expert profile reconciliation skipped or DB offline", err);
  }

  // 2. Reconcile Client Onboarding JSON into User.clientDistrictId
  try {
    const usersWithOnboarding = await prisma.user.findMany({
      where: {
        onboarding: { not: null as any },
        clientDistrictId: null,
      },
      select: {
        id: true,
        onboarding: true,
      },
    });

    stats.clientOnboardingChecked = usersWithOnboarding.length;

    for (const user of usersWithOnboarding) {
      const onb = user.onboarding as any;
      const rawDistrict = onb?.citizen?.district || onb?.district;
      if (rawDistrict && typeof rawDistrict === "string") {
        const resolved = await LocationService.resolveLocation(rawDistrict);
        if (resolved) {
          await prisma.user.update({
            where: { id: user.id },
            data: { clientDistrictId: resolved.id },
          });
          stats.clientDistrictsLinked++;
        }
      }
    }
  } catch (err) {
    console.warn("Notice: client onboarding reconciliation skipped or DB offline", err);
  }

  console.log("=== Location Reconciliation Results ===");
  console.log(`Expert Profiles Checked: ${stats.expertProfilesTotal}`);
  console.log(`Expert Profiles Reconciled: ${stats.expertProfilesReconciled}`);
  console.log(`Suspicious Kigali Default Markers Detected: ${stats.suspiciousKigaliDefaultMarkers.length}`);
  if (stats.suspiciousKigaliDefaultMarkers.length > 0) {
    console.log("Details of Suspicious Records:", JSON.stringify(stats.suspiciousKigaliDefaultMarkers, null, 2));
  }
  console.log(`Client Onboarding Records Checked: ${stats.clientOnboardingChecked}`);
  console.log(`Client Districts Linked: ${stats.clientDistrictsLinked}`);

  return stats;
}

if (process.argv[1]?.endsWith("reconcile-locations.ts")) {
  reconcileLocations()
    .catch((err) => {
      logger.error("Reconciliation error", { err });
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
