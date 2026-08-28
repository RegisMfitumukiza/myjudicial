import { test } from "node:test";
import assert from "node:assert/strict";
import {
  adminListDocumentsQuerySchema,
  listFilesQuerySchema,
} from "../src/modules/file-storage/schemas/file-storage.schemas.js";

test("adminListDocumentsQuerySchema applies defaults", () => {
  const parsed = adminListDocumentsQuerySchema.parse({});
  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 20);
  assert.equal(parsed.sortBy, "createdAt");
  assert.equal(parsed.order, "desc");
  assert.equal(parsed.role, undefined);
});

test("adminListDocumentsQuerySchema coerces string numbers", () => {
  const parsed = adminListDocumentsQuerySchema.parse({ page: "3", limit: "50" });
  assert.equal(parsed.page, 3);
  assert.equal(parsed.limit, 50);
});

test("adminListDocumentsQuerySchema accepts valid filters", () => {
  const parsed = adminListDocumentsQuerySchema.parse({
    page: 2,
    limit: 25,
    role: "EXPERT",
    ownerType: "EXPERT",
    sensitivity: "CONFIDENTIAL",
    search: "  passport  ",
    sortBy: "fileName",
    order: "asc",
  });
  assert.equal(parsed.role, "EXPERT");
  assert.equal(parsed.search, "passport"); // trimmed
  assert.equal(parsed.sortBy, "fileName");
  assert.equal(parsed.order, "asc");
});

test("adminListDocumentsQuerySchema rejects unknown roles", () => {
  const result = adminListDocumentsQuerySchema.safeParse({ role: "CASE" });
  assert.equal(result.success, false);
});

test("adminListDocumentsQuerySchema caps limit at 100", () => {
  const result = adminListDocumentsQuerySchema.safeParse({ limit: 500 });
  assert.equal(result.success, false);
});

test("listFilesQuerySchema still applies defaults for booking documents", () => {
  const parsed = listFilesQuerySchema.parse({ page: "1", limit: "50" });
  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 50);
});