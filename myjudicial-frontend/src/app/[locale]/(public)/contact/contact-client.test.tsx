import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { IntlProvider } from "@/i18n/intl-provider";
import enMessages from "../../../../../messages/en.json";
import frMessages from "../../../../../messages/fr.json";

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

const mockUsePlatformSettings = vi.fn();
vi.mock("@/lib/api/settings", () => ({
  usePlatformSettings: () => mockUsePlatformSettings(),
}));

const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (...args: unknown[]) => toastSuccess(...args), error: vi.fn() },
}));

vi.mock("@/features/search/components/office-map", () => ({
  OfficeMap: ({ label }: { label?: string }) => (
    <div data-testid="office-map">{label}</div>
  ),
}));

import ContactClient from "./contact-client";
import { contactPageJsonLd } from "@/features/public-content/json-ld";

const cp = enMessages.contactPage;
const CMS_EMAIL = "ops-desk@kigali.test";

const mockSettings = (over: Record<string, unknown> = {}) => ({
  supportEmail: CMS_EMAIL,
  hotlinePhone: "+250 788 000 111",
  whatsappNumber: "+250 788 222 333",
  officeBuilding: "Kigali Heights",
  officeStreet: "KG 7 Ave",
  officeDistrict: "Gasabo, Kigali",
  officePoBox: "P.O. Box 1, Kigali",
  supportWorkingHours: "Mon – Fri, 8:00 – 17:00 CAT",
  ...over,
});

const renderContact = (locale: "en" | "fr" = "en") =>
  render(
    <IntlProvider locale={locale} messages={(locale === "fr" ? frMessages : enMessages) as never}>
      <ContactClient />
    </IntlProvider>
  );

const getForm = () => document.querySelector("form") as HTMLFormElement;

const fillValidForm = () => {
  fireEvent.change(screen.getByLabelText(new RegExp(cp.form.name)), { target: { value: "Jean Mugisha" } });
  fireEvent.change(screen.getByLabelText(new RegExp(cp.form.email)), { target: { value: "jean@example.com" } });
  fireEvent.change(screen.getByLabelText(new RegExp(`^${cp.form.subject}`)), { target: { value: "Escrow refund" } });
  fireEvent.change(screen.getByLabelText(new RegExp(cp.form.message)), {
    target: { value: "My consultation was cancelled and I need a refund." },
  });
};

const writeText = vi.fn().mockResolvedValue(undefined);
const mockFetch = vi.fn();

beforeEach(() => {
  mockSearchParams.delete("type");
  mockUsePlatformSettings.mockReset();
  mockUsePlatformSettings.mockReturnValue({ settings: mockSettings(), isLoading: false });
  toastSuccess.mockReset();
  writeText.mockClear();
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

  mockFetch.mockReset();
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      data: { ticketId: "MJ-2026-K9X2P" },
    }),
  });
  global.fetch = mockFetch;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ContactClient — layout & localisation", () => {
  it("renders the hero, trust pillars and the localised fast-track badge", () => {
    renderContact();
    expect(screen.getByRole("heading", { level: 1, name: cp.hero.title })).toBeInTheDocument();
    expect(screen.getByText(cp.trustPillars.sla)).toBeInTheDocument();
    expect(screen.getByText(cp.selfService.badge)).toBeInTheDocument();
    expect(screen.getByText(cp.office.mapBadge)).toBeInTheDocument();
  });

  it("uses the CMS support email in the intake form routing note instead of the static fallback", () => {
    renderContact();
    const cmsEmails = screen.getAllByText(new RegExp(CMS_EMAIL));
    expect(cmsEmails.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(cp.departments.client.email)).not.toBeInTheDocument();
  });

  it("builds Google/Apple Maps links from the CMS office address", () => {
    renderContact();
    const google = screen.getByRole("link", { name: new RegExp(cp.office.openGoogleMaps) });
    const apple = screen.getByRole("link", { name: new RegExp(cp.office.openAppleMaps) });
    const expected = encodeURIComponent("Kigali Heights, Gasabo, Kigali");
    expect(google.getAttribute("href")).toContain(expected);
    expect(apple.getAttribute("href")).toContain(expected);
    expect(google.getAttribute("href")).not.toContain("Centenary");
  });

  it("builds the WhatsApp link from the CMS number and a localised greeting", () => {
    renderContact();
    const wa = document.querySelector<HTMLAnchorElement>('a[href^="https://wa.me/"]')!;
    expect(wa.getAttribute("href")).toContain("https://wa.me/250788222333");
    expect(wa.getAttribute("href")).toContain(encodeURIComponent(cp.office.whatsappPrefill));
  });
});

describe("ContactClient — department routing", () => {
  it("pre-selects the department from the ?type= query parameter", () => {
    mockSearchParams.set("type", "advocate");
    renderContact();
    const note = screen.getByText(new RegExp(cp.form.directedTo));
    expect(note.textContent).toContain(cp.departments.advocate.title);
  });

  it("updates the routing note when another department is selected", () => {
    renderContact();
    fireEvent.click(screen.getByRole("button", { name: cp.form.categories.institutional }));
    const note = screen.getByText(new RegExp(cp.form.directedTo));
    expect(note.textContent).toContain(cp.departments.institutional.title);
    expect(note.textContent).toContain(CMS_EMAIL);
  });
});

describe("ContactClient — intake form", () => {
  it("shows localised validation errors when submitted empty", () => {
    renderContact();
    fireEvent.submit(getForm());
    expect(screen.getByText(cp.validation.nameRequired)).toBeInTheDocument();
    expect(screen.getByText(cp.validation.emailRequired)).toBeInTheDocument();
    expect(screen.getByText(cp.validation.subjectRequired)).toBeInTheDocument();
    expect(screen.getByText(cp.validation.messageRequired)).toBeInTheDocument();
  });

  it("flags an invalid email and a too-short message", () => {
    renderContact();
    fireEvent.change(screen.getByLabelText(new RegExp(cp.form.email)), { target: { value: "not-an-email" } });
    fireEvent.change(screen.getByLabelText(new RegExp(cp.form.message)), { target: { value: "short" } });
    fireEvent.submit(getForm());
    expect(screen.getByText(cp.validation.emailInvalid)).toBeInTheDocument();
    expect(screen.getByText(cp.validation.messageMinLength)).toBeInTheDocument();
  });

  it("renders validation errors in French on the /fr locale", () => {
    renderContact("fr");
    fireEvent.submit(getForm());
    expect(screen.getByText(frMessages.contactPage.validation.nameRequired)).toBeInTheDocument();
    expect(screen.queryByText(cp.validation.nameRequired)).not.toBeInTheDocument();
  });

  it("lets diaspora users pick an international dialing code", () => {
    renderContact();
    const select = screen.getByRole("combobox", { name: cp.form.phoneCountryCode }) as HTMLSelectElement;
    expect(select.value).toBe("+250");
    fireEvent.change(select, { target: { value: "+254" } });
    expect(select.value).toBe("+254");
  });

  it("submits, shows a ticket reference, copies it and can reset", async () => {
    renderContact();
    fillValidForm();
    fireEvent.submit(getForm());

    expect(await screen.findByText(cp.form.successTitle, {}, { timeout: 2000 })).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/content/contact/inquiry"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
    const ticket = screen.getByText(/^MJ-2026-[A-Z0-9]+$/);

    fireEvent.click(screen.getByRole("button", { name: new RegExp(cp.actions.copyTicket) }));
    expect(await screen.findByText(cp.actions.copied)).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(ticket.textContent);
    expect(toastSuccess).toHaveBeenCalledWith(cp.actions.ticketCopied);

    fireEvent.click(screen.getByRole("button", { name: cp.form.sendAnother }));
    expect(screen.getByLabelText(new RegExp(cp.form.name))).toHaveValue("");
  });
});

describe("ContactClient — direct email dispatcher", () => {
  it("offers Gmail, Outlook, default app and copy, pre-filled with the draft", async () => {
    renderContact();
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(cp.emailMenu.trigger) }));

    const heading = await screen.findByText(cp.emailMenu.chooseEmailService);
    const menu = heading.parentElement as HTMLElement;

    const gmail = within(menu).getByRole("link", { name: new RegExp(cp.emailMenu.gmail.replace(/[()]/g, "\\$&")) });
    expect(gmail.getAttribute("href")).toContain("mail.google.com");
    expect(gmail.getAttribute("href")).toContain(encodeURIComponent(CMS_EMAIL));
    expect(gmail.getAttribute("href")).toContain(encodeURIComponent("Escrow refund"));

    const outlook = within(menu).getByRole("link", { name: new RegExp(cp.emailMenu.outlook.replace(/[()]/g, "\\$&")) });
    expect(outlook.getAttribute("href")).toContain("outlook.live.com");

    const native = within(menu).getByRole("link", { name: new RegExp(cp.emailMenu.defaultApp) });
    expect(native.getAttribute("href")).toMatch(new RegExp(`^mailto:${CMS_EMAIL}`));

    fireEvent.click(within(menu).getByRole("button", { name: new RegExp(cp.emailMenu.copyEmailAddress) }));
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(CMS_EMAIL));
  });
});

describe("contactPageJsonLd", () => {
  it("emits a ContactPage with a ContactPoint built from platform settings", () => {
    const data = contactPageJsonLd({
      title: "Contact Us | MyJudicial",
      description: "desc",
      url: "https://myjudicial.com/en/contact",
      locale: "en",
      settings: mockSettings() as never,
    }) as { "@graph": Array<Record<string, unknown>> };

    const page = data["@graph"][0];
    expect(page["@type"]).toBe("ContactPage");
    const point = page.mainEntity as Record<string, unknown>;
    expect(point["@type"]).toBe("ContactPoint");
    expect(point.email).toBe(CMS_EMAIL);
    expect(point.telephone).toBe("+250 788 000 111");
    expect(point.availableLanguage).toEqual(["English", "French", "Kinyarwanda"]);
    expect(data["@graph"][1]["@type"]).toBe("Organization");
  });
});
