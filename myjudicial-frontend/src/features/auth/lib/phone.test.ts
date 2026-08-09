import { describe, it, expect } from "vitest";

import {
  digitsOnly,
  formatRwandaPhone,
  isRwandaMobileNumber,
} from "@/features/auth/lib/phone";

describe("digitsOnly", () => {
  it("strips non-digit characters", () => {
    expect(digitsOnly("+250 788 123 456")).toBe("250788123456");
    expect(digitsOnly("abc123!@#")).toBe("123");
  });

  it("returns empty for no digits", () => {
    expect(digitsOnly("no numbers here")).toBe("");
  });
});

describe("formatRwandaPhone", () => {
  it("converts local 07x format to +250", () => {
    expect(formatRwandaPhone("0788123456")).toBe("+250788123456");
  });

  it("passes through international format unchanged", () => {
    expect(formatRwandaPhone("+250788123456")).toBe("+250788123456");
  });

  it("adds prefix to bare national number", () => {
    expect(formatRwandaPhone("788123456")).toBe("+250788123456");
  });

  it("handles already-prefixed digits", () => {
    expect(formatRwandaPhone("250788123456")).toBe("+250788123456");
  });

  it("handles punctuation and spaces", () => {
    expect(formatRwandaPhone("078 8123 456")).toBe("+250788123456");
  });
});

describe("isRwandaMobileNumber", () => {
  it("accepts local 07x format", () => {
    expect(isRwandaMobileNumber("0788123456")).toBe(true);
  });

  it("accepts international +250 format", () => {
    expect(isRwandaMobileNumber("+250788123456")).toBe(true);
  });

  it("accepts bare 7x national format", () => {
    expect(isRwandaMobileNumber("788123456")).toBe(true);
  });

  it("rejects numbers with too few digits", () => {
    expect(isRwandaMobileNumber("078812345")).toBe(false);
  });

  it("rejects non-7x prefixes", () => {
    expect(isRwandaMobileNumber("123456789")).toBe(false);
    expect(isRwandaMobileNumber("+250698123456")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isRwandaMobileNumber("")).toBe(false);
  });
});
