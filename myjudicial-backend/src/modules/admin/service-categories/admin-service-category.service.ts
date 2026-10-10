import { prisma } from "../../../infrastructure/database/prisma.js";
import { NotFoundError } from "../../../shared/errors/index.js";
import { NotificationEvent, NotificationChannel } from "../../../generated/prisma/client.js";
import type {
  PromoteServiceCategoryDto,
  MergeServiceCategoryDto,
  ListServiceCategoriesQuery,
} from "./admin-service-category.schemas.js";

export const STANDARD_SERVICE_CATEGORIES = [
  "consultation",
  "document_review",
  "contract_drafting",
  "court_representation",
  "legal_advice",
  "mediation",
];

export interface CategorySummary {
  category: string;
  isStandard: boolean;
  serviceCount: number;
  activeServiceCount: number;
  expertCount: number;
  sampleServices: string[];
  sampleExperts: string[];
}

export const AdminServiceCategoryService = {
  /**
   * List all service categories (both standard taxonomy and custom candidate tags)
   * with counts of active services and distinct experts.
   */
  async listCategories(query: ListServiceCategoriesQuery): Promise<{
    categories: CategorySummary[];
    totalStandard: number;
    totalCandidate: number;
    totalServices: number;
  }> {
    const services = await prisma.legalService.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        isActive: true,
        expertId: true,
        expert: {
          select: {
            id: true,
            displayName: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const categoryMap = new Map<
      string,
      {
        category: string;
        isStandard: boolean;
        serviceCount: number;
        activeServiceCount: number;
        expertIds: Set<string>;
        sampleServices: Set<string>;
        sampleExperts: Set<string>;
      }
    >();

    // Seed standard categories so they always appear even if zero services currently use them
    for (const std of STANDARD_SERVICE_CATEGORIES) {
      categoryMap.set(std, {
        category: std,
        isStandard: true,
        serviceCount: 0,
        activeServiceCount: 0,
        expertIds: new Set<string>(),
        sampleServices: new Set<string>(),
        sampleExperts: new Set<string>(),
      });
    }

    for (const s of services) {
      const rawCategory = s.category?.trim() || "other";
      if (!categoryMap.has(rawCategory)) {
        categoryMap.set(rawCategory, {
          category: rawCategory,
          isStandard: STANDARD_SERVICE_CATEGORIES.includes(rawCategory),
          serviceCount: 0,
          activeServiceCount: 0,
          expertIds: new Set<string>(),
          sampleServices: new Set<string>(),
          sampleExperts: new Set<string>(),
        });
      }

      const entry = categoryMap.get(rawCategory)!;
      entry.serviceCount += 1;
      if (s.isActive) entry.activeServiceCount += 1;
      entry.expertIds.add(s.expertId);
      if (entry.sampleServices.size < 3) entry.sampleServices.add(s.name);
      if (s.expert?.displayName && entry.sampleExperts.size < 3) {
        entry.sampleExperts.add(s.expert.displayName);
      }
    }

    let allSummaries: CategorySummary[] = Array.from(categoryMap.values()).map((e) => ({
      category: e.category,
      isStandard: e.isStandard,
      serviceCount: e.serviceCount,
      activeServiceCount: e.activeServiceCount,
      expertCount: e.expertIds.size,
      sampleServices: Array.from(e.sampleServices),
      sampleExperts: Array.from(e.sampleExperts),
    }));

    // Filter by type (standard vs candidate)
    if (query.type === "standard") {
      allSummaries = allSummaries.filter((c) => c.isStandard);
    } else if (query.type === "candidate") {
      allSummaries = allSummaries.filter((c) => !c.isStandard);
    }

    // Filter by search keyword
    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      allSummaries = allSummaries.filter(
        (c) =>
          c.category.toLowerCase().includes(q) ||
          c.sampleServices.some((s) => s.toLowerCase().includes(q)) ||
          c.sampleExperts.some((e) => e.toLowerCase().includes(q))
      );
    }

    // Sort: Candidates with services first, then standard categories, then alphabetized
    allSummaries.sort((a, b) => {
      if (a.isStandard !== b.isStandard) {
        return a.isStandard ? 1 : -1; // Candidates on top for review
      }
      if (b.serviceCount !== a.serviceCount) {
        return b.serviceCount - a.serviceCount;
      }
      return a.category.localeCompare(b.category);
    });

    const totalStandard = Array.from(categoryMap.values()).filter((c) => c.isStandard).length;
    const totalCandidate = Array.from(categoryMap.values()).filter((c) => !c.isStandard).length;

    return {
      categories: allSummaries,
      totalStandard,
      totalCandidate,
      totalServices: services.length,
    };
  },

  /**
   * Promote a candidate category into a standardized platform category.
   * Batch updates all matching services and optionally notifies advocates in-app.
   */
  async promoteCategory(dto: PromoteServiceCategoryDto, adminId: string) {
    const services = await prisma.legalService.findMany({
      where: { category: dto.sourceCategory },
      include: {
        expert: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true },
            },
          },
        },
      },
    });

    if (services.length === 0) {
      throw new NotFoundError(`No services found under category "${dto.sourceCategory}"`);
    }

    // Batch update category on all services
    await prisma.legalService.updateMany({
      where: { category: dto.sourceCategory },
      data: { category: dto.targetCategory },
    });

    // Collect affected unique users
    const uniqueUsers = new Map<string, { id: string; email: string; name: string }>();
    for (const s of services) {
      if (s.expert?.user) {
        uniqueUsers.set(s.expert.user.id, {
          id: s.expert.user.id,
          email: s.expert.user.email,
          name: s.expert.user.firstName || s.expert.displayName,
        });
      }
    }

    // Pillar 4: Notify advocates via in-app notification log
    if (dto.notifyExperts && uniqueUsers.size > 0) {
      const defaultMessage =
        `Your legal service previously listed under "${dto.sourceCategory}" has been verified ` +
        `and officially promoted to "${dto.targetCategory}" by platform administration, expanding your visibility to prospective clients across Rwanda.`;

      const notificationLogs = Array.from(uniqueUsers.values()).map((user) => ({
        userId: user.id,
        event: NotificationEvent.WELCOME,
        channel: NotificationChannel.PUSH,
        recipient: user.email,
        subject: `Legal Service Category Promoted: ${dto.targetCategory}`,
        body: dto.customMessage?.trim() || defaultMessage,
        sent: true,
        sentAt: new Date(),
      }));

      await prisma.notificationLog.createMany({
        data: notificationLogs,
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: "UPDATE",
        resource: "SERVICE",
        description: `Promoted service category "${dto.sourceCategory}" to "${dto.targetCategory}".`,
        metadata: {
          sourceCategory: dto.sourceCategory,
          targetCategory: dto.targetCategory,
          serviceCount: services.length,
          expertCount: uniqueUsers.size,
          notifyExperts: dto.notifyExperts,
        } as any,
      },
    });

    return {
      sourceCategory: dto.sourceCategory,
      targetCategory: dto.targetCategory,
      updatedServices: services.length,
      notifiedExperts: dto.notifyExperts ? uniqueUsers.size : 0,
    };
  },

  /**
   * Merge a messy or duplicate candidate category into an existing standard category.
   * Batch updates all matching services and optionally notifies advocates in-app.
   */
  async mergeCategory(dto: MergeServiceCategoryDto, adminId: string) {
    const services = await prisma.legalService.findMany({
      where: { category: dto.sourceCategory },
      include: {
        expert: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true },
            },
          },
        },
      },
    });

    if (services.length === 0) {
      throw new NotFoundError(`No services found under category "${dto.sourceCategory}"`);
    }

    // Batch update
    await prisma.legalService.updateMany({
      where: { category: dto.sourceCategory },
      data: { category: dto.targetCategory },
    });

    // Collect affected unique users
    const uniqueUsers = new Map<string, { id: string; email: string; name: string }>();
    for (const s of services) {
      if (s.expert?.user) {
        uniqueUsers.set(s.expert.user.id, {
          id: s.expert.user.id,
          email: s.expert.user.email,
          name: s.expert.user.firstName || s.expert.displayName,
        });
      }
    }

    // Pillar 4: Notify advocates via in-app notification log
    if (dto.notifyExperts && uniqueUsers.size > 0) {
      const defaultMessage =
        `Your legal service previously listed under "${dto.sourceCategory}" has been merged ` +
        `into the standardized category "${dto.targetCategory}" by platform administration to optimize client search indexing and client discovery.`;

      const notificationLogs = Array.from(uniqueUsers.values()).map((user) => ({
        userId: user.id,
        event: NotificationEvent.WELCOME,
        channel: NotificationChannel.PUSH,
        recipient: user.email,
        subject: `Legal Service Category Standardized: ${dto.targetCategory}`,
        body: dto.customMessage?.trim() || defaultMessage,
        sent: true,
        sentAt: new Date(),
      }));

      await prisma.notificationLog.createMany({
        data: notificationLogs,
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: "UPDATE",
        resource: "SERVICE",
        description: `Merged service category "${dto.sourceCategory}" into "${dto.targetCategory}".`,
        metadata: {
          sourceCategory: dto.sourceCategory,
          targetCategory: dto.targetCategory,
          serviceCount: services.length,
          expertCount: uniqueUsers.size,
          notifyExperts: dto.notifyExperts,
        } as any,
      },
    });

    return {
      sourceCategory: dto.sourceCategory,
      targetCategory: dto.targetCategory,
      updatedServices: services.length,
      notifiedExperts: dto.notifyExperts ? uniqueUsers.size : 0,
    };
  },
};
