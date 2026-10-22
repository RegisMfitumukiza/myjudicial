/**
 * Geospatial utilities for MyJudicial search, map, and cards.
 */

/**
 * Standard Haversine formula to compute geodesic distance between two points in km.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Earth's mean radius in kilometers
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Standardized industrial distance formatter across MyJudicial:
 * - < 1 km: "450 m"
 * - 1 km to 9.9 km: "1.2 km"
 * - >= 10 km: "14 km"
 */
export function formatDistance(km: number | undefined | null): string {
  if (km == null || isNaN(km) || km < 0) return "0 m";
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

/**
 * Cleans and formats raw address strings:
 * - Strips leading/trailing commas, periods, and stray whitespace
 * - Removes accidental duplicate commas (e.g. ", , KN 4")
 * - Combines officeAddress with city without repeating segments
 */
export function formatCleanAddress(
  officeAddress?: string | null,
  city?: string | null
): string {
  const parts: string[] = [];

  if (officeAddress) {
    const cleaned = officeAddress
      .replace(/<[^>]*>/g, "") // Strip HTML / XML tags (e.g. <nomsken>)
      .replace(/^[\s,.-]+|[\s,.-]+$/g, "")
      .replace(/\s*,\s*,+/g, ", ")
      .trim();
    if (cleaned) parts.push(cleaned);
  }

  if (city) {
    const cleanedCity = city
      .replace(/<[^>]*>/g, "")
      .replace(/^[\s,.-]+|[\s,.-]+$/g, "")
      .trim();
    if (
      cleanedCity &&
      !parts.some((p) => p.toLowerCase().includes(cleanedCity.toLowerCase()))
    ) {
      parts.push(cleanedCity);
    }
  }

  return parts.join(", ");
}

/**
 * Round coordinate to 4 decimal places (~11m resolution) to stabilize cache keys.
 */
export function roundCoord(val: number): number {
  return Math.round(val * 10000) / 10000;
}
