import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useSessionExpiry,
  isAuthRoute,
  SESSION_EXPIRED_TOAST_ID,
  resetSessionExpiryState,
} from "./use-session-expiry";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { handleAppSignOut } from "@/lib/auth-signout";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/lib/auth-signout", () => ({
  getAuthLocale: vi.fn().mockReturnValue("en"),
  getSignOutRedirectUrl: vi.fn().mockReturnValue("/en/sign-in"),
  handleAppSignOut: vi.fn().mockResolvedValue(undefined),
}));

describe("useSessionExpiry hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSessionExpiryState();
  });

  describe("isAuthRoute helper", () => {
    it("correctly identifies authentication routes", () => {
      expect(isAuthRoute("/en/sign-in")).toBe(true);
      expect(isAuthRoute("/fr/sign-up")).toBe(true);
      expect(isAuthRoute("/rw/forgot-password")).toBe(true);
      expect(isAuthRoute("/reset-password")).toBe(true);
      expect(isAuthRoute("/en/post-auth")).toBe(true);
    });

    it("correctly returns false for dashboard and public routes", () => {
      expect(isAuthRoute("/en/client/dashboard")).toBe(false);
      expect(isAuthRoute("/fr/expert/dashboard")).toBe(false);
      expect(isAuthRoute("/en/admin/dashboard")).toBe(false);
      expect(isAuthRoute("/en/lawyers")).toBe(false);
      expect(isAuthRoute("/")).toBe(false);
      expect(isAuthRoute(null)).toBe(false);
      expect(isAuthRoute(undefined)).toBe(false);
    });
  });

  describe("session expiry notifications", () => {
    it("notifies once with fixed toast ID and initiates signout on protected routes", () => {
      vi.mocked(usePathname).mockReturnValue("/en/client/dashboard");
      vi.mocked(useSession).mockReturnValue({
        data: {
          error: "RefreshAccessTokenError",
          user: { role: "CITIZEN" },
        } as any,
        status: "authenticated",
        update: vi.fn(),
      });

      renderHook(() => useSessionExpiry());

      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith(
        "Your session has expired. Please sign in again.",
        expect.objectContaining({
          id: SESSION_EXPIRED_TOAST_ID,
        })
      );
      expect(handleAppSignOut).toHaveBeenCalledTimes(1);
    });

    it("does NOT fire multiple toasts when the hook re-renders or session reference updates", () => {
      vi.mocked(usePathname).mockReturnValue("/en/client/dashboard");
      vi.mocked(useSession).mockReturnValue({
        data: {
          error: "RefreshAccessTokenError",
          user: { role: "CITIZEN" },
        } as any,
        status: "authenticated",
        update: vi.fn(),
      });

      const { rerender } = renderHook(() => useSessionExpiry());

      // Simulate multiple fast re-renders (e.g. state change or window refocus)
      rerender();
      rerender();
      rerender();

      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(handleAppSignOut).toHaveBeenCalledTimes(1);
    });

    it("does NOT notify or trigger sign-out when the user is already on an auth page", () => {
      vi.mocked(usePathname).mockReturnValue("/en/sign-in");
      vi.mocked(useSession).mockReturnValue({
        data: {
          error: "RefreshAccessTokenError",
          user: { role: "CITIZEN" },
        } as any,
        status: "authenticated",
        update: vi.fn(),
      });

      renderHook(() => useSessionExpiry());

      expect(toast.error).not.toHaveBeenCalled();
      expect(handleAppSignOut).not.toHaveBeenCalled();
    });

    it("does nothing when session is active without refresh error", () => {
      vi.mocked(usePathname).mockReturnValue("/en/client/dashboard");
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: { role: "CITIZEN", name: "Jean Doe" },
        } as any,
        status: "authenticated",
        update: vi.fn(),
      });

      renderHook(() => useSessionExpiry());

      expect(toast.error).not.toHaveBeenCalled();
      expect(handleAppSignOut).not.toHaveBeenCalled();
    });
  });
});
