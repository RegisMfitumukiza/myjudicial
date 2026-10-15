import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  listAuditLogsQuerySchema,
  exportAuditLogsQuerySchema,
} from "../src/modules/audit/admin-audit.schemas.js";

describe("admin audit schemas", () => {
  it("parses empty query params with default values", () => {
    const parsed = listAuditLogsQuerySchema.parse({});
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 20);
    assert.equal(parsed.sortBy, "createdAt");
    assert.equal(parsed.sortOrder, "desc");
  });

  it("handles action='' and action='ALL' gracefully", () => {
    const resEmpty = listAuditLogsQuerySchema.safeParse({ action: "" });
    assert.equal(resEmpty.success, true);
    assert.equal((resEmpty as any).data.action, undefined);

    const resAll = listAuditLogsQuerySchema.safeParse({ action: "ALL" });
    assert.equal(resAll.success, true);
    assert.equal((resAll as any).data.action, undefined);
  });

  it("handles resource='' and resource='ALL' gracefully", () => {
    const resEmpty = listAuditLogsQuerySchema.safeParse({ resource: "" });
    assert.equal(resEmpty.success, true);
    assert.equal((resEmpty as any).data.resource, undefined);

    const resAll = listAuditLogsQuerySchema.safeParse({ resource: "ALL" });
    assert.equal(resAll.success, true);
    assert.equal((resAll as any).data.resource, undefined);
  });

  it("handles case-insensitive action and resource values", () => {
    const resAction = listAuditLogsQuerySchema.safeParse({ action: "login" });
    assert.equal(resAction.success, true);
    assert.equal((resAction as any).data.action, "LOGIN");

    const resResource = listAuditLogsQuerySchema.safeParse({ resource: "user" });
    assert.equal(resResource.success, true);
    assert.equal((resResource as any).data.resource, "USER");
  });

  it("handles empty date strings fromDate='' and toDate=''", () => {
    const res = listAuditLogsQuerySchema.safeParse({ fromDate: "", toDate: "" });
    assert.equal(res.success, true);
    assert.equal((res as any).data.fromDate, undefined);
    assert.equal((res as any).data.toDate, undefined);
  });

  it("handles export query schema with search and date filters", () => {
    const res = exportAuditLogsQuerySchema.safeParse({
      action: "ALL",
      resource: "ALL",
      fromDate: "",
      toDate: "",
      search: "127.0.0.1",
      format: "csv",
    });
    assert.equal(res.success, true);
    assert.equal((res as any).data.action, undefined);
    assert.equal((res as any).data.resource, undefined);
    assert.equal((res as any).data.search, "127.0.0.1");
    assert.equal((res as any).data.format, "csv");
  });

  it("clamps limit up to 1000", () => {
    const res = listAuditLogsQuerySchema.safeParse({ limit: "1000" });
    assert.equal(res.success, true);
    assert.equal((res as any).data.limit, 1000);
  });
});
