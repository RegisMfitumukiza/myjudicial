import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { IntlProvider } from "@/i18n/intl-provider";
import enMessages from "../../../messages/en.json";
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
  usePathname: () => "/admin/dashboard/content",
  Link: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Mock settings api
vi.mock("@/features/settings/api", () => ({
  fetchAdminSettings: vi.fn().mockResolvedValue({
    supplementalFaqs: [
      { id: "faq_1", question: "How does escrow work?", answer: "Funds held securely.", category: "billing" },
      { id: "faq_2", question: "Who can register?", answer: "Any citizen or resident.", category: "general" },
    ],
    legalEffectiveDate: "2026-09-28",
    dpoContactEmail: "dpo@myjudicial.com",
    legalDisclaimer: "Independent platform disclaimer.",
  }),
  saveSettingsSection: vi.fn().mockResolvedValue({}),
}));

// Mock ContentEditor & CareersHub to isolate tab switching
vi.mock("./content-editor", () => ({
  ContentEditor: () => <div data-testid="mock-content-editor">Content Editor Component</div>,
}));

vi.mock("@/features/admin-careers/careers-hub", () => ({
  CareersHub: () => <div data-testid="mock-careers-hub">Careers Hub Component</div>,
}));

import { ContentHubClient } from "./content-hub-client";

function renderHub() {
  return render(
    <IntlProvider locale="en" messages={enMessages as any}>
      <ContentHubClient />
    </IntlProvider>
  );
}

describe("ContentHubClient Tab & Sub-tab Persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("tab");
    mockSearchParams.delete("faqCategory");
    try {
      localStorage.clear();
    } catch {}
  });

  it("defaults to Content Pages when no query param or localStorage is present", async () => {
    renderHub();
    expect(await screen.findByTestId("mock-content-editor")).toBeInTheDocument();
  });

  it("loads the Public FAQs tab when query parameter ?tab=faqs is present", async () => {
    mockSearchParams.set("tab", "faqs");
    renderHub();
    expect(await screen.findByText("Supplemental FAQs")).toBeInTheDocument();
  });

  it("loads the Careers Hub tab when query parameter ?tab=careers is present", async () => {
    mockSearchParams.set("tab", "careers");
    renderHub();
    expect(await screen.findByTestId("mock-careers-hub")).toBeInTheDocument();
  });

  it("loads the Statutory Governance tab when query parameter ?tab=governance is present", async () => {
    mockSearchParams.set("tab", "governance");
    renderHub();
    expect(await screen.findByText("Statutory Regulatory Headers & Disclaimers")).toBeInTheDocument();
  });

  it("restores the last active tab from localStorage if URL has no query param", async () => {
    localStorage.setItem("myjudicial_admin_content_tab", "governance");
    renderHub();
    expect(await screen.findByText("Statutory Regulatory Headers & Disclaimers")).toBeInTheDocument();
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.stringContaining("tab=governance"),
      expect.any(Object)
    );
  });

  it("updates URL and localStorage when switching top-level tabs", async () => {
    renderHub();
    await screen.findByTestId("mock-content-editor");

    const faqsTab = screen.getByRole("tab", { name: /Public FAQs/i });
    fireEvent.keyDown(faqsTab, { key: "Enter" });

    expect(localStorage.getItem("myjudicial_admin_content_tab")).toBe("faqs");
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.stringContaining("tab=faqs"),
      expect.any(Object)
    );
  });

  it("persists FAQ filter category pill changes to URL and localStorage", async () => {
    mockSearchParams.set("tab", "faqs");
    renderHub();

    const billingFilter = await screen.findByRole("button", { name: "Payments & Escrow" });
    fireEvent.click(billingFilter);

    expect(localStorage.getItem("myjudicial_admin_content_faq_category")).toBe("billing");
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.stringContaining("faqCategory=billing"),
      expect.any(Object)
    );
  });
});
