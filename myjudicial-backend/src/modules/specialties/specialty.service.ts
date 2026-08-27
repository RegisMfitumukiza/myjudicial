import { prisma } from "../../infrastructure/database/prisma.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import type { CreateSpecialtyDto, UpdateSpecialtyDto, ListSpecialtiesQuery } from "./specialty.schemas.js";

export const SpecialtyService = {
  async list(query: ListSpecialtiesQuery) {
    const { page, limit, isActive, group, search } = query;
    const where: Record<string, unknown> = {};

    if (isActive !== undefined) where.isActive = isActive;
    if (group) where.group = group;
    if (search) {
      where.OR = [
        { label: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.specialty.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.specialty.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  async listActive() {
    return prisma.specialty.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: {
        id: true,
        slug: true,
        label: true,
        description: true,
        icon: true,
        group: true,
      },
    });
  },

  async getById(id: string) {
    const specialty = await prisma.specialty.findUnique({ where: { id } });
    if (!specialty) throw new NotFoundError("Specialty not found");
    return specialty;
  },

  async getBySlug(slug: string) {
    return prisma.specialty.findUnique({ where: { slug } });
  },

  async create(dto: CreateSpecialtyDto) {
    const existing = await prisma.specialty.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ValidationError("A specialty with this slug already exists");

    const maxOrder = await prisma.specialty.aggregate({ _max: { sortOrder: true } });

    return prisma.specialty.create({
      data: {
        slug: dto.slug,
        label: dto.label,
        description: dto.description,
        icon: dto.icon,
        group: dto.group,
        sortOrder: dto.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
        isActive: dto.isActive ?? true,
      },
    });
  },

  async update(id: string, dto: UpdateSpecialtyDto) {
    const existing = await prisma.specialty.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Specialty not found");

    if (dto.slug && dto.slug !== existing.slug) {
      const slugTaken = await prisma.specialty.findUnique({ where: { slug: dto.slug } });
      if (slugTaken) throw new ValidationError("A specialty with this slug already exists");
    }

    return prisma.specialty.update({
      where: { id },
      data: {
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.group !== undefined && { group: dto.group }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  },

  async toggleActive(id: string) {
    const existing = await prisma.specialty.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Specialty not found");

    return prisma.specialty.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
  },

  async remove(id: string) {
    const existing = await prisma.specialty.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Specialty not found");

    await prisma.specialty.delete({ where: { id } });
  },

  async getGroups() {
    const groups = await prisma.specialty.findMany({
      where: { isActive: true },
      select: { group: true },
      distinct: ["group"],
      orderBy: { group: "asc" },
    });
    return groups.map((g) => g.group).filter(Boolean) as string[];
  },

  async reorder(ids: string[]) {
    const updates = ids.map((id, index) =>
      prisma.specialty.update({
        where: { id },
        data: { sortOrder: index },
      })
    );
    await prisma.$transaction(updates);
  },
};
