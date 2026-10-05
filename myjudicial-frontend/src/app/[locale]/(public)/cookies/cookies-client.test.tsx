import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { IntlProvider } from "@/i18n/intl-provider";
import enMessages from "../../../../../messages/en.json";

const mockUsePlatformSettings = vi.fn();
vi.mock("@/lib/api/settings", () => ({
  usePlatformSettings: () => mockUsePlatformSettings(),
}));

import LegalPageClient from "@/features/public-content/legal-page-client";

const messages = enMessages as never;
const cookiesData = enMessages.legalPages.cookies;

const defaultSettings = {
  platformName: "MyJudicial",
  supportEmail: "support@myjudicial.com",
  dpoContactEmail: "dpo@myjudicial.com",
  hotlinePhone: "+250 788 312 456",
  officeBuilding: "Centenary House, 4th Floor",
  officeStreet: "KN 3 Ave & KN 4 St",
  officeDistrict: "Nyarugenge",
  officePoBox: "P.O. Box 2848",
  supportWorkingHours: "Monday - Friday: 8:00 AM - 6:00 PM CAT",
  legalEffectiveDate: "October 1, 2026",
};

const renderCookiesPolicy = () =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <LegalPageClient pageKey="cookies" />
    </IntlProvider>
  );

describe("CookiesPolicy — LegalPageClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUsePlatformSettings.mockReturnValue({
      settings: defaultSettings,
      isLoading: false,
    });
  });

  it("renders hero section with badge, title, and legal intro", () => {
    renderCookiesPolicy();

    expect(screen.getByText(cookiesData.hero.badge)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: cookiesData.hero.title })).toBeInTheDocument();
    expect(screen.getByText(cookiesData.content.intro)).toBeInTheDocument();
  });

  it("renders the interactive Live Browser Storage & Privacy Inspector", () => {
    renderCookiesPolicy();

    expect(screen.getByText(cookiesData.inspector.badge)).toBeInTheDocument();
    expect(screen.getByText(cookiesData.inspector.title)).toBeInTheDocument();
    expect(screen.getByText(cookiesData.inspector.trackersLabel)).toBeInTheDocument();
    expect(screen.getByText(cookiesData.inspector.trackersValue)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(cookiesData.inspector.resetBtn, "i") })).toBeInTheDocument();
  });

  it("generates Table of Contents with all 11 policy sections", () => {
    renderCookiesPolicy();

    const toc = screen.getByRole("navigation", { name: cookiesData.hero.toc.title });
    expect(toc).toBeInTheDocument();

    cookiesData.content.sections.forEach((section) => {
      expect(screen.getAllByText(section.title).length).toBeGreaterThan(0);
    });
  });

  it("renders Section 5 HTTP Cookie Inventory with code tokens and category badges", () => {
    renderCookiesPolicy();

    // Section 5 title
    expect(screen.getByRole("heading", { level: 2, name: new RegExp("5. Comprehensive HTTP Cookie Inventory", "i") })).toBeInTheDocument();

    // Verify technical cookie names are rendered as code tokens
    expect(screen.getByText("authjs.session-token")).toBeInTheDocument();
    expect(screen.getByText("authjs.csrf-token")).toBeInTheDocument();
    expect(screen.getByText("authjs.callback-url")).toBeInTheDocument();
    expect(screen.getByText("NEXT_LOCALE")).toBeInTheDocument();
    expect(screen.getByText("sidebar_state")).toBeInTheDocument();

    // Verify categories
    expect(screen.getAllByText("Strictly Necessary").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Preferences").length).toBeGreaterThan(0);
  });

  it("renders Section 6 LocalStorage & SessionStorage Inventory", () => {
    renderCookiesPolicy();

    expect(screen.getByRole("heading", { level: 2, name: new RegExp("6. Browser LocalStorage & SessionStorage Inventory", "i") })).toBeInTheDocument();

    // Verify storage keys
    expect(screen.getByText("theme")).toBeInTheDocument();
    expect(screen.getByText("mj_lang")).toBeInTheDocument();
    expect(screen.getByText("mj_timezone")).toBeInTheDocument();
    expect(screen.getByText("expert_onboarding_wizard_data")).toBeInTheDocument();
    expect(screen.getByText("accessToken / refreshToken")).toBeInTheDocument();
  });

  it("copies direct section link to clipboard on anchor button click", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    renderCookiesPolicy();

    const copyButtons = screen.getAllByRole("button", { name: /copy link to/i });
    expect(copyButtons.length).toBeGreaterThan(0);

    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
    });
  });

  it("renders dynamic DPO contact card with email and headquarters info", () => {
    renderCookiesPolicy();

    expect(screen.getByText(cookiesData.content.cardTitle)).toBeInTheDocument();
    expect(screen.getByText(cookiesData.content.cardDesc)).toBeInTheDocument();
    // Default or configured support email should be present as a mailto link
    const mailtoLinks = screen.getAllByRole("link").filter((l) => l.getAttribute("href")?.startsWith("mailto:"));
    expect(mailtoLinks.length).toBeGreaterThan(0);
  });

  it("triggers window.print when print button is clicked", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    renderCookiesPolicy();

    const printButtons = screen.getAllByRole("button", { name: new RegExp(cookiesData.hero.toc.print, "i") });
    expect(printButtons.length).toBeGreaterThan(0);

    fireEvent.click(printButtons[0]);
    expect(printSpy).toHaveBeenCalled();
  });

  it("allows switching between Cards view and Table view", () => {
    renderCookiesPolicy();

    // Default view is Cards
    const tableViewButtons = screen.getAllByRole("button", { name: new RegExp(cookiesData.table.tableView, "i") });
    expect(tableViewButtons.length).toBeGreaterThan(0);

    // Switch to Table view
    fireEvent.click(tableViewButtons[0]);

    // Should render table elements
    const tables = screen.getAllByRole("table");
    expect(tables.length).toBeGreaterThan(0);
  });
});
