import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { parsePagination, buildPaginationMeta } from "../src/shared/utils/pagination.js";

describe("parsePagination", () => {
  it("uses defaults for empty input", () => {
    assert.deepEqual(parsePagination(undefined, undefined), { page: 1, limit: 10, skip: 0 });
  });

  it("parses valid page/limit", () => {
    assert.deepEqual(parsePagination("3", "20"), { page: 3, limit: 20, skip: 40 });
  });

  it("clamps page to minimum 1", () => {
    assert.deepEqual(parsePagination("0", "10"), { page: 1, limit: 10, skip: 0 });
    assert.deepEqual(parsePagination("-5", "10"), { page: 1, limit: 10, skip: 0 });
  });

  it("clamps limit to 1-50", () => {
    assert.deepEqual(parsePagination("1", "1"), { page: 1, limit: 1, skip: 0 });
    assert.deepEqual(parsePagination("1", "100"), { page: 1, limit: 50, skip: 0 });
  });

  it("treats 0 limit as falsy and falls back to default", () => {
    assert.deepEqual(parsePagination("1", "0"), { page: 1, limit: 10, skip: 0 });
  });

  it("falls back on non-numeric input", () => {
    assert.deepEqual(parsePagination("abc", "xyz"), { page: 1, limit: 10, skip: 0 });
  });
});

describe("buildPaginationMeta", () => {
  it("builds metadata for multiple pages", () => {
    const meta = buildPaginationMeta(95, { page: 3, limit: 10, skip: 20 });
    assert.equal(meta.total, 95);
    assert.equal(meta.totalPages, 10);
    assert.equal(meta.hasNext, true);
    assert.equal(meta.hasPrev, true);
  });

  it("no next on last page", () => {
    const meta = buildPaginationMeta(20, { page: 2, limit: 10, skip: 10 });
    assert.equal(meta.totalPages, 2);
    assert.equal(meta.hasNext, false);
    assert.equal(meta.hasPrev, true);
  });

  it("no prev on first page", () => {
    const meta = buildPaginationMeta(20, { page: 1, limit: 10, skip: 0 });
    assert.equal(meta.totalPages, 2);
    assert.equal(meta.hasPrev, false);
  });

  it("handles zero results", () => {
    const meta = buildPaginationMeta(0, { page: 1, limit: 10, skip: 0 });
    assert.equal(meta.totalPages, 0);
    assert.equal(meta.hasNext, false);
    assert.equal(meta.hasPrev, false);
  });

  it("exact division", () => {
    const meta = buildPaginationMeta(30, { page: 3, limit: 10, skip: 20 });
    assert.equal(meta.totalPages, 3);
    assert.equal(meta.hasNext, false);
  });
});
