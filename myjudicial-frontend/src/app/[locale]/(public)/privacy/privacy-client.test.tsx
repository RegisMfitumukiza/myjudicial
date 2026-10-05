import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { IntlProvider } from "@/i18n/intl-provider";
import enMessages from "../../../../../messages/en.json";

const mockUsePlatformSettings = vi.fn();
vi.mock("@/lib/api/settings", () => ({
  usePlatformSettings: () => mockUsePlatformSettings(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
}));

import LegalPageClient from "@/features/public-content/legal-page-client";

const messages = enMessages as never;
const privacyData = enMessages.legalPages.privacy;

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

const renderPrivacyPolicy = () =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <LegalPageClient pageKey="privacy" />
    </IntlProvider>
  );

describe("PrivacyPolicy — LegalPageClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUsePlatformSettings.mockReturnValue({
      settings: defaultSettings,
      isLoading: false,
    });
  });

  it("renders hero section with badge, title, and legal intro", () => {
    renderPrivacyPolicy();

    expect(screen.getByText(privacyData.hero.badge)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: privacyData.hero.title })
    ).toBeInTheDocument();
    expect(screen.getByText(privacyData.content.intro)).toBeInTheDocument();
  });

  it("renders the interactive Statutory Rights & DPO Action Center", () => {
    renderPrivacyPolicy();

    expect(screen.getByText(privacyData.rightsHelper.badge)).toBeInTheDocument();
    expect(screen.getByText(privacyData.rightsHelper.title)).toBeInTheDocument();
    expect(screen.getByText(privacyData.rightsHelper.statutorySlaBadge)).toBeInTheDocument();

    // Verify all 5 statutory rights tabs are present
    expect(screen.getByRole("tab", { name: new RegExp(privacyData.rightsHelper.rights.access.name, "i") })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: new RegExp(privacyData.rightsHelper.rights.rectification.name, "i") })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: new RegExp(privacyData.rightsHelper.rights.erasure.name, "i") })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: new RegExp(privacyData.rightsHelper.rights.portability.name, "i") })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: new RegExp(privacyData.rightsHelper.rights.objection.name, "i") })).toBeInTheDocument();
  });

  it("allows switching statutory rights tabs and updates details accordingly", () => {
    renderPrivacyPolicy();

    // Default active right is Access (Article 16)
    expect(
      screen.getByText(privacyData.rightsHelper.rights.access.description)
    ).toBeInTheDocument();

    // Switch to Rectification (Article 18)
    const rectificationTab = screen.getByRole("tab", {
      name: new RegExp(privacyData.rightsHelper.rights.rectification.name, "i"),
    });
    fireEvent.click(rectificationTab);

    // Should display Rectification details and self-serve link
    expect(
      screen.getByText(privacyData.rightsHelper.rights.rectification.description)
    ).toBeInTheDocument();
    expect(
      screen.getByText(privacyData.rightsHelper.selfServeAction)
    ).toBeInTheDocument();

    // Switch to Erasure (Article 19)
    const erasureTab = screen.getByRole("tab", {
      name: new RegExp(privacyData.rightsHelper.rights.erasure.name, "i"),
    });
    fireEvent.click(erasureTab);

    expect(
      screen.getByText(privacyData.rightsHelper.rights.erasure.description)
    ).toBeInTheDocument();
  });

  it("copies statutory request template to clipboard", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    renderPrivacyPolicy();

    const copyBtn = screen.getByRole("button", {
      name: new RegExp(privacyData.rightsHelper.copyTemplateBtn, "i"),
    });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
    });
  });

  it("generates Table of Contents with all 23 policy sections", () => {
    renderPrivacyPolicy();

    const toc = screen.getByRole("navigation", { name: privacyData.hero.toc.title });
    expect(toc).toBeInTheDocument();

    privacyData.content.sections.forEach((section) => {
      expect(screen.getAllByText(section.title).length).toBeGreaterThan(0);
    });
  });

  it("interpolates dynamic platform settings tokens into section text", () => {
    renderPrivacyPolicy();

    // Section 1 should have dynamic officeAddress and poBox interpolated
    expect(screen.getAllByText((content) => content.includes(defaultSettings.officeBuilding)).length).toBeGreaterThan(0);

    // Section 23 should have hotline phone and DPO email
    expect(screen.getAllByText((content) => content.includes(defaultSettings.hotlinePhone)).length).toBeGreaterThan(0);
  });

  it("copies direct section link to clipboard on anchor button click", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    renderPrivacyPolicy();

    const copyButtons = screen.getAllByRole("button", { name: /copy link to/i });
    expect(copyButtons.length).toBeGreaterThan(0);

    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
    });
  });

  it("renders dynamic DPO contact card with email and headquarters info", () => {
    renderPrivacyPolicy();

    expect(screen.getByText(privacyData.content.cardTitle)).toBeInTheDocument();
    expect(screen.getByText(privacyData.content.cardDesc)).toBeInTheDocument();
    const mailtoLinks = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("href")?.startsWith("mailto:"));
    expect(mailtoLinks.length).toBeGreaterThan(0);
  });

  it("triggers window.print when print button is clicked", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    renderPrivacyPolicy();

    const printButtons = screen.getAllByRole("button", {
      name: new RegExp(privacyData.hero.toc.print, "i"),
    });
    expect(printButtons.length).toBeGreaterThan(0);

    fireEvent.click(printButtons[0]);
    expect(printSpy).toHaveBeenCalled();
  });

  it("opens the in-app statutory privacy request modal and supports direct submission", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    renderPrivacyPolicy();

    // Click "Submit Statutory Request"
    const openModalBtn = screen.getByRole("button", {
      name: new RegExp(privacyData.rightsHelper.openModalBtn, "i"),
    });
    fireEvent.click(openModalBtn);

    // Verify modal is open
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(privacyData.rightsHelper.modal.title)).toBeInTheDocument();

    // Fill in form fields
    const nameInput = screen.getByPlaceholderText(
      privacyData.rightsHelper.modal.labels.fullNamePlaceholder
    );
    const emailInput = screen.getByPlaceholderText(
      privacyData.rightsHelper.modal.labels.emailPlaceholder
    );
    const certCheckbox = screen.getByRole("checkbox");

    fireEvent.change(nameInput, { target: { value: "Jean-Paul Gasana" } });
    fireEvent.change(emailInput, { target: { value: "jp.gasana@example.rw" } });
    fireEvent.click(certCheckbox);

    // Submit form
    const submitBtn = screen.getByRole("button", {
      name: new RegExp(privacyData.rightsHelper.modal.labels.submit, "i"),
    });
    fireEvent.click(submitBtn);

    // Verify success confirmation screen with DSAR ticket reference
    await waitFor(
      () => {
        expect(
          screen.getByText(privacyData.rightsHelper.modal.success.title)
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getByText(/DSAR-2026-\d{4}/)).toBeInTheDocument();

    // Copy reference
    const copyRefBtn = screen.getByRole("button", {
      name: new RegExp(privacyData.rightsHelper.modal.success.copyRef, "i"),
    });
    fireEvent.click(copyRefBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
    });

    // Close modal
    const doneBtn = screen.getByRole("button", {
      name: new RegExp(privacyData.rightsHelper.modal.success.close, "i"),
    });
    fireEvent.click(doneBtn);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the in-app modal when Escape key is pressed", () => {
    renderPrivacyPolicy();

    const openModalBtn = screen.getByRole("button", {
      name: new RegExp(privacyData.rightsHelper.openModalBtn, "i"),
    });
    fireEvent.click(openModalBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the email menu with Gmail, Outlook, mailto, and copy options when DPO email is configured", () => {
    renderPrivacyPolicy();

    const emailMenuTrigger = screen.getByRole("button", {
      name: new RegExp(privacyData.rightsHelper.emailMenu.trigger, "i"),
    });
    fireEvent.click(emailMenuTrigger);

    // Verify Gmail and Outlook web links
    expect(screen.getByText(privacyData.rightsHelper.emailMenu.gmail)).toBeInTheDocument();
    expect(screen.getByText(privacyData.rightsHelper.emailMenu.outlook)).toBeInTheDocument();
    expect(screen.getByText(privacyData.rightsHelper.emailMenu.defaultApp)).toBeInTheDocument();
    expect(screen.getByText(privacyData.rightsHelper.emailMenu.copyEmail)).toBeInTheDocument();
  });

  it("handles when no dynamic DPO email is configured gracefully", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: {
        ...defaultSettings,
        dpoContactEmail: "",
      },
      isLoading: false,
    });

    renderPrivacyPolicy();

    // Template preview should show in-app portal fallback
    expect(
      screen.getByText((content) =>
        content.includes(privacyData.rightsHelper.emailMenu.noEmailAssigned)
      )
    ).toBeInTheDocument();

    // Clicking email menu when no email is set alerts user to use in-app portal
    const emailMenuTrigger = screen.getByRole("button", {
      name: new RegExp(privacyData.rightsHelper.emailMenu.trigger, "i"),
    });
    fireEvent.click(emailMenuTrigger);

    // Email popup shouldn't open without an email
    expect(
      screen.queryByText(privacyData.rightsHelper.emailMenu.gmail)
    ).not.toBeInTheDocument();
  });
});
