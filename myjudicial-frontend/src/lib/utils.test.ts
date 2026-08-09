import { describe, it, expect } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy classes with spaces", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("ignores falsy values", () => {
    expect(cn("a", false, undefined, null, 0, "b")).toBe("a b");
  });

  it("handles clsx object syntax", () => {
    expect(cn({ a: true, b: false })).toBe("a");
  });

  it("merges conflicting tailwind classes (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("keeps distinct classes from both inputs", () => {
    expect(cn("bg-red-500", "px-4")).toBe("bg-red-500 px-4");
  });

  it("returns empty string for no args", () => {
    expect(cn()).toBe("");
  });
});
