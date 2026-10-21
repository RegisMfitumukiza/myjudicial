export const RWANDA_DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Kigali City — Districts
  "Nyarugenge": { lat: -1.9540, lng: 30.0520 },
  "Gasabo": { lat: -1.9356, lng: 30.1086 },
  "Kicukiro": { lat: -1.9864, lng: 30.1019 },
  "Kigali": { lat: -1.9441, lng: 30.0619 },

  // Kigali — Nyarugenge sectors / neighborhoods
  "Nyamirambo": { lat: -1.9800, lng: 30.0400 },
  "Muhima": { lat: -1.9550, lng: 30.0600 },
  "Nyakabanda": { lat: -1.9700, lng: 30.0450 },
  "Gitega": { lat: -1.9500, lng: 30.0550 },
  "Kigali City Center": { lat: -1.9441, lng: 30.0619 },
  "Downtown Kigali": { lat: -1.9441, lng: 30.0619 },

  // Kigali — Gasabo sectors / neighborhoods
  "Gishushu": { lat: -1.9300, lng: 30.0900 },
  "Kimironko": { lat: -1.9200, lng: 30.1100 },
  "Remera": { lat: -1.9500, lng: 30.1100 },
  "Kacyiru": { lat: -1.9350, lng: 30.0900 },
  "Gisozi": { lat: -1.9050, lng: 30.0750 },
  "Kibagabaga": { lat: -1.9150, lng: 30.1050 },
  "Rusororo": { lat: -1.8700, lng: 30.1300 },
  "Gikomero": { lat: -1.8500, lng: 30.1600 },
  "Ndera": { lat: -1.9000, lng: 30.1700 },
  "Jabana": { lat: -1.8800, lng: 30.1400 },

  // Kigali — Kicukiro sectors / neighborhoods
  "Niboye": { lat: -2.0100, lng: 30.1000 },
  "Kagarama": { lat: -1.9900, lng: 30.1200 },
  "Gatenga": { lat: -1.9950, lng: 30.0950 },
  "Kanombe": { lat: -1.9650, lng: 30.1350 },
  "Nyanza": { lat: -2.0000, lng: 30.0850 },
  "Masaka": { lat: -2.0300, lng: 30.0900 },
  "Kigarama": { lat: -2.0050, lng: 30.1150 },
  "Gahanga": { lat: -2.0600, lng: 30.0900 },
  "Busanza": { lat: -1.9800, lng: 30.1300 },
  "Biryogo": { lat: -1.9750, lng: 30.0500 },

  // Northern Province
  "Musanze": { lat: -1.4833, lng: 29.6333 },
  "Ruhengeri": { lat: -1.4833, lng: 29.6333 },
  "Burera": { lat: -1.4833, lng: 29.8667 },
  "Gicumbi": { lat: -1.5833, lng: 30.1167 },
  "Byumba": { lat: -1.5833, lng: 30.1167 },
  "Rulindo": { lat: -1.7667, lng: 29.9833 },
  "Gakenke": { lat: -1.6833, lng: 29.7833 },

  // Southern Province
  "Huye": { lat: -2.5833, lng: 29.7333 },
  "Butare": { lat: -2.5833, lng: 29.7333 },
  "Muhanga": { lat: -2.0833, lng: 29.7333 },
  "Gitarama": { lat: -2.0833, lng: 29.7333 },
  "Kamonyi": { lat: -2.0833, lng: 29.8000 },
  "Ruhango": { lat: -2.1667, lng: 29.7833 },
  "Nyamagabe": { lat: -2.4833, lng: 29.5000 },
  "Nyaruguru": { lat: -2.6167, lng: 29.4333 },
  "Gisagara": { lat: -2.5333, lng: 29.8333 },

  // Western Province
  "Rubavu": { lat: -1.6833, lng: 29.3333 },
  "Gisenyi": { lat: -1.6833, lng: 29.3333 },
  "Rusizi": { lat: -2.4667, lng: 28.9000 },
  "Cyangugu": { lat: -2.4667, lng: 28.9000 },
  "Karongi": { lat: -2.0000, lng: 29.3833 },
  "Kibuye": { lat: -2.0000, lng: 29.3833 },
  "Rutsiro": { lat: -1.8667, lng: 29.3333 },
  "Nyabihu": { lat: -1.6500, lng: 29.5000 },
  "Ngororero": { lat: -1.7500, lng: 29.5167 },
  "Nyamasheke": { lat: -2.3000, lng: 29.1333 },

  // Eastern Province
  "Rwamagana": { lat: -1.9333, lng: 30.4333 },
  "Bugesera": { lat: -2.2167, lng: 30.2833 },
  "Kayonza": { lat: -1.8833, lng: 30.6167 },
  "Nyagatare": { lat: -1.3000, lng: 30.3167 },
  "Gatsibo": { lat: -1.5833, lng: 30.4167 },
  "Ngoma": { lat: -2.1833, lng: 30.5167 },
  "Kibungo": { lat: -2.1833, lng: 30.5167 },
  "Kirehe": { lat: -2.2167, lng: 30.7167 },
};

export type DistrictCoordinatesResult = {
  lat: number;
  lng: number;
  canonicalName: string;
};

export function findDistrictCoordinates(
  districtName?: string | null
): DistrictCoordinatesResult | null {
  if (!districtName) return null;
  const raw = districtName.trim().toLowerCase();
  // Strip common prefixes/suffixes: "district of nyarugenge", "nyarugenge district", "akarere ka nyarugenge"
  const clean = raw
    .replace(/\b(district|akarere|ville|city|province|intara|ka|ya|of)\b/gi, "")
    .trim();

  if (!clean) return null;

  // Exact match first
  for (const [name, coords] of Object.entries(RWANDA_DISTRICT_COORDINATES)) {
    if (name.toLowerCase() === clean) {
      return { ...coords, canonicalName: name };
    }
  }

  // Substring match (e.g., "Kicukiro, Kigali" contains "kicukiro")
  for (const [name, coords] of Object.entries(RWANDA_DISTRICT_COORDINATES)) {
    const lowerName = name.toLowerCase();
    if (clean.includes(lowerName) || (clean.length >= 4 && lowerName.includes(clean))) {
      return { ...coords, canonicalName: name };
    }
  }

  return null;
}

export function detectDistrictFromCoordinates(lat: number, lng: number): string {
  let closestDistrict = "Nyarugenge";
  let minDistanceSq = Infinity;

  for (const [districtName, coords] of Object.entries(RWANDA_DISTRICT_COORDINATES)) {
    const dLat = lat - coords.lat;
    const dLng = lng - coords.lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closestDistrict = districtName;
    }
  }

  return closestDistrict;
}

export function extractDistrictFromAddress(address?: string | null): string | null {
  if (!address) return null;
  const lower = address.toLowerCase();
  for (const districtName of Object.keys(RWANDA_DISTRICT_COORDINATES)) {
    if (lower.includes(districtName.toLowerCase())) {
      return districtName;
    }
  }
  return null;
}

