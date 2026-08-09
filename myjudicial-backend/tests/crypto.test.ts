import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { encryptBuffer, decryptBuffer } from "../src/shared/utils/crypto.js";

describe("AES-256-GCM crypto helpers", () => {
  it("round-trips plaintext", () => {
    const plaintext = Buffer.from("sensitive legal document contents");
    const { ciphertext, keyBase64, ivBase64 } = encryptBuffer(plaintext);
    const decrypted = decryptBuffer(ciphertext, keyBase64, ivBase64);
    assert.equal(decrypted.toString(), plaintext.toString());
  });

  it("ciphertext differs from plaintext", () => {
    const plaintext = Buffer.from("hello");
    const { ciphertext } = encryptBuffer(plaintext);
    assert.notEqual(ciphertext.toString("base64"), plaintext.toString("base64"));
  });

  it("produces unique ciphertext for identical input (random IV)", () => {
    const plaintext = Buffer.from("same input");
    const a = encryptBuffer(plaintext);
    const b = encryptBuffer(plaintext);
    assert.notEqual(a.ciphertext.toString("base64"), b.ciphertext.toString("base64"));
    assert.notEqual(a.keyBase64, b.keyBase64);
  });

  it("sets correct algorithm and key/iv lengths", () => {
    const { ciphertext, keyBase64, ivBase64, algorithm } = encryptBuffer(Buffer.from("data"));
    assert.equal(algorithm, "aes-256-gcm");
    assert.equal(Buffer.from(keyBase64, "base64").length, 32);
    assert.equal(Buffer.from(ivBase64, "base64").length, 12);
    // auth tag appended (16 bytes)
    assert.equal(ciphertext.length, Buffer.from("data").length + 16);
  });

  it("round-trips binary data", () => {
    const plaintext = Buffer.from([0x00, 0x01, 0xff, 0xfe, 0x80]);
    const { ciphertext, keyBase64, ivBase64 } = encryptBuffer(plaintext);
    assert.deepEqual(decryptBuffer(ciphertext, keyBase64, ivBase64), plaintext);
  });

  it("handles empty input", () => {
    const { ciphertext, keyBase64, ivBase64 } = encryptBuffer(Buffer.alloc(0));
    assert.equal(decryptBuffer(ciphertext, keyBase64, ivBase64).length, 0);
  });

  it("throws on tampered ciphertext", () => {
    const { ciphertext, keyBase64, ivBase64 } = encryptBuffer(Buffer.from("authentic data"));
    const tampered = Buffer.from(ciphertext);
    tampered[0] ^= 0xff; // flip a bit
    assert.throws(() => decryptBuffer(tampered, keyBase64, ivBase64));
  });
});
