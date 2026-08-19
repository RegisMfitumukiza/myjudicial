/**
 * OCI Object Storage — S3-Compatible Infrastructure Client
 *
 * OCI exposes an S3-compatible API endpoint. We use the AWS SDK v3 (already
 * installed) pointed at the OCI endpoint. This is the ONLY place in the
 * codebase that instantiates an S3 client or calls OCI directly.
 *
 * Bucket organization:
 *   experts/{expertId}/certificates/
 *   experts/{expertId}/national-id/
 *   experts/{expertId}/profile/
 *   clients/{clientId}/documents/
 *   cases/{caseId}/evidence/
 *   cases/{caseId}/attachments/
 *   compliance/{expertId}/
 *
 * Security:
 *   - All uploaded objects are pre-encrypted by the browser (AES-256-GCM).
 *   - This service never decrypts; it stores and retrieves opaque binary blobs.
 *   - Signed URLs expire in OCI_SIGNED_URL_EXPIRY_SECONDS (default 900s / 15 min).
 *   - Permanent object URLs are never exposed to callers.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  type PutObjectCommandInput,
  type HeadObjectOutput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "../../shared/utils/logger.js";
import { StorageProviderError } from "../../shared/errors/index.js";
import fs from "fs";
import path from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

const getOciConfig = () => {
  const raw = (key: string, fallback = "") => (process.env[key] ?? fallback).trim();
  return {
    endpoint:      raw("OCI_ENDPOINT"),
    bucket:        raw("OCI_BUCKET_NAME"),
    region:        raw("OCI_REGION", "us-ashburn-1"),
    accessKeyId:   raw("OCI_ACCESS_KEY_ID"),
    secretKey:     raw("OCI_SECRET_ACCESS_KEY"),
    signedUrlTtl:  parseInt(raw("OCI_SIGNED_URL_EXPIRY_SECONDS", "900"), 10),
  };
};

// Helper to determine if we should use local filesystem fallback
const isOciConfigured = (): boolean => {
  const cfg = getOciConfig();
  // All three must be set and not contain obvious placeholders
  if (!cfg.accessKeyId || !cfg.secretKey || !cfg.endpoint) return false;
  if (cfg.endpoint.includes("[") || cfg.accessKeyId.includes("[") || cfg.secretKey.includes("[")) return false;
  return true;
};

// Helper to get local storage file path
const getLocalFilePath = (bucket: string, key: string): string => {
  return path.join(process.cwd(), "storage", bucket || "default-bucket", key);
};

// ─── Singleton S3 Client ──────────────────────────────────────────────────────

let _client: S3Client | null = null;

const getClient = (): S3Client => {
  if (_client) return _client;

  const cfg = getOciConfig();

  _client = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint || undefined,
    /**
     * OCI S3-compatible requires path-style URLs:
     * https://<namespace>.compat.objectstorage.<region>.oraclecloud.com/<bucket>/<key>
     */
    forcePathStyle: true,
    credentials: {
      accessKeyId:     cfg.accessKeyId,
      secretAccessKey: cfg.secretKey,
    },
  });

  return _client;
};

// ─── Public Bucket Name Accessor ─────────────────────────────────────────────

export const getDefaultBucketName = (): string => {
  return (process.env.OCI_BUCKET_NAME || "local-dev-bucket").trim();
};

// ─── Upload ───────────────────────────────────────────────────────────────────

export type UploadObjectOptions = {
  /** Object key (path within the bucket, e.g. experts/abc/certificates/xyz.enc) */
  key: string;
  /** Raw buffer — must be pre-encrypted by the client. Server never sees plaintext. */
  body: Buffer;
  /** MIME type of the encrypted payload (typically application/octet-stream) */
  contentType: string;
  /** Arbitrary key-value metadata stored alongside the object */
  metadata?: Record<string, string>;
  /** Override bucket (defaults to OCI_BUCKET_NAME) */
  bucket?: string;
};

/**
 * Upload a pre-encrypted object to OCI Object Storage.
 * Returns the object key on success.
 */
export const uploadObject = async (opts: UploadObjectOptions): Promise<string> => {
  const cfg = getOciConfig();
  const bucket = opts.bucket ?? cfg.bucket;

  if (!isOciConfigured()) {
    logger.debug("Local Storage.", { bucket, key: opts.key });
    try {
      const localPath = getLocalFilePath(bucket, opts.key);
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(localPath, opts.body);
      logger.info("Local Storage: object uploaded", { bucket, key: opts.key, localPath });
      return opts.key;
    } catch (error) {
      logger.error("Local Storage: uploadObject failed", {
        bucket,
        key:   opts.key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new StorageProviderError("Failed to upload file to local storage");
    }
  }

  const input: PutObjectCommandInput = {
    Bucket:      bucket,
    Key:         opts.key,
    Body:        opts.body,
    ContentType: opts.contentType,
    Metadata:    opts.metadata,
    // OCI server-side encryption as an additional defense-in-depth layer.
    // Primary security is client-side AES-256-GCM.
    ServerSideEncryption: "aws:kms" as const,
  };

  try {
    const client = getClient();
    await client.send(new PutObjectCommand(input));
    logger.info("OCI: object uploaded", { bucket, key: opts.key });
    return opts.key;
  } catch (error) {
    logger.error("OCI: uploadObject failed", {
      bucket,
      key:   opts.key,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new StorageProviderError("Failed to upload file to storage");
  }
};

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Permanently delete an object from OCI.
 * Idempotent — does not throw if the object is already gone.
 */
export const deleteObject = async (key: string, bucket?: string): Promise<void> => {
  const cfg = getOciConfig();
  const b = bucket ?? cfg.bucket;

  if (!isOciConfigured()) {
    logger.debug("Local Storage: fallback delete.", { bucket: b, key });
    try {
      const localPath = getLocalFilePath(b, key);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        logger.info("Local Storage: object deleted", { bucket: b, key, localPath });
      }
      return;
    } catch (error) {
      logger.error("Local Storage: deleteObject failed", {
        bucket: b,
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new StorageProviderError("Failed to delete file from local storage");
    }
  }

  try {
    const client = getClient();
    await client.send(new DeleteObjectCommand({ Bucket: b, Key: key }));
    logger.info("OCI: object deleted", { bucket: b, key });
  } catch (error) {
    logger.error("OCI: deleteObject failed", {
      bucket: b,
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new StorageProviderError("Failed to delete file from storage");
  }
};

// ─── Download ─────────────────────────────────────────────────────────────────

/**
 * Fetch a full object from storage and return its Buffer.
 * Used for server-side decryption.
 */
export const downloadObject = async (key: string, bucket: string): Promise<Buffer> => {
  if (!isOciConfigured()) {
    try {
      const localPath = getLocalFilePath(bucket, key);
      return fs.promises.readFile(localPath);
    } catch (error) {
      throw new StorageProviderError(`Failed to read file from local storage: ${key}`);
    }
  }

  try {
    const client = getClient();
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await client.send(command);
    
    if (!response.Body) {
      throw new Error("Empty response body from OCI");
    }

    // Convert Web ReadableStream/Node Stream to Buffer
    const chunks = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    logger.error("OCI: downloadObject failed", {
      bucket,
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new StorageProviderError(`Failed to download file from storage: ${key}`);
  }
};

// ─── Signed URL (Download) ────────────────────────────────────────────────────

export type SignedUrlResult = {
  /** Pre-signed URL — valid for expiresInSeconds */
  url: string;
  /** Absolute UTC timestamp when the URL expires */
  expiresAt: Date;
};

/**
 * Generate a time-limited pre-signed URL for downloading an encrypted object.
 *
 * The caller (browser) downloads the encrypted blob and decrypts it locally.
 * The backend never decrypts.
 *
 * @param key            Object key
 * @param expiresInSecs  TTL in seconds (defaults to OCI_SIGNED_URL_EXPIRY_SECONDS)
 * @param bucket         Optional bucket override
 */
export const getSignedDownloadUrl = async (
  key: string,
  expiresInSecs?: number,
  bucket?: string
): Promise<SignedUrlResult> => {
  const cfg = getOciConfig();
  const b   = bucket ?? cfg.bucket;
  const ttl = expiresInSecs ?? cfg.signedUrlTtl;

  if (!isOciConfigured()) {
    logger.debug("Local Storage: generating download URL", { bucket: b, key });
    const expiresAt = new Date(Date.now() + ttl * 1_000);
    const baseUrl = process.env.BASE_URL ?? "http://localhost:4000";
    const url = `${baseUrl}/api/v1/files/local-download?key=${encodeURIComponent(key)}&bucket=${encodeURIComponent(b)}`;
    logger.info("Local Storage: download URL generated", { key, expiresAt, url });
    return { url, expiresAt };
  }

  try {
    const client  = getClient();
    const command = new GetObjectCommand({ Bucket: b, Key: key });
    const url     = await getSignedUrl(client, command, { expiresIn: ttl });

    const expiresAt = new Date(Date.now() + ttl * 1_000);
    logger.info("OCI: signed download URL generated", { key, expiresAt });
    return { url, expiresAt };
  } catch (error) {
    logger.error("OCI: getSignedDownloadUrl failed", {
      bucket: b,
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new StorageProviderError("Failed to generate download URL");
  }
};

// ─── Object Existence Check ───────────────────────────────────────────────────

/**
 * Returns object metadata from OCI without downloading the body.
 * Returns null if the object does not exist.
 */
export const headObject = async (
  key: string,
  bucket?: string
): Promise<HeadObjectOutput | null> => {
  const cfg = getOciConfig();
  const b   = bucket ?? cfg.bucket;

  if (!isOciConfigured()) {
    logger.debug("Local Storage: checking existence.", { bucket: b, key });
    try {
      const localPath = getLocalFilePath(b, key);
      if (!fs.existsSync(localPath)) {
        return null;
      }
      const stat = fs.statSync(localPath);
      return {
        ContentLength: stat.size,
        LastModified: stat.mtime,
      };
    } catch (error) {
      logger.error("Local Storage: headObject failed", {
        bucket: b,
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new StorageProviderError("Failed to check file status in local storage");
    }
  }

  try {
    const client = getClient();
    return await client.send(new HeadObjectCommand({ Bucket: b, Key: key }));
  } catch (error: unknown) {
    // S3 / OCI returns a 404-like error when the object doesn't exist
    if (
      error instanceof Error &&
      ("$metadata" in error
        ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404
        : error.name === "NoSuchKey" || error.name === "NotFound")
    ) {
      return null;
    }
    logger.error("OCI: headObject failed", {
      bucket: b,
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new StorageProviderError("Failed to check file status in storage");
  }
};

// ─── Architecture Hook — Malware Scanning ─────────────────────────────────────

/**
 * Extension point for future malware scanning integration.
 *
 * Intended integrations:
 *   - ClamAV (local container)
 *   - OCI Malware Scanning service
 *   - Third-party AV APIs (VirusTotal, etc.)
 *
 * When a scanner is configured, call this AFTER upload, BEFORE persisting
 * the document metadata. If scanning fails/rejects, delete the uploaded
 * object and throw FileUploadError.
 *
 * @param _key     Object key in OCI
 * @param _bucket  Bucket name
 */
export const scanForMalware = async (_key: string, _bucket?: string): Promise<void> => {
  // TODO(security): wire in ClamAV / OCI Malware Scanning
  logger.debug("OCI: malware scan — scanner not configured, skipping", { key: _key });
};
