/**
 * OCI Vault KMS — Infrastructure Client
 *
 * Implements the Defense-in-Depth Double Wrapping strategy.
 *
 * The client encrypts a file with a Data Encryption Key (DEK), and encrypts
 * the DEK with the user's password (producing clientEncryptedAesKey).
 *
 * Before storing it in the database, the backend uses this service to
 * wrap the clientEncryptedAesKey with an OCI Vault Master Key.
 *
 * This provides True Zero-Knowledge End-to-End Encryption while allowing
 * the organization to revoke the Master Key (crypto-shredding all files)
 * in the event of a catastrophic data breach.
 */

import {
  KMSClient,
  EncryptCommand,
  DecryptCommand,
} from "@aws-sdk/client-kms";
import { logger } from "../../shared/utils/logger.js";
import { StorageProviderError } from "../../shared/errors/index.js";

// ─── Config ──────────────────────────────────────────────────────────────────

const getKmsConfig = () => ({
  // OCI KMS provides AWS KMS compatible endpoints.
  endpoint:    process.env.OCI_KMS_ENDPOINT ?? "",
  region:      process.env.OCI_REGION ?? "us-ashburn-1",
  accessKeyId: process.env.OCI_ACCESS_KEY_ID ?? "",
  secretKey:   process.env.OCI_SECRET_ACCESS_KEY ?? "",
  masterKeyId: process.env.OCI_KMS_MASTER_KEY_ID ?? "",
});

// ─── Singleton KMS Client ─────────────────────────────────────────────────────

let _client: KMSClient | null = null;

const getClient = (): KMSClient => {
  if (_client) return _client;

  const cfg = getKmsConfig();

  _client = new KMSClient({
    region: cfg.region,
    endpoint: cfg.endpoint || undefined,
    credentials: {
      accessKeyId:     cfg.accessKeyId,
      secretAccessKey: cfg.secretKey,
    },
  });

  return _client;
};

export const getMasterKeyId = (): string => {
  return getKmsConfig().masterKeyId;
};

// ─── Wrap Key (Encrypt) ───────────────────────────────────────────────────────

/**
 * Encrypts the client's base64-encoded encryptedAesKey using the OCI Master Key.
 * Returns the double-wrapped key as a base64 string.
 */
export const wrapKey = async (base64PlaintextKey: string): Promise<string> => {
  const cfg = getKmsConfig();

  // If KMS is not configured, fallback to passthrough (for local dev without Vault)
  if (!cfg.endpoint || !cfg.masterKeyId) {
    logger.debug("OCI KMS: Not configured. Skipping key wrapping.");
    return base64PlaintextKey;
  }

  try {
    const client = getClient();
    
    // AWS SDK KMS expects plaintext as a Uint8Array
    const plaintextBuffer = Buffer.from(base64PlaintextKey, "base64");
    
    const command = new EncryptCommand({
      KeyId:     cfg.masterKeyId,
      Plaintext: plaintextBuffer,
    });

    const response = await client.send(command);
    
    if (!response.CiphertextBlob) {
      throw new Error("No CiphertextBlob returned from KMS");
    }

    // Return the double-wrapped key as base64 for storage in Postgres
    return Buffer.from(response.CiphertextBlob).toString("base64");
  } catch (error) {
    logger.error("OCI KMS: wrapKey failed", {
      keyId: cfg.masterKeyId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new StorageProviderError("Failed to securely wrap encryption key");
  }
};

// ─── Unwrap Key (Decrypt) ─────────────────────────────────────────────────────

/**
 * Decrypts a double-wrapped base64 key back to the client's original base64 key.
 */
export const unwrapKey = async (base64WrappedKey: string): Promise<string> => {
  const cfg = getKmsConfig();

  if (!cfg.endpoint || !cfg.masterKeyId) {
    logger.debug("OCI KMS: Not configured. Skipping key unwrapping.");
    return base64WrappedKey;
  }

  try {
    const client = getClient();
    
    const ciphertextBuffer = Buffer.from(base64WrappedKey, "base64");
    
    const command = new DecryptCommand({
      CiphertextBlob: ciphertextBuffer,
    });

    const response = await client.send(command);

    if (!response.Plaintext) {
      throw new Error("No Plaintext returned from KMS");
    }

    // The unwrapped plaintext is the client's base64 encryptedAesKey
    return Buffer.from(response.Plaintext).toString("base64");
  } catch (error) {
    logger.error("OCI KMS: unwrapKey failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    // Do not leak KMS errors to the client
    throw new StorageProviderError("Failed to unwrap encryption key. The master key may have been revoked.");
  }
};
