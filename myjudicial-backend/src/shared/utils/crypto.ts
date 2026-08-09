/**
 * AES-256-GCM symmetric encryption helpers for server-side document encryption.
 *
 * Used exclusively by the expert verification upload flow so that admin
 * reviewers can decrypt and preview documents server-side without exposing
 * raw bytes or requiring client-side decryption.
 *
 * Key format: 32-byte random key stored as base64 in the Document.encryptedAesKey column.
 * IV format:  12-byte random IV stored as base64 in the Document.iv column.
 * Auth tag:   16 bytes, appended to the ciphertext buffer.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;   // 96-bit nonce — recommended for GCM
const TAG_LENGTH = 16;  // 128-bit authentication tag

export type EncryptResult = {
  ciphertext:      Buffer; // encrypted bytes (includes auth tag appended at the end)
  keyBase64:       string; // base64-encoded 256-bit AES key (32 bytes)
  ivBase64:        string; // base64-encoded 96-bit IV (12 bytes)
  algorithm:       "aes-256-gcm";
};

/**
 * Encrypt a plaintext Buffer with a freshly generated AES-256-GCM key and IV.
 *
 * The 16-byte auth tag is appended at the end of the ciphertext so the
 * complete encrypted payload is self-contained in a single Buffer.
 */
export function encryptBuffer(plaintext: Buffer): EncryptResult {
  const key = randomBytes(32);
  const iv  = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: Buffer.concat([encrypted, tag]),
    keyBase64:  key.toString("base64"),
    ivBase64:   iv.toString("base64"),
    algorithm:  ALGORITHM,
  };
}

/**
 * Decrypt a ciphertext Buffer produced by `encryptBuffer`.
 *
 * @param ciphertext  Raw encrypted bytes with the 16-byte auth tag appended.
 * @param keyBase64   base64-encoded AES key (from EncryptResult.keyBase64).
 * @param ivBase64    base64-encoded IV (from EncryptResult.ivBase64).
 */
export function decryptBuffer(
  ciphertext: Buffer,
  keyBase64:  string,
  ivBase64:   string
): Buffer {
  const key = Buffer.from(keyBase64, "base64");
  const iv  = Buffer.from(ivBase64, "base64");

  // Split out the auth tag from the end of the payload
  const tag       = ciphertext.slice(ciphertext.length - TAG_LENGTH);
  const encrypted = ciphertext.slice(0, ciphertext.length - TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
