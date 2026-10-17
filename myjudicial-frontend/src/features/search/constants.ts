export const RWANDA_DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Kigali City
  "Nyarugenge": { lat: -1.9540, lng: 30.0520 },
  "Gasabo": { lat: -1.9356, lng: 30.1086 },
  "Kicukiro": { lat: -1.9864, lng: 30.1019 },

  // Northern Province
  "Musanze": { lat: -1.4833, lng: 29.6333 },
  "Burera": { lat: -1.4833, lng: 29.8667 },
  "Gicumbi": { lat: -1.5833, lng: 30.1167 },
  "Rulindo": { lat: -1.7667, lng: 29.9833 },
  "Gakenke": { lat: -1.6833, lng: 29.7833 },

  // Southern Province
  "Huye": { lat: -2.5833, lng: 29.7333 },
  "Muhanga": { lat: -2.0833, lng: 29.7333 },
  "Kamonyi": { lat: -2.0833, lng: 29.8000 },
  "Nyanza": { lat: -2.3667, lng: 29.7500 },
  "Ruhango": { lat: -2.1667, lng: 29.7833 },
  "Nyamagabe": { lat: -2.4833, lng: 29.5000 },
  "Nyaruguru": { lat: -2.6167, lng: 29.4333 },
  "Gisagara": { lat: -2.5333, lng: 29.8333 },

  // Western Province
  "Rubavu": { lat: -1.6833, lng: 29.3333 },
  "Rusizi": { lat: -2.4667, lng: 28.9000 },
  "Karongi": { lat: -2.0000, lng: 29.3833 },
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
  "Kirehe": { lat: -2.2167, lng: 30.7167 },
};

export function findDistrictCoordinates(districtName?: string | null): { lat: number; lng: number } | null {
  if (!districtName) return null;
  const normalized = districtName.trim().toLowerCase();
  for (const [name, coords] of Object.entries(RWANDA_DISTRICT_COORDINATES)) {
    if (name.toLowerCase() === normalized) {
      return coords;
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

