import { logger } from "../../shared/utils/logger.js";

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
            'User-Agent': 'MyJudicial/1.0 (legal-platform@myjudicial.rw)' // Required by Nominatim
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
   * FREE: Get address suggestions using Rwanda location database
   * No external API calls - uses local data
   */
  static async getAddressSuggestions(query: string): Promise<AddressSuggestion[]> {
    if (query.length < 2) return [];
    
    const suggestions: AddressSuggestion[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Search through Rwanda districts and sectors
    Object.entries(RWANDA_LOCATIONS.provinces).forEach(([provinceName, province]) => {
      Object.entries(province.districts).forEach(([districtName, district]) => {
        // Match district names
        if (districtName.toLowerCase().includes(lowerQuery)) {
          suggestions.push({
            placeId: `district_${districtName}`,
            description: `${districtName} District, ${provinceName}`,
            mainText: districtName,
            secondaryText: `District, ${provinceName}`
          });
        }
        
        // Match sector names
        district.sectors.forEach(sector => {
          if (sector.toLowerCase().includes(lowerQuery)) {
            suggestions.push({
              placeId: `sector_${sector}_${districtName}`,
              description: `${sector}, ${districtName} District`,
              mainText: sector,
              secondaryText: `${districtName} District`
            });
          }
        });
      });
    });
    
    // Add common business areas in Kigali
    const businessAreas = [
      { name: "Kigali Heights", district: "Nyarugenge" },
      { name: "UTC Building", district: "Nyarugenge" },
      { name: "Centenary House", district: "Nyarugenge" },
      { name: "Kigali City Tower", district: "Nyarugenge" },
      { name: "Serena Hotel", district: "Nyarugenge" },
      { name: "Kigali Convention Centre", district: "Gasabo" },
      { name: "BK Arena", district: "Gasabo" },
      { name: "Camp Kigali", district: "Nyarugenge" }
    ];
    
    businessAreas.forEach(area => {
      if (area.name.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          placeId: `business_${area.name.replace(/\s+/g, '_')}`,
          description: `${area.name}, ${area.district} District, Kigali`,
          mainText: area.name,
          secondaryText: `${area.district} District, Kigali`
        });
      }
    });
    
    return suggestions.slice(0, 8); // Limit to 8 suggestions
  }

  /**
   * FREE: Get coordinates from Rwanda location database
   */
  static async getPlaceDetails(placeId: string): Promise<LocationResult> {
    try {
      // Parse placeId to extract location type and name
      const [type, ...nameParts] = placeId.split('_');
      const name = nameParts.join('_').replace(/_/g, ' ');
      
      if (type === 'district') {
        // Find district coordinates
        for (const [provinceName, province] of Object.entries(RWANDA_LOCATIONS.provinces)) {
          const district = (province.districts as Record<string, any>)[name];
          if (district) {
            return {
              isValid: true,
              coordinates: {
                lat: district.center[0],
                lng: district.center[1]
              },
              formattedAddress: `${name} District, ${provinceName}, Rwanda`,
              placeId: placeId
            };
          }
        }
      }
      
      if (type === 'sector') {
        const [sectorName, districtName] = name.split(' ').slice(0, -1).join(' ').split(', ');
        // For sectors, use district coordinates with slight offset
        for (const province of Object.values(RWANDA_LOCATIONS.provinces)) {
          const district = (province.districts as Record<string, any>)[districtName];
          if (district && district.sectors.includes(sectorName)) {
            return {
              isValid: true,
              coordinates: {
                lat: district.center[0] + (Math.random() - 0.5) * 0.01, // Small random offset
                lng: district.center[1] + (Math.random() - 0.5) * 0.01
              },
              formattedAddress: `${sectorName}, ${districtName} District, Rwanda`,
              placeId: placeId
            };
          }
        }
      }
      
      if (type === 'business') {
        // Business areas in Kigali center
        return {
          isValid: true,
          coordinates: {
            lat: -1.9441 + (Math.random() - 0.5) * 0.005, // Near Kigali center
            lng: 30.0619 + (Math.random() - 0.5) * 0.005
          },
          formattedAddress: `${name}, Kigali City, Rwanda`,
          placeId: placeId
        };
      }
      
      return { isValid: false };
    } catch (error) {
      logger.error('Place details failed', { error, placeId });
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
            'User-Agent': 'MyJudicial/1.0 (legal-platform@myjudicial.rw)'
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