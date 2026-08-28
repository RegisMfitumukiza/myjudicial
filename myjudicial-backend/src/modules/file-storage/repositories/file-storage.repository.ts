/**
 * File Storage Domain — Repository
 *
 * All Prisma interactions for the Document / DocumentShare models live here.
 * The repository is the ONLY layer that imports Prisma. Services call the
 * repository; controllers never touch Prisma directly.
 */

import { prisma } from "../../../infrastructure/database/prisma.js";
import type { FileOwnerType, FileSensitivity, StoredFileMetadata, AdminDocumentView } from "../types/index.js";
import type { Prisma } from "../../../generated/prisma/client.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Minimal column set returned from every Document query.
 * Never select encryptedAesKey / iv in list queries — only on explicit
 * metadata or signed-URL lookups where the caller needs decryption params.
 */
const documentSelect = {
  id:                  true,
  ownerId:             true,
  ownerType:           true,
  bookingId:           true,
  bucketName:          true,
  objectKey:           true,
  fileName:            true,
  mimeType:            true,
  fileSize:            true,
  sensitivity:         true,
  encryptionAlgorithm: true,
  keyVersion:          true,
  kmsKeyId:            true,
  encryptedAt:         true,
  isVault:             true,
  uploadedById:        true,
  createdAt:           true,
  updatedAt:           true,
} as const;

/** Full select including encryption keys — used only for signed-URL generation */
const documentSelectWithKeys = {
  ...documentSelect,
  encryptedAesKey: true,
  iv:              true,
} as const;

// ─── Create ───────────────────────────────────────────────────────────────────

export type CreateDocumentData = {
  ownerId:             string;
  ownerType:           FileOwnerType;
  bucketName:          string;
  objectKey:           string;
  fileName:            string;
  mimeType:            string;
  fileSize:            number;
  sensitivity:         FileSensitivity;
  bookingId?:          string;
  encryptedAesKey?:    string;
  iv?:                 string;
  encryptionAlgorithm?: string;
  keyVersion?:         string;
  kmsKeyId?:           string;
  encryptedAt?:        Date;
  isVault?:            boolean;
  uploadedById?:       string;
};

export const FileStorageRepository = {
  /**
   * Persist document metadata after a successful OCI upload.
   */
  create: async (data: CreateDocumentData): Promise<StoredFileMetadata> => {
    return prisma.document.create({
      data: {
        ...data,
        isVault:   data.isVault ?? true,
        isDeleted: false,
      },
      select: documentSelect,
    }) as Promise<StoredFileMetadata>;
  },

  // ─── Find ──────────────────────────────────────────────────────────────────

  /**
   * Find a single document by ID.
   * Returns null if not found or soft-deleted.
   */
  findById: async (id: string): Promise<StoredFileMetadata | null> => {
    const doc = await prisma.document.findFirst({
      where: { id, isDeleted: false },
      select: documentSelect,
    });
    return doc as StoredFileMetadata | null;
  },

  /**
   * Find a document by ID and include encryption keys.
   * Use only when generating signed download URLs.
   */
  findByIdWithKeys: async (id: string) => {
    return prisma.document.findFirst({
      where: { id, isDeleted: false },
      select: documentSelectWithKeys,
    });
  },

  /**
   * Find a single document by objectKey.
   * Returns null if not found or soft-deleted.
   */
  findByObjectKey: async (objectKey: string): Promise<StoredFileMetadata | null> => {
    const doc = await prisma.document.findFirst({
      where: { objectKey, isDeleted: false },
      select: documentSelect,
    });
    return doc as StoredFileMetadata | null;
  },

  /**
   * Find a document by objectKey and include encryption keys.
   */
  findByObjectKeyWithKeys: async (objectKey: string) => {
    return prisma.document.findFirst({
      where: { objectKey, isDeleted: false },
      select: documentSelectWithKeys,
    });
  },

  /**
   * Paginated list of non-deleted documents owned by a specific owner.
   */
  findByOwner: async (
    ownerId:   string,
    ownerType: FileOwnerType,
    page:      number,
    limit:     number,
    filters?:  { sensitivity?: FileSensitivity }
  ): Promise<{ records: StoredFileMetadata[]; total: number }> => {
    const where: Prisma.DocumentWhereInput = {
      ownerId,
      ownerType,
      isDeleted: false,
      ...(filters?.sensitivity && { sensitivity: filters.sensitivity }),
    };

    const [records, total] = await prisma.$transaction([
      prisma.document.findMany({
        where,
        select:  documentSelect,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.document.count({ where }),
    ]);

    return { records: records as StoredFileMetadata[], total };
  },

  /**
   * Find all non-deleted documents accessible to a user via DocumentShare.
   * Used to list files shared with the caller by others.
   */
  findSharedWith: async (
    userId: string,
    page:   number,
    limit:  number
  ): Promise<{ records: StoredFileMetadata[]; total: number }> => {
    const now = new Date();

    const shares = await prisma.documentShare.findMany({
      where: {
        sharedWithId: userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        document: { isDeleted: false },
      },
      select: { document: { select: documentSelect } },
      skip:  (page - 1) * limit,
      take:  limit,
    });

    const total = await prisma.documentShare.count({
      where: {
        sharedWithId: userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        document: { isDeleted: false },
      },
    });

    return {
      records: shares.map((s) => s.document) as StoredFileMetadata[],
      total,
    };
  },

  /**
   * Paginated list of non-deleted documents attached to a booking/case.
   * Access is enforced at the service layer (participants only).
   */
  findByBooking: async (
    bookingId: string,
    page:      number,
    limit:     number
  ): Promise<{ records: StoredFileMetadata[]; total: number }> => {
    const where: Prisma.DocumentWhereInput = {
      bookingId,
      isDeleted: false,
    };

    const [records, total] = await prisma.$transaction([
      prisma.document.findMany({
        where,
        select:  documentSelect,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.document.count({ where }),
    ]);

    return { records: records as StoredFileMetadata[], total };
  },

  /**
   * Admin documents list — global paginated query over all non-deleted files
   * with role (uploader CITIZEN/EXPERT), ownerType, sensitivity, free-text
   * search and sorting. Used by GET /admin/documents.
   */
  findAdminDocuments: async (filters: {
    page:         number;
    limit:        number;
    role?:        "CLIENT" | "EXPERT";
    ownerType?:   FileOwnerType;
    sensitivity?: FileSensitivity;
    search?:      string;
    sortBy:       "createdAt" | "fileName" | "fileSize";
    order:        "asc" | "desc";
  }): Promise<{ records: AdminDocumentView[]; total: number }> => {
    const where: Prisma.DocumentWhereInput = {
      isDeleted: false,
      ...(filters.ownerType && { ownerType: filters.ownerType }),
      ...(filters.sensitivity && { sensitivity: filters.sensitivity }),
      ...(filters.role && {
        uploadedBy: { role: filters.role === "CLIENT" ? "CITIZEN" : "EXPERT" },
      }),
      ...(filters.search && {
        OR: [
          { fileName: { contains: filters.search, mode: "insensitive" } },
          { uploadedBy: { email: { contains: filters.search, mode: "insensitive" } } },
          { uploadedBy: { firstName: { contains: filters.search, mode: "insensitive" } } },
          { uploadedBy: { lastName: { contains: filters.search, mode: "insensitive" } } },
        ],
      }),
    };

    const orderBy: Prisma.DocumentOrderByWithRelationInput = {
      [filters.sortBy]: filters.order,
    };

    const [records, total] = await prisma.$transaction([
      prisma.document.findMany({
        where,
        select: {
          ...documentSelect,
          uploadedBy: {
            select: {
              id:        true,
              email:     true,
              firstName: true,
              lastName:  true,
              role:      true,
            },
          },
        },
        skip:    (filters.page - 1) * filters.limit,
        take:    filters.limit,
        orderBy,
      }),
      prisma.document.count({ where }),
    ]);

    return { records: records as unknown as AdminDocumentView[], total };
  },

  // ─── Update ────────────────────────────────────────────────────────────────

  /** Soft-delete a document. The OCI object is deleted separately by the service. */
  softDelete: async (id: string): Promise<void> => {
    await prisma.document.update({
      where: { id },
      data:  { isDeleted: true, deletedAt: new Date() },
    });
  },

  // ─── Share Management ──────────────────────────────────────────────────────

  /**
   * Create a DocumentShare grant.
   * Idempotent — if the share already exists, returns the existing record.
   */
  createShare: async (
    documentId:   string,
    sharedWithId: string,
    expiresAt?:   Date
  ) => {
    return prisma.documentShare.upsert({
      where:  { documentId_sharedWithId: { documentId, sharedWithId } },
      create: { documentId, sharedWithId, expiresAt },
      update: { expiresAt },
    });
  },

  /** Check if a user has an active (non-expired) share grant for a document. */
  findActiveShare: async (
    documentId:   string,
    sharedWithId: string
  ): Promise<boolean> => {
    const now   = new Date();
    const share = await prisma.documentShare.findFirst({
      where: {
        documentId,
        sharedWithId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
    return share !== null;
  },

  /** Revoke an existing share grant. */
  deleteShare: async (documentId: string, sharedWithId: string): Promise<void> => {
    await prisma.documentShare.deleteMany({ where: { documentId, sharedWithId } });
  },
};
