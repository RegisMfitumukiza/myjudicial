import { z, registry } from "./registry.js";

const uuidField = z.string().uuid();

const ErrorResponse = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.string()).optional(),
});

const success = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({ success: z.literal(true), message: z.string(), data: dataSchema });

const errResponses = {
  400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
  401: { description: "Unauthenticated", content: { "application/json": { schema: ErrorResponse } } },
  403: { description: "Access Denied", content: { "application/json": { schema: ErrorResponse } } },
  404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } },
  422: { description: "Upload error", content: { "application/json": { schema: ErrorResponse } } },
  503: { description: "Storage unavailable", content: { "application/json": { schema: ErrorResponse } } },
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

const StoredFileMetadataDoc = z.object({
  id: uuidField,
  ownerId: uuidField,
  ownerType: z.string(),
  bucketName: z.string(),
  objectKey: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  sensitivity: z.string(),
  encryptionAlgorithm: z.string().nullable(),
  keyVersion: z.string().nullable(),
  kmsKeyId: z.string().nullable(),
  encryptedAesKey: z.string().optional(),
  iv: z.string().optional(),
  encryptedAt: z.string().nullable(),
  isVault: z.boolean(),
  uploadedById: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi("StoredFileMetadata");

registry.register("StoredFileMetadata", StoredFileMetadataDoc);

const FileSignedUrlResultDoc = z.object({
  url: z.string(),
  expiresAt: z.string(),
  file: StoredFileMetadataDoc,
}).openapi("FileSignedUrlResult");

registry.register("FileSignedUrlResult", FileSignedUrlResultDoc);

// ─── Routes ───────────────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/files/upload",
  tags: ["File Storage & Vault"],
  summary: "Upload pre-encrypted file",
  description: "Uploads an AES-256-GCM encrypted file to OCI Vault Storage. Client must supply encryption metadata. Requires any authenticated session.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              file: { type: "string", format: "binary", description: "The encrypted file payload" },
              metadata: { 
                type: "string", 
                description: 'JSON string containing UploadFileDto: { fileName, mimeType, category, sensitivity, ownerId, ownerType, encryption: { encryptionAlgorithm, keyVersion, encryptedAt, encryptedAesKey, iv } }' 
              },
            },
          },
        },
      },
    },
  },
  responses: {
    201: { description: "File uploaded successfully", content: { "application/json": { schema: success(StoredFileMetadataDoc) } } },
    ...errResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/files",
  tags: ["File Storage & Vault"],
  summary: "List files",
  description: "List all files owned by or shared with the authenticated user.",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      ownerType: z.string().optional(),
      sensitivity: z.string().optional(),
    }).openapi("ListFilesQuery"),
  },
  responses: {
    200: {
      description: "Paginated files list",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
            data: z.array(StoredFileMetadataDoc),
            meta: z.object({
              page: z.number(), limit: z.number(), total: z.number(),
              totalPages: z.number(), hasNext: z.boolean(), hasPrev: z.boolean(),
            }),
          }),
        },
      },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/files/{fileId}",
  tags: ["File Storage & Vault"],
  summary: "Get file metadata",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ fileId: uuidField }).openapi("GetFileMetadataParams") },
  responses: {
    200: { description: "File metadata retrieved", content: { "application/json": { schema: success(StoredFileMetadataDoc) } } },
    ...errResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/files/{fileId}/url",
  tags: ["File Storage & Vault"],
  summary: "Request Signed Download URL",
  description: "Returns a time-limited OCI signed URL plus the necessary decryption metadata (DEK/IV) for the client to decrypt the downloaded file.",
  security: [{ bearerAuth: [] }],
  request: { 
    params: z.object({ fileId: uuidField }).openapi("RequestSignedUrlParams"),
    body: {
      content: {
        "application/json": {
          schema: z.object({ expiresInSeconds: z.number().optional() }).openapi("RequestSignedUrlBody"),
        },
      },
    },
  },
  responses: {
    200: { description: "Signed URL generated", content: { "application/json": { schema: success(FileSignedUrlResultDoc) } } },
    ...errResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/files/{fileId}/share",
  tags: ["File Storage & Vault"],
  summary: "Share file",
  description: "Grants read access on a document to another user.",
  security: [{ bearerAuth: [] }],
  request: { 
    params: z.object({ fileId: uuidField }).openapi("ShareFileParams"),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({ 
            sharedWithId: uuidField, 
            expiresAt: z.string().datetime().optional() 
          }).openapi("ShareFileBody"),
        },
      },
    },
  },
  responses: {
    200: { description: "File shared successfully", content: { "application/json": { schema: success(z.null()) } } },
    ...errResponses,
  },
});

registry.registerPath({
  method: "delete",
  path: "/files/{fileId}",
  tags: ["File Storage & Vault"],
  summary: "Delete file",
  description: "Permanently deletes the file from OCI and soft-deletes its metadata record.",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ fileId: uuidField }).openapi("DeleteFileParams") },
  responses: {
    204: { description: "No Content (Deleted)" },
    ...errResponses,
  },
});
