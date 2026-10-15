import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  listPaymentsQuerySchema,
  listEscrowQuerySchema,
  financeStatsQuerySchema,
} from "../src/modules/payments/admin-finance.schemas.js";

describe("admin finance schemas", () => {
  it("parses empty query params with default values", () => {
    const parsed = listPaymentsQuerySchema.parse({});
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 20);
    assert.equal(parsed.sortBy, "createdAt");
    assert.equal(parsed.sortOrder, "desc");
  });

  it("parses page=1 and limit=20 query strings", () => {
    const parsed = listPaymentsQuerySchema.parse({ page: "1", limit: "20" });
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 20);
  });

  it("handles status='' and status='ALL' gracefully", () => {
    const resEmpty = listPaymentsQuerySchema.safeParse({ status: "" });
    assert.equal(resEmpty.success, true, "Empty status should not fail");
    assert.equal((resEmpty as any).data.status, undefined);

    const resAll = listPaymentsQuerySchema.safeParse({ status: "ALL" });
    assert.equal(resAll.success, true, "status=ALL should not fail");
    assert.equal((resAll as any).data.status, undefined);
  });

  it("handles status='AUTHORIZED' mapping gracefully", () => {
    const resAuth = listPaymentsQuerySchema.safeParse({ status: "AUTHORIZED" });
    assert.equal(resAuth.success, true, "status=AUTHORIZED should succeed");
  });

  it("handles empty date strings fromDate='' and toDate=''", () => {
    const res = listPaymentsQuerySchema.safeParse({ fromDate: "", toDate: "" });
    assert.equal(res.success, true, "Empty dates should not fail");
    assert.equal((res as any).data.fromDate, undefined);
    assert.equal((res as any).data.toDate, undefined);
  });

  it("handles CSV export limit=1000", () => {
    const res = listPaymentsQuerySchema.safeParse({ limit: "1000" });
    assert.equal(res.success, true, "limit=1000 should be allowed");
    assert.equal((res as any).data.limit, 1000);
  });

  it("handles empty search and invalid sortBy/sortOrder fallback", () => {
    const res = listPaymentsQuerySchema.safeParse({ search: "   ", sortBy: "", sortOrder: "" });
    assert.equal(res.success, true);
    assert.equal((res as any).data.search, undefined);
    assert.equal((res as any).data.sortBy, "createdAt");
    assert.equal((res as any).data.sortOrder, "desc");
  });

  it("handles escrow schema with status='ALL' and empty search", () => {
    const res = listEscrowQuerySchema.safeParse({ status: "ALL", search: "", limit: "1000" });
    assert.equal(res.success, true);
    assert.equal((res as any).data.status, undefined);
    assert.equal((res as any).data.limit, 1000);
  });

  it("handles financeStatsQuerySchema with empty dates", () => {
    const res = financeStatsQuerySchema.safeParse({ fromDate: "", toDate: "" });
    assert.equal(res.success, true);
    assert.equal((res as any).data.fromDate, undefined);
    assert.equal((res as any).data.toDate, undefined);
  });
});
