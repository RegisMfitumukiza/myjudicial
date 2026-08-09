import { describe, it, expect, vi } from "vitest";

vi.mock("next-intl/navigation", () => ({
  createNavigation: () => ({
    Link: "a",
    redirect: () => {},
    usePathname: () => "/en",
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }),
  }),
}));

import { routing } from "@/i18n/routing";

describe("i18n routing config", () => {
  it("supports en, fr, and rw locales", () => {
    expect(routing.locales).toEqual(["en", "fr", "rw"]);
  });

  it("defaults to english", () => {
    expect(routing.defaultLocale).toBe("en");
  });

  it("always includes the locale prefix in URLs", () => {
    expect(routing.localePrefix).toBe("always");
  });

  it("default locale is a supported locale", () => {
    expect(routing.locales).toContain(routing.defaultLocale);
  });

  it("locales are non-empty strings", () => {
    for (const locale of routing.locales) {
      expect(typeof locale).toBe("string");
      expect(locale.length).toBeGreaterThan(0);
    }
  });
});
