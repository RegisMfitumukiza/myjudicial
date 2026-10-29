import { ALL_RWANDA_LOCATIONS, RWANDA_AUTH_DISTRICTS, type LocationEntry } from "./locations-data";

/**
 * Authoritative coordinate map for all Rwandan provinces, districts, sectors, and common aliases.
 * Generated dynamically from the authoritative NISR dataset.
 */
export const RWANDA_DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = (() => {
  const map: Record<string, { lat: number; lng: number }> = {};
  for (const loc of ALL_RWANDA_LOCATIONS) {
    map[loc.name] = { lat: loc.lat, lng: loc.lng };
    if (loc.aliases) {
      for (const alias of loc.aliases) {
        map[alias] = { lat: loc.lat, lng: loc.lng };
      }
    }
  }
  return map;
})();

export type DistrictCoordinatesResult = {
  lat: number;
  lng: number;
  canonicalName: string;
  level?: "PROVINCE" | "DISTRICT" | "SECTOR";
  parentName?: string;
};

/**
 * Resolves a search query to its authoritative Rwanda coordinates.
 * Handles exact matches, aliases (e.g. Butare -> Huye, Gisenyi -> Rubavu),
 * common prefixes/suffixes, and sector-level resolution (e.g. Gatsata, Kimironko, Kanombe).
 */
export function findDistrictCoordinates(
  districtName?: string | null
): DistrictCoordinatesResult | null {
  if (!districtName) return null;
  const raw = districtName.trim().toLowerCase();
  // Strip common prefixes/suffixes: "district of nyarugenge", "nyarugenge district", "akarere ka nyarugenge", "umurenge wa gatsata"
  const clean = raw
    .replace(/\b(district|akarere|sector|umurenge|ville|city|province|intara|ka|wa|ya|of)\b/gi, "")
    .replace(/[,.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return null;

  // 1. Exact match on official location name (prioritize DISTRICT then SECTOR then PROVINCE)
  const exactDistrict = ALL_RWANDA_LOCATIONS.find(
    (loc) => loc.level === "DISTRICT" && loc.name.toLowerCase() === clean
  );
  if (exactDistrict) {
    return {
      lat: exactDistrict.lat,
      lng: exactDistrict.lng,
      canonicalName: exactDistrict.name,
      level: exactDistrict.level,
      parentName: exactDistrict.parentName,
    };
  }

  const exactSector = ALL_RWANDA_LOCATIONS.find(
    (loc) => loc.level === "SECTOR" && loc.name.toLowerCase() === clean
  );
  if (exactSector) {
    return {
      lat: exactSector.lat,
      lng: exactSector.lng,
      canonicalName: exactSector.name,
      level: exactSector.level,
      parentName: exactSector.parentName,
    };
  }

  const exactProvince = ALL_RWANDA_LOCATIONS.find(
    (loc) => loc.level === "PROVINCE" && loc.name.toLowerCase() === clean
  );
  if (exactProvince) {
    return {
      lat: exactProvince.lat,
      lng: exactProvince.lng,
      canonicalName: exactProvince.name,
      level: exactProvince.level,
      parentName: exactProvince.parentName,
    };
  }

  // 2. Exact match on aliases
  const aliasMatch = ALL_RWANDA_LOCATIONS.find((loc) =>
    loc.aliases?.some((a) => a.toLowerCase() === clean)
  );
  if (aliasMatch) {
    return {
      lat: aliasMatch.lat,
      lng: aliasMatch.lng,
      canonicalName: aliasMatch.name,
      level: aliasMatch.level,
      parentName: aliasMatch.parentName,
    };
  }

  // 3. Substring match (e.g. "Gatsata, Kigali" or "District of Huye")
  // First check if any sector name is contained in the clean query
  const sectorSub = ALL_RWANDA_LOCATIONS.find(
    (loc) => loc.level === "SECTOR" && (clean.includes(loc.name.toLowerCase()) || (clean.length >= 4 && loc.name.toLowerCase().includes(clean)))
  );
  if (sectorSub) {
    return {
      lat: sectorSub.lat,
      lng: sectorSub.lng,
      canonicalName: sectorSub.name,
      level: sectorSub.level,
      parentName: sectorSub.parentName,
    };
  }

  // Then check district
  const districtSub = ALL_RWANDA_LOCATIONS.find(
    (loc) => loc.level === "DISTRICT" && (clean.includes(loc.name.toLowerCase()) || (clean.length >= 4 && loc.name.toLowerCase().includes(clean)))
  );
  if (districtSub) {
    return {
      lat: districtSub.lat,
      lng: districtSub.lng,
      canonicalName: districtSub.name,
      level: districtSub.level,
      parentName: districtSub.parentName,
    };
  }

  // Then check province
  const provinceSub = ALL_RWANDA_LOCATIONS.find(
    (loc) => loc.level === "PROVINCE" && (clean.includes(loc.name.toLowerCase()) || (clean.length >= 4 && loc.name.toLowerCase().includes(clean)))
  );
  if (provinceSub) {
    return {
      lat: provinceSub.lat,
      lng: provinceSub.lng,
      canonicalName: provinceSub.name,
      level: provinceSub.level,
      parentName: provinceSub.parentName,
    };
  }

  return null;
}

/**
 * Finds the nearest official District to the given geographic coordinates.
 * Evaluates against the 30 official Rwanda districts.
 */
export function detectDistrictFromCoordinates(lat: number, lng: number): string {
  let closestDistrict = "Nyarugenge";
  let minDistanceSq = Infinity;

  for (const district of RWANDA_AUTH_DISTRICTS) {
    const dLat = lat - district.lat;
    const dLng = lng - district.lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closestDistrict = district.name;
    }
  }

  return closestDistrict;
}

/**
 * Extracts a known district name from a free-text address string.
 */
export function extractDistrictFromAddress(address?: string | null): string | null {
  if (!address) return null;
  const lower = address.toLowerCase();

  // Check 30 official districts first
  for (const district of RWANDA_AUTH_DISTRICTS) {
    if (lower.includes(district.name.toLowerCase())) {
      return district.name;
    }
    if (district.aliases) {
      for (const alias of district.aliases) {
        if (lower.includes(alias.toLowerCase())) {
          return district.name;
        }
      }
    }
  }

  return null;
}
