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
import { StorageProviderError, FileUploadError } from "../../shared/errors/index.js";
import fs from "fs";
import path from "path";
import net from "net";

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

/**
 * Safely resolves an avatar or image object key to a download URL.
 * Supports direct HTTP/HTTPS URLs (e.g. Google OAuth) and pre-signed storage URLs.
 * Returns null if key is empty or if signing fails.
 */
export const resolveStorageUrl = async (
  key?: string | null,
  expiresInSecs?: number
): Promise<string | null> => {
  if (!key) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) {
    return key;
  }
  try {
    const signed = await getSignedDownloadUrl(key, expiresInSecs);
    return signed.url;
  } catch (err) {
    logger.warn("Failed to generate signed storage URL for key", { key, error: err });
    return null;
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

// ─── Multi-Engine Malware & Payload Integrity Scanner ────────────────────────

// Constructed at runtime so host OS antivirus does not quarantine the source file
const EICAR_SIGNATURE = [
  "X5O!P%@AP[4\\PZX54(P^)7CC)7}$",
  "EICAR-STANDARD-ANTIVIRUS-",
  "TEST-FILE!$H+H*",
].join("");

export interface MalwareScanVerdict {
  clean: boolean;
  threat?: string;
  engine: "signature" | "clamav" | "webhook";
}

/**
 * Layer 1: Synchronous signature & disguised-executable inspection.
 * Detects EICAR antivirus test strings, disguised Windows PE/MZ executables,
 * Linux ELF binaries, Mach-O binaries, and embedded server-side web shells.
 */
export const inspectBufferForMalware = (buffer: Buffer): MalwareScanVerdict => {
  if (!buffer || buffer.length === 0) {
    return { clean: true, engine: "signature" };
  }

  // Inspect first 64KB as text for known malware / webshell signatures
  const sampleText = buffer.subarray(0, Math.min(buffer.length, 65536)).toString("latin1");

  if (sampleText.includes(EICAR_SIGNATURE)) {
    return { clean: false, threat: "EICAR-Test-Signature", engine: "signature" };
  }

  if (sampleText.includes("<?php") || sampleText.includes("<%@ Page Language=")) {
    return { clean: false, threat: "WebShell.Script.Embedded", engine: "signature" };
  }

  // Check magic bytes for disguised native executables
  if (buffer.length >= 4) {
    // ELF binary: 0x7F 'E' 'L' 'F'
    if (
      buffer[0] === 0x7f &&
      buffer[1] === 0x45 &&
      buffer[2] === 0x4c &&
      buffer[3] === 0x46
    ) {
      return { clean: false, threat: "Executable.Linux.ELF", engine: "signature" };
    }

    // Windows MZ / PE executable: 'M' 'Z' (0x4D 0x5A) with PE header pointer
    if (buffer[0] === 0x4d && buffer[1] === 0x5a && buffer.length >= 64) {
      const peOffset = buffer.readUInt32LE(60);
      if (
        peOffset > 0 &&
        peOffset + 4 <= buffer.length &&
        buffer[peOffset] === 0x50 &&
        buffer[peOffset + 1] === 0x45 &&
        buffer[peOffset + 2] === 0x00 &&
        buffer[peOffset + 3] === 0x00
      ) {
        return { clean: false, threat: "Executable.Win32.PE", engine: "signature" };
      }
    }
  }

  return { clean: true, engine: "signature" };
};

/**
 * Layer 2: ClamAV daemon TCP INSTREAM protocol scanner.
 * Enabled when CLAMAV_HOST is configured in environment variables.
 */
const scanWithClamAvTcp = (buffer: Buffer, host: string, port: number): Promise<MalwareScanVerdict> => {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let responseData = "";

    socket.setTimeout(15000);

    socket.connect(port, host, () => {
      // Send zINSTREAM\0 command
      socket.write(Buffer.from("zINSTREAM\0", "ascii"));

      // Stream buffer in 8KB chunks prefixed by 4-byte big-endian length
      const chunkSize = 8192;
      for (let offset = 0; offset < buffer.length; offset += chunkSize) {
        const chunk = buffer.subarray(offset, Math.min(offset + chunkSize, buffer.length));
        const lenBuf = Buffer.alloc(4);
        lenBuf.writeUInt32BE(chunk.length, 0);
        socket.write(lenBuf);
        socket.write(chunk);
      }

      // Terminate stream with 4 zero bytes
      const endBuf = Buffer.alloc(4, 0);
      socket.write(endBuf);
    });

    socket.on("data", (chunk) => {
      responseData += chunk.toString("utf8");
    });

    socket.on("end", () => {
      const trimmed = responseData.replace(/\0/g, "").trim();
      if (trimmed.endsWith("OK")) {
        resolve({ clean: true, engine: "clamav" });
      } else if (trimmed.includes("FOUND")) {
        const match = trimmed.match(/stream:\s*(.+?)\s*FOUND/i);
        resolve({
          clean: false,
          threat: match?.[1] ?? "ClamAV.Malware.Found",
          engine: "clamav",
        });
      } else {
        reject(new Error(`Unexpected ClamAV response: ${trimmed}`));
      }
    });

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("ClamAV scan socket timed out"));
    });

    socket.on("error", (err) => {
      reject(err);
    });
  });
};

/**
 * Reads an uploaded object's bytes for malware inspection.
 */
const readObjectBufferForScan = async (key: string, bucket: string): Promise<Buffer | null> => {
  if (!isOciConfigured()) {
    const localPath = getLocalFilePath(bucket, key);
    if (!fs.existsSync(localPath)) return null;
    return fs.readFileSync(localPath);
  }

  try {
    const client = getClient();
    const res = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        Range: "bytes=0-1048575", // First 1MB for fast scanning
      })
    );
    if (!res.Body) return null;
    const byteArray = await res.Body.transformToByteArray();
    return Buffer.from(byteArray);
  } catch (err) {
    logger.warn("OCI: Could not read object bytes for malware scan", {
      key,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
};

/**
 * Multi-layer malware scan executed after object upload and before database metadata commit.
 * Automatically purges the object and throws FileUploadError if a threat is detected.
 */
export const scanForMalware = async (key: string, bucket?: string): Promise<void> => {
  const b = bucket ?? getOciConfig().bucket;
  const buffer = await readObjectBufferForScan(key, b);

  if (buffer) {
    // 1. Built-in signature & executable header inspection
    const sigVerdict = inspectBufferForMalware(buffer);
    if (!sigVerdict.clean) {
      logger.error("Security Alert: Malware/Executable signature detected in upload — purging object", {
        key,
        bucket: b,
        threat: sigVerdict.threat,
        engine: sigVerdict.engine,
      });
      await deleteObject(key, b).catch(() => {});
      throw new FileUploadError(`Upload rejected by security scanner (${sigVerdict.threat})`);
    }

    // 2. ClamAV TCP Daemon (if configured via CLAMAV_HOST)
    const clamHost = (process.env.CLAMAV_HOST ?? "").trim();
    const clamPort = parseInt(process.env.CLAMAV_PORT ?? "3310", 10);
    if (clamHost) {
      try {
        const clamVerdict = await scanWithClamAvTcp(buffer, clamHost, clamPort);
        if (!clamVerdict.clean) {
          logger.error("Security Alert: ClamAV detected malware in upload — purging object", {
            key,
            bucket: b,
            threat: clamVerdict.threat,
          });
          await deleteObject(key, b).catch(() => {});
          throw new FileUploadError(`Upload rejected by antivirus scanner (${clamVerdict.threat})`);
        }
      } catch (err) {
        if (err instanceof FileUploadError) throw err;
        logger.warn("ClamAV daemon unreachable; signature inspection passed", {
          key,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  // 3. External Cloud Malware Webhook (if configured via MALWARE_SCAN_WEBHOOK_URL)
  const webhookUrl = (process.env.MALWARE_SCAN_WEBHOOK_URL ?? "").trim();
  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.MALWARE_SCAN_API_KEY
            ? { Authorization: `Bearer ${process.env.MALWARE_SCAN_API_KEY}` }
            : {}),
        },
        body: JSON.stringify({ key, bucket: b }),
      });

      if (response.ok) {
        const data = (await response.json()) as { clean?: boolean; threat?: string };
        if (data.clean === false) {
          await deleteObject(key, b).catch(() => {});
          throw new FileUploadError(
            `Upload rejected by cloud malware scanner (${data.threat ?? "Malicious content"})`
          );
        }
      }
    } catch (err) {
      if (err instanceof FileUploadError) throw err;
      logger.warn("External malware webhook scan failed; continuing with signature check", {
        key,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  logger.debug("OCI: malware scan passed", { key, bucket: b });
};
