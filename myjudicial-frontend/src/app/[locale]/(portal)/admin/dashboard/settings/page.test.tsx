import { render, screen, fireEvent } from "@testing-library/react";
import { IntlProvider } from "@/i18n/intl-provider";
import enMessages from "../../../../../../../messages/en.json";
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

// Mock next/navigation
const mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

// Mock @/i18n/routing
const mockRouter = { replace: vi.fn(), push: vi.fn() };
vi.mock("@/i18n/routing", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/admin/dashboard/settings",
  Link: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Mock settings api
vi.mock("@/features/settings/api", () => ({
  fetchAdminSettings: vi.fn().mockResolvedValue({
    platformName: "MyJudicial",
    platformFeePercent: 15,
    minEscrowDurationSeconds: 300,
    paymentMode: "escrow_upfront",
    brandTagline: "Justice Delivered Efficiently",
    brandCopyrightText: "© 2026 MyJudicial Inc.",
    supportEmail: "support@myjudicial.com",
    seoTitle: "MyJudicial — Trusted Legal Services",
  }),
  saveSettingsSection: vi.fn().mockResolvedValue({}),
}));

import SettingsPage from "./page";

function renderSettings() {
  return render(
    <IntlProvider locale="en" messages={enMessages}>
      <SettingsPage />
    </IntlProvider>
  );
}

describe("Admin Settings Page Tab Persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("tab");
    try {
      localStorage.clear();
    } catch {}
  });

  it("defaults to Operations tab when no query param or localStorage is present", async () => {
    renderSettings();
    expect(await screen.findByText("Platform Operations & Escrow")).toBeInTheDocument();
  });

  it("loads Brand Identity tab when ?tab=brand is in URL", async () => {
    mockSearchParams.set("tab", "brand");
    renderSettings();
    expect(await screen.findByText("Brand Identity & Public Tagline")).toBeInTheDocument();
  });

  it("loads Contact Channels tab when ?tab=contact is in URL", async () => {
    mockSearchParams.set("tab", "contact");
    renderSettings();
    expect(await screen.findByText("Company Contact & Official Channels")).toBeInTheDocument();
  });

  it("loads SEO tab when ?tab=seo is in URL", async () => {
    mockSearchParams.set("tab", "seo");
    renderSettings();
    expect(await screen.findByText("SEO & Open Graph Social Sharing")).toBeInTheDocument();
  });

  it("restores the last active tab from localStorage if URL has no query param", async () => {
    localStorage.setItem("myjudicial_admin_settings_tab", "brand");
    renderSettings();
    expect(await screen.findByText("Brand Identity & Public Tagline")).toBeInTheDocument();
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.stringContaining("tab=brand"),
      expect.any(Object)
    );
  });

  it("updates URL and localStorage when switching settings tabs", async () => {
    renderSettings();
    await screen.findByText("Platform Operations & Escrow");

    const brandTab = screen.getByRole("tab", { name: /Brand Identity/i });
    fireEvent.keyDown(brandTab, { key: "Enter" });

    expect(localStorage.getItem("myjudicial_admin_settings_tab")).toBe("brand");
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.stringContaining("tab=brand"),
      expect.any(Object)
    );
  });
});
