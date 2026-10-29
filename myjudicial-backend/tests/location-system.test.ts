import "./api/helpers/env.js";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LocationService } from "../src/modules/locations/location.service.js";
import { GeocodingService } from "../src/infrastructure/geocoding/geocoding.service.js";
import {
  RWANDA_PROVINCES,
  RWANDA_DISTRICTS,
  RWANDA_SECTORS,
  normalizeAdminName,
} from "../src/infrastructure/data/rwanda-administrative-data.js";
import { createProfileSchema, updateProfileSchema } from "../src/modules/experts/profile/profile.schemas.js";
import { updateMeSchema } from "../src/modules/auth/auth.schemas.js";

describe("Production-Grade Location System & Address Integrity", () => {
  it("Scenario 1 & 2 & 3: Authoritative dataset contains Kimironko, Gatsata, and Kanombe with accurate sector-level coordinates", async () => {
    // 1. Kimironko
    const kimironko = await LocationService.resolveLocation("Kimironko");
    assert.ok(kimironko, "Kimironko should be resolved");
    assert.equal(kimironko.level, "SECTOR");
    assert.equal(kimironko.name, "Kimironko");
    assert.equal(kimironko.parentName, "Gasabo");
    assert.equal(kimironko.latitude, -1.9365);
    assert.equal(kimironko.longitude, 30.1301);

    // 2. Gatsata (previously missing from frontend and defaulted to district center in geocoding)
    const gatsata = await LocationService.resolveLocation("Gatsata");
    assert.ok(gatsata, "Gatsata should be resolved");
    assert.equal(gatsata.level, "SECTOR");
    assert.equal(gatsata.name, "Gatsata");
    assert.equal(gatsata.parentName, "Gasabo");
    assert.equal(gatsata.latitude, -1.9250);
    assert.equal(gatsata.longitude, 30.0450);

    // Verify Gatsata does NOT get the Gasabo district centroid (-1.9356, 30.1086)
    assert.notEqual(gatsata.latitude, -1.9356);
    assert.notEqual(gatsata.longitude, 30.1086);

    // 3. Kanombe
    const kanombe = await LocationService.resolveLocation("Kanombe");
    assert.ok(kanombe, "Kanombe should be resolved");
    assert.equal(kanombe.level, "SECTOR");
    assert.equal(kanombe.name, "Kanombe");
    assert.equal(kanombe.parentName, "Kicukiro");
    assert.equal(kanombe.latitude, -1.9772);
    assert.equal(kanombe.longitude, 30.1472);

    // 4. Huye and Musanze
    const huye = await LocationService.resolveLocation("Huye");
    assert.ok(huye, "Huye should be resolved");
    assert.equal(huye.name, "Huye");

    const musanze = await LocationService.resolveLocation("Musanze");
    assert.ok(musanze, "Musanze should be resolved");
    assert.equal(musanze.name, "Musanze");
  });

  it("Scenario 2: GeocodingService.getPlaceDetails resolves sectors to sector coordinates, NOT parent district center", async () => {
    // Sector place detail for Gatsata
    const details = await GeocodingService.getPlaceDetails("sector_Gatsata_Gasabo");
    assert.equal(details.isValid, true);
    assert.ok(details.coordinates, "Coordinates must be present");
    assert.equal(details.coordinates.lat, -1.9250);
    assert.equal(details.coordinates.lng, 30.0450);

    // District place detail for Gasabo
    const gasaboDetails = await GeocodingService.getPlaceDetails("district_Gasabo");
    assert.equal(gasaboDetails.isValid, true);
    assert.ok(gasaboDetails.coordinates);
    assert.equal(gasaboDetails.coordinates.lat, -1.9356);
    assert.equal(gasaboDetails.coordinates.lng, 30.1086);

    // Assert that sector coordinates and district coordinates differ
    assert.notEqual(details.coordinates.lat, gasaboDetails.coordinates.lat);
  });

  it("Scenario 4: Validates coordinate pair and rejects invalid / out-of-Rwanda coordinates without fabricating downtown Kigali", () => {
    // Valid Rwanda coordinates
    assert.equal(GeocodingService.isValidRwandaCoordinate(-1.9441, 30.0619), true); // Kigali
    assert.equal(GeocodingService.isValidRwandaCoordinate(-1.4833, 29.6333), true); // Musanze
    assert.equal(GeocodingService.isValidRwandaCoordinate(-2.5833, 29.7333), true); // Huye
    assert.equal(GeocodingService.isValidRwandaCoordinate(-2.4667, 28.9000), true); // Rusizi

    // Invalid coordinates (out of bounds)
    assert.equal(GeocodingService.isValidRwandaCoordinate(0, 0), false);
    assert.equal(GeocodingService.isValidRwandaCoordinate(51.5074, -0.1278), false); // London
    assert.equal(GeocodingService.isValidRwandaCoordinate(-5.0, 30.0), false); // Too far south
    assert.equal(GeocodingService.isValidRwandaCoordinate(-1.9, 45.0), false); // Somalia
    assert.equal(GeocodingService.isValidRwandaCoordinate(NaN, 30.0), false);
  });

  it("Scenario 8 & 9: Client registration & profile schema supports optional district/sector preferences without requiring them", () => {
    // User can update profile with NO location info (optional)
    const validNoLocation = updateMeSchema.safeParse({
      firstName: "Jane",
      lastName: "Citizen",
    });
    assert.equal(validNoLocation.success, true);

    // User can optionally provide district and sector preferences
    const validWithLocation = updateMeSchema.safeParse({
      firstName: "Jane",
      lastName: "Citizen",
      clientDistrictId: "dist_0102",
      clientSectorId: "sec_010202",
    });
    assert.equal(validWithLocation.success, true);
    if (validWithLocation.success) {
      assert.equal(validWithLocation.data.clientDistrictId, "dist_0102");
      assert.equal(validWithLocation.data.clientSectorId, "sec_010202");
    }
  });

  it("Scenario 5 & 6: Expert profile schema accepts structured sectorId, officeAddress, and valid coordinates", () => {
    const validExpertUpdate = updateProfileSchema.safeParse({
      officeAddress: "KG 11 Ave, Kimironko",
      city: "Gasabo",
      sectorId: "sec_010209",
      latitude: -1.9365,
      longitude: 30.1301,
    });
    assert.equal(validExpertUpdate.success, true);
    if (validExpertUpdate.success) {
      assert.equal(validExpertUpdate.data.sectorId, "sec_010209");
      assert.equal(validExpertUpdate.data.latitude, -1.9365);
      assert.equal(validExpertUpdate.data.longitude, 30.1301);
    }
  });

  it("Scenario 11 & 12: LocationService autocomplete search handles spelling variations and normalization", async () => {
    // Search with "Akarere ka Gasabo"
    const results1 = await LocationService.search("Akarere ka Gasabo");
    assert.ok(results1.length > 0);
    assert.equal(results1[0].name, "Gasabo");

    // Search with prefix lowercase "gatsata"
    const results2 = await LocationService.search("gatsata");
    assert.ok(results2.length > 0);
    assert.equal(results2[0].name, "Gatsata");

    // Search "kimironko"
    const results3 = await LocationService.search("kimironko");
    assert.ok(results3.length > 0);
    assert.equal(results3[0].name, "Kimironko");

    // Search with trailing space and uppercase "KANOMBE "
    const results4 = await LocationService.search("KANOMBE ");
    assert.ok(results4.length > 0);
    assert.equal(results4[0].name, "Kanombe");
  });

  it("Scenario 13 & 14: Geographic recognition separates location searches from ordinary keyword searches", async () => {
    // Known places resolve cleanly
    const locKimironko = await LocationService.resolveLocation("Kimironko");
    assert.ok(locKimironko !== null, "Kimironko should resolve as location");

    const locGatsata = await LocationService.resolveLocation("Gatsata");
    assert.ok(locGatsata !== null, "Gatsata should resolve as location");

    const locMusanze = await LocationService.resolveLocation("Musanze");
    assert.ok(locMusanze !== null, "Musanze should resolve as location");

    // Ordinary keywords do NOT resolve as locations
    const keywordDivorce = await LocationService.resolveLocation("divorce");
    assert.equal(keywordDivorce, null, "'divorce' must not resolve as location");

    const keywordLawyer = await LocationService.resolveLocation("commercial contract");
    assert.equal(keywordLawyer, null, "'commercial contract' must not resolve as location");

    const keywordName = await LocationService.resolveLocation("Emmanuel Mugisha");
    assert.equal(keywordName, null, "Person name must not resolve as location");
  });

  it("Scenario 17: Total official administrative division counts match official NISR specifications", () => {
    assert.equal(RWANDA_PROVINCES.length, 5, "Must have exactly 5 provinces");
    assert.equal(RWANDA_DISTRICTS.length, 30, "Must have exactly 30 districts");
    assert.equal(RWANDA_SECTORS.length, 416, "Must have exactly 416 sectors");
  });
});
