import multer from "multer";
import { ValidationError } from "../errors/AppError.js";
import path from "path";
import fs from "fs";

// ─── Memory Storage (for pre-encrypted uploads — no disk writes) ─────────────────
//
// Used exclusively by the file-storage module. Encrypted binary payloads
// never touch the filesystem — they are forwarded directly to OCI.
// See: src/modules/file-storage/middleware/file-storage.middleware.ts

const memStorage = multer.memoryStorage();

/**
 * Single-file memory-storage upload. Accepts any MIME type.
 * Use for encrypted file uploads where the buffer is forwarded to OCI.
 * The field name is "file".
 */
export const encryptedFileUpload = multer({
  storage: memStorage,
  limits:  { fileSize: 50 * 1024 * 1024, files: 1 }, // 50 MB absolute cap
}).single("file");

/**
 * Single-image memory-storage upload for profile photos — forwarded directly
 * to OCI object storage (never written to local disk, unlike the legacy
 * `uploadUserAvatar` below, which is unsuitable for this app's stateless
 * Cloud Run deployment). The field name is "photo".
 */
export const avatarUpload = multer({
  storage: memStorage,
  limits:  { fileSize: 5 * 1024 * 1024, files: 1 }, // 5 MB cap
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new ValidationError("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
}).single("photo");

/**
 * Multi-file memory-storage upload. Accepts up to 10 files.
 * Use for verification document uploads where buffers are forwarded to OCI.
 * The field name is "files".
 */
export const encryptedFilesUpload = multer({
  storage: memStorage,
  limits:  { fileSize: 50 * 1024 * 1024, files: 10 },
}).array("files", 10);

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALL_ALLOWED_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  ...DOCUMENT_MIME_TYPES,
];

const createFileFilter =
  (allowedMimeTypes: string[], errorMessage: string) =>
  (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new ValidationError(errorMessage));
  };

const imageUpload = multer({
  storage,
  fileFilter: createFileFilter(
    IMAGE_MIME_TYPES,
    "Only image files are allowed"
  ),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const documentUpload = multer({
  storage,
  fileFilter: createFileFilter(
    DOCUMENT_MIME_TYPES,
    "Only PDF or Word documents are allowed"
  ),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const mixedUpload = multer({
  storage,
  fileFilter: createFileFilter(
    ALL_ALLOWED_MIME_TYPES,
    "Only image, PDF, or Word files are allowed"
  ),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

/* ================= IMAGE UPLOADS ================= */

export const uploadSingleImage = imageUpload.single("image");

export const uploadMultipleImages = imageUpload.array("images", 10);

/* ================= DOCUMENT UPLOADS ================= */

export const uploadSingleDocument = documentUpload.single("document");

export const uploadMultipleDocuments = documentUpload.array("documents", 10);

/* ================= MIXED UPLOADS ================= */

export const uploadSingleFile = mixedUpload.single("file");

export const uploadMultipleFiles = mixedUpload.array("files", 10);

/* ================= SPECIFIC FIELD UPLOADS ================= */

export const uploadUserAvatar = imageUpload.single("avatar");

export const uploadFarmImages = imageUpload.array("images", 10);

export const uploadVerificationDocument =
  documentUpload.single("document");

export default mixedUpload;
