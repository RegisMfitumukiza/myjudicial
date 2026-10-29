import { describe, it, expect } from "vitest";
import {
  findDistrictCoordinates,
  detectDistrictFromCoordinates,
  extractDistrictFromAddress,
  RWANDA_DISTRICT_COORDINATES,
} from "./constants";
import {
  RWANDA_AUTH_PROVINCES,
  RWANDA_AUTH_DISTRICTS,
  RWANDA_AUTH_SECTORS,
  ALL_RWANDA_LOCATIONS,
} from "./locations-data";

describe("Frontend Location & Address System", () => {
  it("contains all authoritative administrative divisions", () => {
    expect(RWANDA_AUTH_PROVINCES.length).toBe(5);
    expect(RWANDA_AUTH_DISTRICTS.length).toBe(30);
    expect(RWANDA_AUTH_SECTORS.length).toBe(416);
    expect(ALL_RWANDA_LOCATIONS.length).toBe(451);
  });

  describe("findDistrictCoordinates", () => {
    it("resolves Gatsata to exact sector coordinates (not Kigali city center)", () => {
      const result = findDistrictCoordinates("Gatsata");
      expect(result).not.toBeNull();
      expect(result?.canonicalName).toBe("Gatsata");
      expect(result?.level).toBe("SECTOR");
      expect(result?.parentName).toBe("Gasabo");
      expect(result?.lat).toBeCloseTo(-1.9250, 3);
      expect(result?.lng).toBeCloseTo(30.0450, 3);
    });

    it("resolves Kimironko to exact sector coordinates", () => {
      const result = findDistrictCoordinates("Kimironko");
      expect(result).not.toBeNull();
      expect(result?.canonicalName).toBe("Kimironko");
      expect(result?.level).toBe("SECTOR");
      expect(result?.parentName).toBe("Gasabo");
      expect(result?.lat).toBeCloseTo(-1.9365, 3);
      expect(result?.lng).toBeCloseTo(30.1302, 3);
    });

    it("resolves Kanombe to exact sector coordinates", () => {
      const result = findDistrictCoordinates("Kanombe");
      expect(result).not.toBeNull();
      expect(result?.canonicalName).toBe("Kanombe");
      expect(result?.level).toBe("SECTOR");
      expect(result?.parentName).toBe("Kicukiro");
      expect(result?.lat).toBeCloseTo(-1.9772, 3);
      expect(result?.lng).toBeCloseTo(30.1472, 3);
    });

    it("resolves Huye to District coordinates (prioritizing District over Sector)", () => {
      const result = findDistrictCoordinates("Huye");
      expect(result).not.toBeNull();
      expect(result?.canonicalName).toBe("Huye");
      expect(result?.level).toBe("DISTRICT");
      expect(result?.lat).toBeCloseTo(-2.5833, 3);
      expect(result?.lng).toBeCloseTo(29.7333, 3);
    });

    it("resolves Musanze to District coordinates (prioritizing District over Sector)", () => {
      const result = findDistrictCoordinates("Musanze");
      expect(result).not.toBeNull();
      expect(result?.canonicalName).toBe("Musanze");
      expect(result?.level).toBe("DISTRICT");
      expect(result?.lat).toBeCloseTo(-1.4833, 3);
      expect(result?.lng).toBeCloseTo(29.6333, 3);
    });

    it("resolves Gisenyi to Gisenyi sector in Rubavu district", () => {
      const result = findDistrictCoordinates("Gisenyi");
      expect(result).not.toBeNull();
      expect(result?.canonicalName).toBe("Gisenyi");
      expect(result?.parentName).toBe("Rubavu");
      expect(result?.lat).toBeCloseTo(-1.7000, 3);
      expect(result?.lng).toBeCloseTo(29.2500, 3);
    });

    it("handles prefixes like 'District of Musanze' or 'Akarere ka Huye'", () => {
      const res1 = findDistrictCoordinates("District of Musanze");
      expect(res1?.canonicalName).toBe("Musanze");

      const res2 = findDistrictCoordinates("Akarere ka Huye");
      expect(res2?.canonicalName).toBe("Huye");

      const res3 = findDistrictCoordinates("Umurenge wa Gatsata");
      expect(res3?.canonicalName).toBe("Gatsata");
    });

    it("returns null for unknown locations instead of fabricating coordinates", () => {
      const result = findDistrictCoordinates("Atlantis");
      expect(result).toBeNull();
    });
  });

  describe("detectDistrictFromCoordinates", () => {
    it("detects Huye for southern Rwanda coordinates", () => {
      const district = detectDistrictFromCoordinates(-2.5833, 29.7333);
      expect(district).toBe("Huye");
    });

    it("detects Musanze for northern Rwanda coordinates", () => {
      const district = detectDistrictFromCoordinates(-1.4833, 29.6333);
      expect(district).toBe("Musanze");
    });

    it("detects Rubavu for western border coordinates", () => {
      const district = detectDistrictFromCoordinates(-1.6833, 29.3333);
      expect(district).toBe("Rubavu");
    });
  });

  describe("extractDistrictFromAddress", () => {
    it("extracts district from a full address string", () => {
      const district = extractDistrictFromAddress("KG 123 St, Kimironko, Gasabo, Kigali");
      expect(district).toBe("Gasabo");
    });

    it("extracts district via alias like Butare", () => {
      const district = extractDistrictFromAddress("University Avenue, Butare Town");
      expect(district).toBe("Huye");
    });
  });
});
