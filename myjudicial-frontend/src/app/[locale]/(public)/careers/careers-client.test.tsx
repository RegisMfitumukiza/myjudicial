import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { IntlProvider } from "@/i18n/intl-provider";
import enMessages from "../../../../../messages/en.json";

/*
 * The real next-intl navigation Link needs an App Router context that does not
 * exist in jsdom, so it is replaced with a plain anchor. Nothing else about the
 * component under test is stubbed.
 */
vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const mockUsePlatformSettings = vi.fn();
vi.mock("@/lib/api/settings", () => ({
  usePlatformSettings: () => mockUsePlatformSettings(),
}));

import CareersClient from "./careers-client";

const messages = enMessages as never;
const cp = enMessages.careersPage;

type Role = Record<string, unknown> & { id: string; title: string };

const settings = (over: Record<string, unknown> = {}) => ({
  careersEmail: "support@myjudicial.com",
  careersHiringStatus: "TALENT_POOL",
  careersOpenRoles: [] as Role[],
  officeBuilding: "KN 5 Rd",
  officeStreet: "Kimihurura",
  officeDistrict: "Gasabo",
  ...over,
});

const renderCareers = () =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <CareersClient />
    </IntlProvider>
  );

beforeEach(() => {
  mockUsePlatformSettings.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Careers — no vacancies", () => {
  it("shows the talent-pool state and hides role cards", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: settings() });
    renderCareers();

    expect(screen.getByText(cp.openings.empty.title)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /engineer/i })).not.toBeInTheDocument();
  });

  it("offers a mail action instead of a link to non-existent openings", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: settings() });
    renderCareers();

    expect(screen.queryByRole("link", { name: cp.hero.viewOpenings })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: cp.cta.viewOpenings })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: cp.hero.sendInterest }).length).toBeGreaterThan(0);
  });

  it("hides roles that are still being drafted (published: false)", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: settings({
        careersHiringStatus: "ACTIVELY_HIRING",
        careersOpenRoles: [{ ...baseRole, published: false }],
      }),
    });
    renderCareers();

    expect(screen.getByText(cp.openings.empty.title)).toBeInTheDocument();
    expect(screen.queryByText(baseRole.title)).not.toBeInTheDocument();
  });

  it("stays in the empty state when hiring is paused even if roles exist", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: settings({
        careersHiringStatus: "PAUSED",
        careersOpenRoles: [baseRole],
      }),
    });
    renderCareers();

    expect(screen.getByText(cp.openings.empty.title)).toBeInTheDocument();
    expect(screen.queryByText(baseRole.title)).not.toBeInTheDocument();
  });
});

const baseRole: Role = {
  id: "eng-1",
  title: "Backend Engineer",
  department: "Engineering",
  location: "Kigali",
  type: "Full-time",
  applyUrl: "",
};

describe("Careers — open positions", () => {
  it("links the hero CTA to the positions section", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: settings({ careersHiringStatus: "ACTIVELY_HIRING", careersOpenRoles: [baseRole] }),
    });
    renderCareers();

    const links = screen.getAllByRole("link", { name: cp.hero.viewOpenings });
    expect(links).toHaveLength(1);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "#positions");
    }
    expect(screen.getByRole("heading", { name: baseRole.title })).toBeInTheDocument();
    expect(screen.queryByText(cp.openings.empty.title)).not.toBeInTheDocument();
  });

  it("shows the role summary row and honours a missing employment type", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: settings({
        careersHiringStatus: "ACTIVELY_HIRING",
        careersOpenRoles: [{ ...baseRole, type: "" }],
      }),
    });
    renderCareers();

    const card = screen.getByRole("heading", { name: baseRole.title }).closest("article");
    expect(card?.textContent).toContain(baseRole.department);
    expect(card?.textContent).toContain(baseRole.location);
  });

  it("renders optional details only when an admin supplied them", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: settings({
        careersHiringStatus: "ACTIVELY_HIRING",
        careersOpenRoles: [
          { ...baseRole, description: "Own the payments ledger." },
          { ...baseRole, id: "eng-2", title: "Product Writer" },
        ],
      }),
    });
    renderCareers();

    expect(screen.getByText("Own the payments ledger.")).toBeInTheDocument();
    expect(screen.queryByText(cp.openings.requirements)).not.toBeInTheDocument();
  });

  it("renders responsibilities, requirements and application instructions", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: settings({
        careersHiringStatus: "ACTIVELY_HIRING",
        careersOpenRoles: [
          {
            ...baseRole,
            responsibilities: ["Build APIs"],
            requirements: ["TypeScript"],
            niceToHave: ["Postgres"],
            applicationInstructions: "Email us a short note.",
          },
        ],
      }),
    });
    renderCareers();

    expect(screen.getByText(cp.openings.responsibilities)).toBeInTheDocument();
    expect(screen.getByText("Build APIs")).toBeInTheDocument();
    expect(screen.getByText(cp.openings.requirements)).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText(cp.openings.niceToHave)).toBeInTheDocument();
    expect(screen.getByText("Postgres")).toBeInTheDocument();
    expect(screen.getByText(cp.openings.applicationInstructions)).toBeInTheDocument();
    expect(screen.getByText("Email us a short note.")).toBeInTheDocument();
  });

  it("treats a role without an explicit published flag as published", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: settings({ careersHiringStatus: "ACTIVELY_HIRING", careersOpenRoles: [baseRole] }),
    });
    renderCareers();

    expect(screen.getByRole("heading", { name: baseRole.title })).toBeInTheDocument();
  });

  it("only shows an external portal link for a real http(s) apply URL", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: settings({
        careersHiringStatus: "ACTIVELY_HIRING",
        careersOpenRoles: [
          { ...baseRole, id: "eng-3", applyUrl: "https://jobs.example.com/eng-1" },
          { ...baseRole, id: "eng-4", applyUrl: "javascript:alert(1)" },
        ],
      }),
    });
    renderCareers();

    const link = screen.getByRole("link", {
      name: `${baseRole.title} — ${cp.openings.externalPortal}`,
    });
    expect(link).toHaveAttribute("href", "https://jobs.example.com/eng-1");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getAllByRole("link", { name: /external/i })).toHaveLength(1);
  });

  it("filters roles in real-time by keyword search across title, department and requirements", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: settings({
        careersHiringStatus: "ACTIVELY_HIRING",
        careersOpenRoles: [
          { ...baseRole, id: "role-1", title: "Senior Backend Engineer", department: "Engineering" },
          { ...baseRole, id: "role-2", title: "Product Designer", department: "Design" },
          { ...baseRole, id: "role-3", title: "Legal Counsel", department: "Legal", requirements: ["Bar Admission"] },
        ],
      }),
    });
    renderCareers();

    expect(screen.getByText("Senior Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Product Designer")).toBeInTheDocument();
    expect(screen.getByText("Legal Counsel")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(cp.openings.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: "designer" } });

    expect(screen.queryByText("Senior Backend Engineer")).not.toBeInTheDocument();
    expect(screen.getByText("Product Designer")).toBeInTheDocument();
    expect(screen.queryByText("Legal Counsel")).not.toBeInTheDocument();

    // Search by requirement keyword
    fireEvent.change(searchInput, { target: { value: "bar admission" } });
    expect(screen.getByText("Legal Counsel")).toBeInTheDocument();
    expect(screen.queryByText("Product Designer")).not.toBeInTheDocument();

    // No matches show empty state and reset button
    fireEvent.change(searchInput, { target: { value: "nonexistent-keyword" } });
    expect(screen.getByText(cp.openings.noSearchResults)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: cp.openings.resetFilters }));
    expect(screen.getByText("Senior Backend Engineer")).toBeInTheDocument();
  });

  it("collapses role details when > 2 roles are present and toggles on click", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: settings({
        careersHiringStatus: "ACTIVELY_HIRING",
        careersOpenRoles: [
          {
            ...baseRole,
            id: "role-1",
            title: "Frontend Lead",
            description: "Lead the frontend team.",
            requirements: ["React 19"],
          },
          {
            ...baseRole,
            id: "role-2",
            title: "DevOps Engineer",
            description: "Scale infrastructure.",
          },
          {
            ...baseRole,
            id: "role-3",
            title: "Growth Lead",
            description: "Drive adoption.",
          },
        ],
      }),
    });
    renderCareers();

    // With 3 roles, details should be collapsed by default
    expect(screen.queryByText("Lead the frontend team.")).not.toBeInTheDocument();
    expect(screen.queryByText("React 19")).not.toBeInTheDocument();

    // Expand the first role
    const toggleButtons = screen.getAllByRole("button", { name: new RegExp(cp.openings.viewDetails, "i") });
    expect(toggleButtons.length).toBeGreaterThan(0);
    fireEvent.click(toggleButtons[0]);

    // Now details should be visible
    expect(screen.getByText("Lead the frontend team.")).toBeInTheDocument();
    expect(screen.getByText("React 19")).toBeInTheDocument();

    // Collapse it back
    const hideButton = screen.getByRole("button", { name: new RegExp(cp.openings.hideDetails, "i") });
    fireEvent.click(hideButton);
    expect(screen.queryByText("Lead the frontend team.")).not.toBeInTheDocument();
  });

  it("copies role deep link to clipboard and provides feedback", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });

    mockUsePlatformSettings.mockReturnValue({
      settings: settings({
        careersHiringStatus: "ACTIVELY_HIRING",
        careersOpenRoles: [baseRole],
      }),
    });
    renderCareers();

    const copyBtn = screen.getByRole("button", { name: cp.openings.copyRoleLink });
    fireEvent.click(copyBtn);

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining(`#${baseRole.id}`));
    });
    await vi.waitFor(() => {
      expect(screen.getByText(cp.openings.roleLinkCopied)).toBeInTheDocument();
    });
  });

  it("smooth scrolls to positions section and updates hash on hero CTA click", () => {
    const scrollIntoView = vi.fn();
    const mockElement = document.createElement("div");
    mockElement.id = "positions";
    mockElement.scrollIntoView = scrollIntoView;
    document.body.appendChild(mockElement);

    const pushStateSpy = vi.spyOn(window.history, "pushState");

    mockUsePlatformSettings.mockReturnValue({
      settings: settings({
        careersHiringStatus: "ACTIVELY_HIRING",
        careersOpenRoles: [baseRole],
      }),
    });
    renderCareers();

    const heroCta = screen.getByRole("link", { name: cp.hero.viewOpenings });
    fireEvent.click(heroCta);

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
    expect(pushStateSpy).toHaveBeenCalledWith(null, "", "#positions");

    document.body.removeChild(mockElement);
    pushStateSpy.mockRestore();
  });
});

describe("Careers — FAQs", () => {
  it("exposes accordion state and wires each button to its panel", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: settings() });
    renderCareers();

    const button = screen.getByRole("button", { name: cp.faqs.q1 });
    expect(button).toHaveAttribute("aria-expanded", "false");
    const panelId = button.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();

    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    const panel = document.getElementById(panelId as string);
    expect(panel).toBeTruthy();
    expect(panel?.textContent).toContain(cp.faqs.a1);
  });

  it("collapses an open question when clicked again", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: settings() });
    renderCareers();

    const button = screen.getByRole("button", { name: cp.faqs.q1 });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("shows the office address from platform settings", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: settings() });
    renderCareers();

    fireEvent.click(screen.getByRole("button", { name: cp.faqs.q1 }));
    expect(screen.getByText("KN 5 Rd, Kimihurura, Gasabo")).toBeInTheDocument();
  });

  it("omits the address block when no office is configured", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: settings({ officeBuilding: "", officeStreet: "", officeDistrict: "" }),
    });
    renderCareers();

    fireEvent.click(screen.getByRole("button", { name: cp.faqs.q1 }));
    expect(screen.getByText(cp.faqs.a1)).toBeInTheDocument();
  });

  it("only asks four questions", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: settings() });
    renderCareers();

    const faqText = cp.faqs as Record<string, string>;
    for (let i = 1; i <= 4; i++) {
      expect(screen.getByRole("button", { name: faqText[`q${i}`] })).toBeInTheDocument();
    }
    // Each question is the only button inside its own heading, so this counts
    // the accordion without depending on wording.
    const questions = screen.getAllByRole("button").filter((b) => b.closest("h3"));
    expect(questions).toHaveLength(4);
  });
});

describe("Careers — expression of interest", () => {
  /** Target the hero CTA button. */
  const ctaButton = () =>
    screen.getAllByRole("button", { name: cp.hero.sendInterest })[0] as HTMLElement;

  const open = () => {
    fireEvent.click(ctaButton());
    return screen.getByRole("dialog");
  };

  it("provides an interactive in-app application form", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: settings() });
    renderCareers();

    const dialog = open();
    expect(dialog.querySelector("form")).not.toBeNull();
    expect(dialog.querySelectorAll("input, textarea").length).toBeGreaterThan(0);
  });

  it("is a labelled modal dialog", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: settings() });
    renderCareers();

    const dialog = open();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(document.getElementById(labelledBy as string)?.textContent).toBe(cp.expressionModal.title);
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(document.getElementById(describedBy as string)?.textContent).toBe(cp.expressionModal.desc);
  });

  it("shows the careers address and provides email options including mailto in popover", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: settings() });
    renderCareers();

    const dialog = open();
    expect(within(dialog).getByText("support@myjudicial.com")).toBeInTheDocument();

    const popoverBtn = within(dialog).getByRole("button", { name: cp.expressionModal.openEmailClient });
    fireEvent.click(popoverBtn);

    const mailto = screen.getByRole("link", { name: new RegExp(cp.expressionModal.emailDefaultApp, "i") });
    const href = decodeURIComponent(mailto.getAttribute("href") as string);
    expect(href.startsWith("mailto:support@myjudicial.com?subject=")).toBe(true);
    expect(href).toContain(cp.expressionModal.emailSubject);

    const gmail = screen.getByRole("link", { name: new RegExp(cp.expressionModal.emailWebGmail, "i") });
    expect(gmail.getAttribute("href")).toContain("mail.google.com");
  });

  it("uses a role-specific subject when opened from a role card", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: settings({ careersHiringStatus: "ACTIVELY_HIRING", careersOpenRoles: [baseRole] }),
    });
    renderCareers();

    fireEvent.click(screen.getByRole("button", { name: cp.openings.applyDirect }));
    const popoverBtn = screen.getByRole("button", { name: cp.expressionModal.openEmailClient });
    fireEvent.click(popoverBtn);

    const mailto = screen.getByRole("link", { name: new RegExp(cp.expressionModal.emailDefaultApp, "i") });
    const href = decodeURIComponent(mailto.getAttribute("href") as string);
    expect(href).toContain(baseRole.title);
  });

  it("copies the address and reports success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });

    mockUsePlatformSettings.mockReturnValue({ settings: settings() });
    renderCareers();

    const dialog = open();
    fireEvent.click(within(dialog).getByRole("button", { name: cp.expressionModal.copyEmail }));

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith("support@myjudicial.com"));
    await vi.waitFor(() =>
      expect(within(dialog).getByRole("button", { name: cp.expressionModal.copied })).toBeInTheDocument()
    );
  });

  it("reports a readable failure when the clipboard is unavailable", async () => {
    vi.stubGlobal("navigator", { ...navigator, clipboard: undefined });

    mockUsePlatformSettings.mockReturnValue({ settings: settings() });
    renderCareers();

    const dialog = open();
    fireEvent.click(within(dialog).getByRole("button", { name: cp.expressionModal.copyEmail }));

    const status = within(dialog).getByRole("status");
    await vi.waitFor(() => expect(status).toHaveTextContent(cp.expressionModal.copyFailed));
  });

  it("closes on Escape and returns focus to the trigger", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: settings() });
    renderCareers();

    const trigger = ctaButton();
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("locks background scrolling while open and restores it after", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: settings() });
    renderCareers();

    const dialog = open();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.click(within(dialog).getByRole("button", { name: cp.expressionModal.close }));
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("respects CMS field requirement settings for optional vs required fields", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: settings({
        careersRequirePhone: true,
        careersRequireLinkedIn: false,
      }),
    });
    renderCareers();

    const dialog = open();
    const phoneInput = within(dialog).getByPlaceholderText(cp.expressionModal.phonePlaceholder);
    expect(phoneInput).toBeRequired();

    const linkedinInput = within(dialog).getByPlaceholderText(cp.expressionModal.linkedinPlaceholder);
    expect(linkedinInput).not.toBeRequired();
    expect(within(dialog).getAllByText(`(${cp.expressionModal.optionalBadge})`).length).toBeGreaterThan(0);
  });

  it("supports switching between file upload and cloud link for resume", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: settings() });
    renderCareers();

    const dialog = open();
    expect(within(dialog).getByText(cp.expressionModal.resumeUploadPrompt)).toBeInTheDocument();

    // Switch to cloud link
    fireEvent.click(within(dialog).getByRole("button", { name: cp.expressionModal.resumeMethodLink }));
    expect(within(dialog).getByPlaceholderText(cp.expressionModal.resumeLinkPlaceholder)).toBeInTheDocument();

    // Switch back to upload
    fireEvent.click(within(dialog).getByRole("button", { name: cp.expressionModal.resumeMethodUpload }));
    expect(within(dialog).getByText(cp.expressionModal.resumeUploadPrompt)).toBeInTheDocument();
  });

  it("toggles application tips accordion", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: settings() });
    renderCareers();

    const dialog = open();
    expect(within(dialog).queryByText(cp.expressionModal.guidanceTitle)).not.toBeInTheDocument();

    // Expand tips
    fireEvent.click(within(dialog).getByRole("button", { name: cp.expressionModal.tipsToggleShow }));
    expect(within(dialog).getByText(cp.expressionModal.guidanceTitle)).toBeInTheDocument();
    expect(within(dialog).getByText(cp.expressionModal.guide1)).toBeInTheDocument();

    // Collapse tips
    fireEvent.click(within(dialog).getByRole("button", { name: cp.expressionModal.tipsToggleHide }));
    expect(within(dialog).queryByText(cp.expressionModal.guidanceTitle)).not.toBeInTheDocument();
  });

  it("submits application form successfully and displays confirmation screen", async () => {
    mockUsePlatformSettings.mockReturnValue({ settings: settings() });
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: "Application submitted" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    renderCareers();
    const dialog = open();

    // Fill in required fields
    fireEvent.change(within(dialog).getByPlaceholderText(cp.expressionModal.fullNamePlaceholder), {
      target: { value: "Aline Uwase" },
    });
    fireEvent.change(within(dialog).getByPlaceholderText(cp.expressionModal.emailPlaceholder), {
      target: { value: "aline@example.com" },
    });

    // Provide resume link
    fireEvent.click(within(dialog).getByRole("button", { name: cp.expressionModal.resumeMethodLink }));
    fireEvent.change(within(dialog).getByPlaceholderText(cp.expressionModal.resumeLinkPlaceholder), {
      target: { value: "https://drive.google.com/file/d/my-cv" },
    });

    // Provide cover note
    fireEvent.change(within(dialog).getByPlaceholderText(cp.expressionModal.coverNotePlaceholder), {
      target: { value: "I am passionate about justice in Rwanda." },
    });

    // Submit form
    const form = dialog.querySelector("form")!;
    fireEvent.submit(form);

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/content/careers/apply"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
        })
      );
    });

    await vi.waitFor(() => {
      expect(within(dialog).getByText(cp.expressionModal.successTitle)).toBeInTheDocument();
      expect(within(dialog).getByText(cp.expressionModal.successMessage)).toBeInTheDocument();
    });
  });

  it("handles application submission error cleanly", async () => {
    mockUsePlatformSettings.mockReturnValue({ settings: settings() });
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Backend error occurred" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    renderCareers();
    const dialog = open();

    fireEvent.change(within(dialog).getByPlaceholderText(cp.expressionModal.fullNamePlaceholder), {
      target: { value: "Aline Uwase" },
    });
    fireEvent.change(within(dialog).getByPlaceholderText(cp.expressionModal.emailPlaceholder), {
      target: { value: "aline@example.com" },
    });

    // Provide resume link
    fireEvent.click(within(dialog).getByRole("button", { name: cp.expressionModal.resumeMethodLink }));
    fireEvent.change(within(dialog).getByPlaceholderText(cp.expressionModal.resumeLinkPlaceholder), {
      target: { value: "https://drive.google.com/file/d/my-cv" },
    });

    // Provide cover note
    fireEvent.change(within(dialog).getByPlaceholderText(cp.expressionModal.coverNotePlaceholder), {
      target: { value: "I am passionate about justice in Rwanda." },
    });

    const form = dialog.querySelector("form")!;
    fireEvent.submit(form);

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    await vi.waitFor(() => {
      expect(within(dialog).getByText("Backend error occurred")).toBeInTheDocument();
    });
  });
});
