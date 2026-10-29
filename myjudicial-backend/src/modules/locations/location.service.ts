import { prisma } from "../../infrastructure/database/prisma.js";
import {
  RWANDA_PROVINCES,
  RWANDA_DISTRICTS,
  RWANDA_SECTORS,
  ALL_RWANDA_DIVISIONS,
  normalizeAdminName,
  RawDivision,
} from "../../infrastructure/data/rwanda-administrative-data.js";
import { logger } from "../../shared/utils/logger.js";

export interface DivisionDto {
  id: string;
  code: string;
  name: string;
  level: "PROVINCE" | "DISTRICT" | "SECTOR";
  parentId?: string | null;
  parentName?: string | null;
  latitude: number;
  longitude: number;
  aliases: string[];
  canonicalName: string;
}

// In-memory lookup tables for instant offline resolution and test execution
const fallbackDivisions: DivisionDto[] = [];
const fallbackByCode = new Map<string, DivisionDto>();
const fallbackByName = new Map<string, DivisionDto>();
const fallbackByNormalized = new Map<string, DivisionDto[]>();

// Initialize in-memory indexes from authoritative dataset
(function initInMemoryStore() {
  // Provinces
  for (const prov of RWANDA_PROVINCES) {
    const dto: DivisionDto = {
      id: `prov_${prov.code}`,
      code: prov.code,
      name: prov.name,
      level: "PROVINCE",
      parentId: null,
      parentName: "Rwanda",
      latitude: prov.latitude,
      longitude: prov.longitude,
      aliases: prov.aliases || [],
      canonicalName: `${prov.name}, Rwanda`,
    };
    fallbackDivisions.push(dto);
    fallbackByCode.set(dto.code, dto);
    fallbackByName.set(dto.name.toLowerCase(), dto);
    const norm = normalizeAdminName(dto.name);
    const arr = fallbackByNormalized.get(norm) || [];
    arr.push(dto);
    fallbackByNormalized.set(norm, arr);
  }

  // Districts
  for (const dist of RWANDA_DISTRICTS) {
    const parent = dist.parentCode ? fallbackByCode.get(dist.parentCode) : null;
    const dto: DivisionDto = {
      id: `dist_${dist.code}`,
      code: dist.code,
      name: dist.name,
      level: "DISTRICT",
      parentId: parent ? parent.id : null,
      parentName: parent ? parent.name : null,
      latitude: dist.latitude,
      longitude: dist.longitude,
      aliases: dist.aliases || [],
      canonicalName: `${dist.name} District, ${parent ? parent.name : "Rwanda"}`,
    };
    fallbackDivisions.push(dto);
    fallbackByCode.set(dto.code, dto);
    fallbackByName.set(dto.name.toLowerCase(), dto);
    const norm = normalizeAdminName(dto.name);
    const arr = fallbackByNormalized.get(norm) || [];
    arr.push(dto);
    fallbackByNormalized.set(norm, arr);
  }

  // Sectors
  for (const sec of RWANDA_SECTORS) {
    const parentDist = sec.parentCode ? fallbackByCode.get(sec.parentCode) : null;
    const parentProv = parentDist?.parentId ? fallbackByCode.get(parentDist.parentId.replace("prov_", "")) : null;
    const dto: DivisionDto = {
      id: `sec_${sec.code}`,
      code: sec.code,
      name: sec.name,
      level: "SECTOR",
      parentId: parentDist ? parentDist.id : null,
      parentName: parentDist ? parentDist.name : null,
      latitude: sec.latitude,
      longitude: sec.longitude,
      aliases: sec.aliases || [],
      canonicalName: `${sec.name}, ${parentDist ? parentDist.name : ""} District`,
    };
    fallbackDivisions.push(dto);
    fallbackByCode.set(dto.code, dto);
    // Note: Multiple sectors across different districts can share the same name (e.g., Remera, Mukura, Mbazi)
    if (!fallbackByName.has(dto.name.toLowerCase())) {
      fallbackByName.set(dto.name.toLowerCase(), dto);
    }
    const norm = normalizeAdminName(dto.name);
    const arr = fallbackByNormalized.get(norm) || [];
    arr.push(dto);
    fallbackByNormalized.set(norm, arr);
  }
})();

export const LocationService = {
  /**
   * Get all 5 provinces in Rwanda
   */
  getProvinces: async (): Promise<DivisionDto[]> => {
    if (process.env.NODE_ENV === "test") {
      return fallbackDivisions.filter((d) => d.level === "PROVINCE");
    }
    try {
      const records = await prisma.administrativeDivision.findMany({
        where: { level: "PROVINCE" },
        orderBy: { code: "asc" },
      });
      if (records.length > 0) {
        return records.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          level: "PROVINCE",
          parentId: null,
          parentName: "Rwanda",
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
          aliases: r.aliases,
          canonicalName: `${r.name}, Rwanda`,
        }));
      }
    } catch {
      // Fall through to in-memory store
    }
    return fallbackDivisions.filter((d) => d.level === "PROVINCE");
  },

  /**
   * Get districts, optionally filtered by province id or code
   */
  getDistricts: async (provinceIdOrCode?: string): Promise<DivisionDto[]> => {
    if (process.env.NODE_ENV === "test") {
      let districts = fallbackDivisions.filter((d) => d.level === "DISTRICT");
      if (provinceIdOrCode) {
        const targetProv = fallbackDivisions.find(
          (d) => d.level === "PROVINCE" && (d.id === provinceIdOrCode || d.code === provinceIdOrCode)
        );
        if (targetProv) {
          districts = districts.filter((d) => d.parentId === targetProv.id);
        }
      }
      return districts;
    }
    try {
      let parentFilter: any = undefined;
      if (provinceIdOrCode) {
        parentFilter = {
          OR: [
            { parentId: provinceIdOrCode },
            { parent: { code: provinceIdOrCode } },
          ],
        };
      }
      const records = await prisma.administrativeDivision.findMany({
        where: {
          level: "DISTRICT",
          ...(parentFilter && parentFilter),
        },
        include: { parent: true },
        orderBy: { name: "asc" },
      });
      if (records.length > 0) {
        return records.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          level: "DISTRICT",
          parentId: r.parentId,
          parentName: r.parent?.name || null,
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
          aliases: r.aliases,
          canonicalName: `${r.name} District, ${r.parent?.name || "Rwanda"}`,
        }));
      }
    } catch {
      // Fall through to in-memory store
    }

    let districts = fallbackDivisions.filter((d) => d.level === "DISTRICT");
    if (provinceIdOrCode) {
      const targetProv = fallbackDivisions.find(
        (d) => d.level === "PROVINCE" && (d.id === provinceIdOrCode || d.code === provinceIdOrCode)
      );
      if (targetProv) {
        districts = districts.filter((d) => d.parentId === targetProv.id);
      }
    }
    return districts;
  },

  /**
   * Get sectors, optionally filtered by district id or code
   */
  getSectors: async (districtIdOrCode?: string): Promise<DivisionDto[]> => {
    if (process.env.NODE_ENV === "test") {
      let sectors = fallbackDivisions.filter((d) => d.level === "SECTOR");
      if (districtIdOrCode) {
        const targetDist = fallbackDivisions.find(
          (d) => d.level === "DISTRICT" && (d.id === districtIdOrCode || d.code === districtIdOrCode)
        );
        if (targetDist) {
          sectors = sectors.filter((d) => d.parentId === targetDist.id);
        }
      }
      return sectors;
    }
    try {
      let parentFilter: any = undefined;
      if (districtIdOrCode) {
        parentFilter = {
          OR: [
            { parentId: districtIdOrCode },
            { parent: { code: districtIdOrCode } },
          ],
        };
      }
      const records = await prisma.administrativeDivision.findMany({
        where: {
          level: "SECTOR",
          ...(parentFilter && parentFilter),
        },
        include: { parent: true },
        orderBy: { name: "asc" },
      });
      if (records.length > 0) {
        return records.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          level: "SECTOR",
          parentId: r.parentId,
          parentName: r.parent?.name || null,
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
          aliases: r.aliases,
          canonicalName: `${r.name}, ${r.parent?.name || ""} District`,
        }));
      }
    } catch {
      // Fall through to in-memory store
    }

    let sectors = fallbackDivisions.filter((d) => d.level === "SECTOR");
    if (districtIdOrCode) {
      const targetDist = fallbackDivisions.find(
        (d) => d.level === "DISTRICT" && (d.id === districtIdOrCode || d.code === districtIdOrCode)
      );
      if (targetDist) {
        sectors = sectors.filter((d) => d.parentId === targetDist.id);
      }
    }
    return sectors;
  },

  /**
   * Search locations by name, alias, or code with intelligent normalization
   */
  search: async (query: string, limit = 10): Promise<DivisionDto[]> => {
    if (!query || query.trim().length === 0) return [];
    const normalized = normalizeAdminName(query);
    const rawLower = query.trim().toLowerCase();

    if (process.env.NODE_ENV === "test") {
      const matches: DivisionDto[] = [];
      for (const d of fallbackDivisions) {
        const normD = normalizeAdminName(d.name);
        const nameMatch = normD.includes(normalized) || d.name.toLowerCase().includes(rawLower);
        const aliasMatch = d.aliases.some(
          (a) => normalizeAdminName(a).includes(normalized) || a.toLowerCase().includes(rawLower)
        );
        if (nameMatch || aliasMatch) {
          matches.push(d);
        }
      }
      return LocationService.rankSearchResults(matches, rawLower, normalized).slice(0, limit);
    }
    try {
      const records = await prisma.administrativeDivision.findMany({
        where: {
          OR: [
            { normalizedName: { contains: normalized } },
            { name: { contains: query.trim(), mode: "insensitive" } },
            { aliases: { has: query.trim() } },
          ],
        },
        include: { parent: true },
        take: limit * 2,
      });

      if (records.length > 0) {
        const mapped = records.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          level: r.level as "PROVINCE" | "DISTRICT" | "SECTOR",
          parentId: r.parentId,
          parentName: r.parent?.name || null,
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
          aliases: r.aliases,
          canonicalName:
            r.level === "SECTOR"
              ? `${r.name}, ${r.parent?.name || ""} District`
              : r.level === "DISTRICT"
              ? `${r.name} District, Rwanda`
              : `${r.name}, Rwanda`,
        }));
        return LocationService.rankSearchResults(mapped, rawLower, normalized).slice(0, limit);
      }
    } catch {
      // Fall through to in-memory
    }

    // In-memory search
    const matches: DivisionDto[] = [];
    for (const d of fallbackDivisions) {
      const normD = normalizeAdminName(d.name);
      const nameMatch = normD.includes(normalized) || d.name.toLowerCase().includes(rawLower);
      const aliasMatch = d.aliases.some(
        (a) => normalizeAdminName(a).includes(normalized) || a.toLowerCase().includes(rawLower)
      );
      if (nameMatch || aliasMatch) {
        matches.push(d);
      }
    }
    return LocationService.rankSearchResults(matches, rawLower, normalized).slice(0, limit);
  },

  /**
   * Resolve a location by name, code, or ID
   */
  resolveLocation: async (term: string): Promise<DivisionDto | null> => {
    if (!term || term.trim().length === 0) return null;
    const raw = term.trim();
    const normalized = normalizeAdminName(raw);
    const rawLower = raw.toLowerCase();

    if (process.env.NODE_ENV === "test") {
      if (fallbackByCode.has(raw)) return fallbackByCode.get(raw)!;
      if (fallbackByName.has(rawLower)) return fallbackByName.get(rawLower)!;
      const normMatches = fallbackByNormalized.get(normalized);
      if (normMatches && normMatches.length > 0) return normMatches[0];
      for (const d of fallbackDivisions) {
        if (d.aliases.some((a) => a.toLowerCase() === rawLower || normalizeAdminName(a) === normalized)) {
          return d;
        }
      }
      return null;
    }
    try {
      const record = await prisma.administrativeDivision.findFirst({
        where: {
          OR: [
            { id: raw },
            { code: raw },
            { normalizedName: normalized },
            { name: { equals: raw, mode: "insensitive" } },
          ],
        },
        include: { parent: true },
      });
      if (record) {
        return {
          id: record.id,
          code: record.code,
          name: record.name,
          level: record.level as "PROVINCE" | "DISTRICT" | "SECTOR",
          parentId: record.parentId,
          parentName: record.parent?.name || null,
          latitude: Number(record.latitude),
          longitude: Number(record.longitude),
          aliases: record.aliases,
          canonicalName:
            record.level === "SECTOR"
              ? `${record.name}, ${record.parent?.name || ""} District`
              : record.level === "DISTRICT"
              ? `${record.name} District, Rwanda`
              : `${record.name}, Rwanda`,
        };
      }
    } catch {
      // Fall through
    }

    // Fallback checks
    if (fallbackByCode.has(raw)) return fallbackByCode.get(raw)!;
    if (fallbackByName.has(rawLower)) return fallbackByName.get(rawLower)!;
    const normMatches = fallbackByNormalized.get(normalized);
    if (normMatches && normMatches.length > 0) return normMatches[0];

    // Check alias exact match
    for (const d of fallbackDivisions) {
      if (d.aliases.some((a) => a.toLowerCase() === rawLower || normalizeAdminName(a) === normalized)) {
        return d;
      }
    }

    return null;
  },

  /**
   * Sort matches by relevance (exact match first, then prefix, then level)
   */
  rankSearchResults: (results: DivisionDto[], queryRaw: string, queryNorm: string): DivisionDto[] => {
    return results.sort((a, b) => {
      const aNorm = normalizeAdminName(a.name);
      const bNorm = normalizeAdminName(b.name);

      // 1. Exact normalized match
      if (aNorm === queryNorm && bNorm !== queryNorm) return -1;
      if (bNorm === queryNorm && aNorm !== queryNorm) return 1;

      // 2. Starts with query
      if (aNorm.startsWith(queryNorm) && !bNorm.startsWith(queryNorm)) return -1;
      if (bNorm.startsWith(queryNorm) && !aNorm.startsWith(queryNorm)) return 1;

      // 3. Level priority: District/Sector first before Province for local searches
      const levelRank: Record<string, number> = { SECTOR: 1, DISTRICT: 2, PROVINCE: 3 };
      const rankDiff = (levelRank[a.level] || 4) - (levelRank[b.level] || 4);
      if (rankDiff !== 0) return rankDiff;

      return a.name.localeCompare(b.name);
    });
  },

  /**
   * Expose all fallback divisions for direct client embedding/synchronization
   */
  getAllFallbackDivisions: (): DivisionDto[] => {
    return fallbackDivisions;
  },
};
