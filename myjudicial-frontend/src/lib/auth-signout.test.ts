import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAuthLocale,
  isCurrentContextAdmin,
  getSignOutRedirectUrl,
  handleAppSignOut,
  resetSignOutLock,
} from "./auth-signout";
import { signOut } from "next-auth/react";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

vi.mock("@/api/generated", () => ({
  postAuthLogout: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/api/client", () => ({
  setCachedAuthToken: vi.fn(),
}));

describe("auth-signout utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSignOutLock();
  });

  describe("getAuthLocale", () => {
    it("returns explicit valid locale", () => {
      expect(getAuthLocale("fr")).toBe("fr");
      expect(getAuthLocale("rw")).toBe("rw");
      expect(getAuthLocale("en")).toBe("en");
    });

    it("falls back to 'en' when unknown locale is given", () => {
      expect(getAuthLocale("es")).toBe("en");
      expect(getAuthLocale(null)).toBe("en");
    });
  });

  describe("isCurrentContextAdmin", () => {
    it("returns true when role is ADMIN", () => {
      expect(isCurrentContextAdmin({ role: "ADMIN" })).toBe(true);
    });

    it("returns true when pathname includes /admin", () => {
      expect(isCurrentContextAdmin({ pathname: "/en/admin/dashboard" })).toBe(true);
      expect(isCurrentContextAdmin({ pathname: "/admin/settings" })).toBe(true);
    });

    it("returns false for non-admin roles on consumer routes", () => {
      expect(isCurrentContextAdmin({ role: "CITIZEN", pathname: "/client/dashboard" })).toBe(false);
      expect(isCurrentContextAdmin({ role: "EXPERT", pathname: "/expert/dashboard" })).toBe(false);
    });
  });

  describe("getSignOutRedirectUrl", () => {
    it("directs admin on admin dashboard to admin sign-in with admin=1 parameter", () => {
      const url = getSignOutRedirectUrl({
        role: "ADMIN",
        pathname: "/en/admin/dashboard",
        locale: "en",
      });
      expect(url).toBe("/en/sign-in?admin=1");
    });

    it("preserves French locale for admin sign-in", () => {
      const url = getSignOutRedirectUrl({
        role: "ADMIN",
        pathname: "/fr/admin/dashboard",
        locale: "fr",
      });
      expect(url).toBe("/fr/sign-in?admin=1");
    });

    it("directs client users to standard sign-in page", () => {
      const url = getSignOutRedirectUrl({
        role: "CITIZEN",
        pathname: "/en/client/dashboard",
        locale: "en",
      });
      expect(url).toBe("/en/sign-in");
    });

    it("directs expert users to standard sign-in page", () => {
      const url = getSignOutRedirectUrl({
        role: "EXPERT",
        pathname: "/rw/expert/dashboard",
        locale: "rw",
      });
      expect(url).toBe("/rw/sign-in");
    });
  });

  describe("handleAppSignOut", () => {
    it("invokes NextAuth signOut with admin sign-in callbackUrl for admin", async () => {
      await handleAppSignOut({
        role: "ADMIN",
        pathname: "/en/admin/dashboard",
        locale: "en",
      });

      expect(signOut).toHaveBeenCalledWith({
        callbackUrl: "/en/sign-in?admin=1",
      });
    });

    it("invokes NextAuth signOut with normal sign-in callbackUrl for client", async () => {
      await handleAppSignOut({
        role: "CITIZEN",
        pathname: "/en/client/dashboard",
        locale: "en",
      });

      expect(signOut).toHaveBeenCalledWith({
        callbackUrl: "/en/sign-in",
      });
    });
  });
});
