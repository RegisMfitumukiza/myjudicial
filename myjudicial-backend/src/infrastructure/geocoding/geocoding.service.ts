import { logger } from "../../shared/utils/logger.js";
import { LocationService } from "../../modules/locations/location.service.js";
import {
  RWANDA_DISTRICTS,
  RWANDA_SECTORS,
  RWANDA_PROVINCES,
} from "../data/rwanda-administrative-data.js";

interface LocationResult {
  isValid: boolean;
  coordinates?: { lat: number; lng: number };
  formattedAddress?: string;
  placeId?: string;
}

interface AddressSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

// Rwanda-specific location data (FREE - no API calls needed)
const RWANDA_LOCATIONS = {
  provinces: {
    "Kigali City": {
      center: [-1.9441, 30.0619],
      districts: {
        "Gasabo": { 
          center: [-1.9356, 30.1086], 
          sectors: ["Remera", "Kacyiru", "Kimihurura", "Gikomero", "Gisozi", "Jabana", "Jali", "Kinyinya", "Ndera", "Nduba", "Rusororo", "Rutunga", "Bumbogo", "Gatsata", "Gikomero", "Kacyiru"]
        },
        "Kicukiro": { 
          center: [-1.9864, 30.1019], 
          sectors: ["Niboye", "Gatenga", "Kagarama", "Kanombe", "Kicukiro", "Masaka", "Nyarugunga", "Rukiri", "Rwigarama", "Gahanga"]
        },
        "Nyarugenge": { 
          center: [-1.9441, 30.0619], 
          sectors: ["Gitega", "Kanyinya", "Kigali", "Kimisagara", "Mageragere", "Muhima", "Nyakabanda", "Nyamirambo", "Rwezamenyo", "Kimuhoza"]
        }
      }
    },
    "Eastern Province": {
      center: [-1.8333, 30.5833],
      districts: {
        "Bugesera": { center: [-2.2167, 30.2833], sectors: [] },
        "Gatsibo": { center: [-1.5833, 30.4167], sectors: [] },
        "Kayonza": { center: [-1.8833, 30.6167], sectors: [] },
        "Kirehe": { center: [-2.2167, 30.7167], sectors: [] },
        "Ngoma": { center: [-2.1833, 30.5167], sectors: [] },
        "Nyagatare": { center: [-1.3, 30.3167], sectors: [] },
        "Rwamagana": { center: [-1.9333, 30.4333], sectors: [] }
      }
    },
    "Northern Province": {
      center: [-1.5, 29.9167],
      districts: {
        "Burera": { center: [-1.4833, 29.8667], sectors: [] },
        "Gakenke": { center: [-1.6833, 29.7833], sectors: [] },
        "Gicumbi": { center: [-1.5833, 30.1167], sectors: [] },
        "Musanze": { center: [-1.4833, 29.6333], sectors: [] },
        "Rulindo": { center: [-1.7667, 29.9833], sectors: [] }
      }
    },
    "Southern Province": {
      center: [-2.3333, 29.7333],
      districts: {
        "Gisagara": { center: [-2.5333, 29.8333], sectors: [] },
        "Huye": { center: [-2.5833, 29.7333], sectors: [] },
        "Kamonyi": { center: [-2.0833, 29.8], sectors: [] },
        "Muhanga": { center: [-2.0833, 29.7333], sectors: [] },
        "Nyamagabe": { center: [-2.4833, 29.5], sectors: [] },
        "Nyanza": { center: [-2.3667, 29.75], sectors: [] },
        "Nyaruguru": { center: [-2.6167, 29.4333], sectors: [] },
        "Ruhango": { center: [-2.1667, 29.7833], sectors: [] }
      }
    },
    "Western Province": {
      center: [-2.2167, 29.25],
      districts: {
        "Karongi": { center: [-2.0, 29.3833], sectors: [] },
        "Ngororero": { center: [-1.75, 29.5167], sectors: [] },
        "Nyabihu": { center: [-1.65, 29.5], sectors: [] },
        "Nyamasheke": { center: [-2.3, 29.1333], sectors: [] },
        "Rubavu": { center: [-1.6833, 29.3333], sectors: [] },
        "Rusizi": { center: [-2.4667, 28.9], sectors: [] },
        "Rutsiro": { center: [-1.8667, 29.3333], sectors: [] }
      }
    }
  }
};

export class GeocodingService {
  /**
   * Validate whether a lat/lng coordinate pair falls within Rwanda's territorial bounding box.
   * Rwanda bounding box: Latitude [-2.90, -1.00], Longitude [28.80, 30.95].
   */
  static isValidRwandaCoordinate(lat: number, lng: number): boolean {
    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
      return false;
    }
    return lat >= -2.90 && lat <= -1.00 && lng >= 28.80 && lng <= 30.95;
  }

  /**
   * Determine the closest Rwandan district from latitude and longitude.
   * Compares coordinates against the centers of all 30 official districts.
   */
  static detectDistrict(lat: number, lng: number): string {
    let closestDistrict = "Nyarugenge";
    let minDistanceSq = Infinity;

    for (const district of RWANDA_DISTRICTS) {
      const dLat = lat - district.latitude;
      const dLng = lng - district.longitude;
      const distSq = dLat * dLat + dLng * dLng;
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        closestDistrict = district.name;
      }
    }

    return closestDistrict;
  }

  /**
   * FREE: Validate address using Nominatim (OpenStreetMap)
   * No API key required, unlimited usage
   */
  static async validateAddress(address: string): Promise<LocationResult> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(address + ", Rwanda")}&` +
        `format=json&` +
        `countrycodes=rw&` +
        `limit=1&` +
        `addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MyJudicial/1.0 (legal-platform@myjudicial.com)' // Required by Nominatim
          }
        }
      );
      
      const data = await response.json();
      
      if (data.length > 0) {
        const result = data[0];
        return {
          isValid: true,
          coordinates: {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
          },
          formattedAddress: result.display_name,
          placeId: result.place_id.toString()
        };
      }
      
      return { isValid: false };
    } catch (error) {
      logger.error('Nominatim geocoding failed', { error, address });
      return { isValid: false };
    }
  }

  /**
   * Industrial Geocoding: Get address suggestions using verified Rwanda locations,
   * prominent landmark registry, and real live OpenStreetMap Nominatim search.
   */
  static async getAddressSuggestions(query: string): Promise<AddressSuggestion[]> {
    if (query.length < 2) return [];

    const suggestions: AddressSuggestion[] = [];
    const lowerQuery = query.toLowerCase();

    // 1. Search through verified Rwanda provinces, districts, and sectors using unified LocationService
    const matchedDivisions = await LocationService.search(query, 8);
    for (const div of matchedDivisions) {
      if (div.level === "SECTOR") {
        suggestions.push({
          placeId: `sector_${div.name}_${div.parentName || ""}`,
          description: div.canonicalName,
          mainText: div.name,
          secondaryText: `${div.parentName || ""} District, Rwanda`,
        });
      } else if (div.level === "DISTRICT") {
        suggestions.push({
          placeId: `district_${div.name}`,
          description: div.canonicalName,
          mainText: `${div.name} District`,
          secondaryText: `${div.parentName || "Rwanda"}`,
        });
      } else {
        suggestions.push({
          placeId: `province_${div.name}`,
          description: div.canonicalName,
          mainText: div.name,
          secondaryText: "Rwanda",
        });
      }
    }

    // 2. Match verified landmarks and commercial towers across Kigali & provinces
    const landmarks = GeocodingService.getLandmarks();
    landmarks.forEach((area) => {
      if (area.name.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          placeId: `landmark_${area.name.replace(/\s+/g, "_")}`,
          description: `${area.name}, ${area.district} District, Rwanda`,
          mainText: area.name,
          secondaryText: `${area.district} District (${area.category})`,
        });
      }
    });

    // 3. Live OpenStreetMap Nominatim query for real streets, roads, and venues across Rwanda
    if (query.length >= 3) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(query + ", Rwanda")}&` +
            `format=json&countrycodes=rw&limit=5&addressdetails=1`,
          {
            headers: {
              "User-Agent": "MyJudicial/1.0 (legal-platform@myjudicial.com)",
            },
            signal: AbortSignal.timeout(3500),
          }
        );

        if (response.ok) {
          const osmData = await response.json();
          if (Array.isArray(osmData)) {
            for (const item of osmData) {
              const parts = (item.display_name || "").split(", ");
              const mainText = parts[0] || query;
              const secondaryText = parts.slice(1, 4).join(", ");
              suggestions.push({
                placeId: `osm_${item.place_id}_${item.lat}_${item.lon}`,
                description: item.display_name,
                mainText,
                secondaryText: secondaryText || "Rwanda",
              });
            }
          }
        }
      } catch (osmError) {
        // Non-blocking: smooth fallback to local index if network times out
        logger.warn("Live Nominatim geocoding query fallback", { error: (osmError as Error).message, query });
      }
    }

    // Deduplicate suggestions by mainText
    const seen = new Set<string>();
    const deduplicated: AddressSuggestion[] = [];
    for (const s of suggestions) {
      const key = `${s.mainText.toLowerCase()}__${s.secondaryText.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(s);
      }
    }

    return deduplicated.slice(0, 8);
  }

  /**
   * Resolve placeId into exact coordinates and standardized address.
   */
  static async getPlaceDetails(placeId: string): Promise<LocationResult> {
    try {
      // 1. OpenStreetMap Nominatim result (exact coordinates embedded in ID)
      if (placeId.startsWith("osm_")) {
        const parts = placeId.split("_");
        const lat = parseFloat(parts[2]);
        const lng = parseFloat(parts[3]);
        if (!isNaN(lat) && !isNaN(lng)) {
          // Reverse geocode to get clean, canonical address
          const reverse = await GeocodingService.reverseGeocode(lat, lng);
          return {
            isValid: true,
            coordinates: { lat, lng },
            formattedAddress: reverse?.address,
            placeId,
          };
        }
      }

      // 2. Verified District
      if (placeId.startsWith("district_")) {
        const districtName = placeId.replace("district_", "");
        const resolved = await LocationService.resolveLocation(districtName);
        if (resolved) {
          return {
            isValid: true,
            coordinates: {
              lat: resolved.latitude,
              lng: resolved.longitude,
            },
            formattedAddress: resolved.canonicalName,
            placeId,
          };
        }
      }

      // 3. Verified Sector
      if (placeId.startsWith("sector_")) {
        const parts = placeId.split("_");
        const sectorName = parts[1];
        const districtName = parts[2];
        const resolved = await LocationService.resolveLocation(sectorName);
        if (resolved) {
          return {
            isValid: true,
            coordinates: {
              lat: resolved.latitude,
              lng: resolved.longitude,
            },
            formattedAddress: resolved.canonicalName || `${sectorName}, ${districtName} District, Rwanda`,
            placeId,
          };
        }
      }

      // 4. Verified Landmarks / Towers
      if (placeId.startsWith("landmark_") || placeId.startsWith("business_")) {
        const rawName = placeId
          .replace(/^(landmark_|business_)/, "")
          .replace(/_/g, " ")
          .toLowerCase();

        const landmark = GeocodingService.getLandmarks().find(
          (l) => l.name.toLowerCase() === rawName || rawName.includes(l.name.toLowerCase())
        );

        if (landmark) {
          return {
            isValid: true,
            coordinates: {
              lat: landmark.coords[0],
              lng: landmark.coords[1],
            },
            formattedAddress: `${landmark.name}, ${landmark.district} District, Kigali, Rwanda`,
            placeId,
          };
        }

        // Return invalid rather than fabricating downtown Kigali coordinates
        return { isValid: false };
      }

      return { isValid: false };
    } catch (error) {
      logger.error("Place details failed", { error, placeId });
      return { isValid: false };
    }
  }

  /**
   * FREE: Get Rwanda locations (provinces, districts, sectors)
   */
  static getRwandaLocations() {
    return RWANDA_LOCATIONS;
  }

  /**
   * FREE: Get known landmarks (public places, business centers, etc.)
   * Fetched from API so they can be updated without a frontend deploy.
   */
  static getLandmarks() {
    return [
      { name: "Kigali Heights", coords: [-1.9441, 30.0619], district: "Nyarugenge", category: "Business" },
      { name: "UTC Building", coords: [-1.9455, 30.0598], district: "Nyarugenge", category: "Business" },
      { name: "Centenary House", coords: [-1.9465, 30.0601], district: "Nyarugenge", category: "Government" },
      { name: "Kigali City Tower", coords: [-1.9442, 30.0588], district: "Nyarugenge", category: "Business" },
      { name: "Hotel des Diplomates", coords: [-1.9448, 30.0607], district: "Nyarugenge", category: "Hotel" },
      { name: "Serena Hotel", coords: [-1.9447, 30.0596], district: "Nyarugenge", category: "Hotel" },
      { name: "Kigali Convention Centre", coords: [-1.9356, 30.1086], district: "Gasabo", category: "Convention" },
      { name: "BK Arena", coords: [-1.9367, 30.1078], district: "Gasabo", category: "Sports" },
      { name: "Kigali Airport", coords: [-1.9686, 30.1395], district: "Gasabo", category: "Transport" },
      { name: "University of Rwanda", coords: [-2.5833, 29.7333], district: "Huye", category: "Education" },
      { name: "Nyabugogo Bus Terminal", coords: [-1.9658, 30.0468], district: "Nyarugenge", category: "Transport" },
      { name: "Kimironko Market", coords: [-1.9378, 30.1089], district: "Gasabo", category: "Market" },
      { name: "Central Bank of Rwanda", coords: [-1.9456, 30.0612], district: "Nyarugenge", category: "Financial" },
      { name: "Rwanda Development Board", coords: [-1.9434, 30.0615], district: "Nyarugenge", category: "Government" },
      { name: "Kigali Business Centre", coords: [-1.9449, 30.0589], district: "Nyarugenge", category: "Business" }
    ];
  }

  /**
   * Reverse-geocode coordinates to a readable address via OSM Nominatim.
   * Proxied through backend to avoid client-side Nominatim calls (rate-limiting, provider swapping).
   */
  static async reverseGeocode(lat: number, lng: number): Promise<{ address: string } | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        `lat=${lat}&lon=${lng}&` +
        `format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MyJudicial/1.0 (legal-platform@myjudicial.com)'
          }
        }
      );

      const data = await response.json();
      if (data.display_name) {
        return { address: data.display_name };
      }
      return null;
    } catch (error) {
      logger.error('Nominatim reverse-geocode failed', { error, lat, lng });
      return null;
    }
  }
}