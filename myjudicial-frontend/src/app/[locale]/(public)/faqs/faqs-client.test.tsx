import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IntlProvider } from "@/i18n/intl-provider";
import enMessages from "../../../../../messages/en.json";

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

import FaqsClient, { normalizeFaqCategory } from "./faqs-client";

const messages = enMessages as never;
const fp = enMessages.faqsPage;

const mockSettings = (over: Record<string, unknown> = {}) => ({
  supportEmail: "kigali-help@myjudicial.com",
  hotlinePhone: "+250 788 123 456",
  supportWorkingHours: "Mon - Fri, 8:00 AM - 6:00 PM CAT",
  supplementalFaqs: [],
  ...over,
});

const renderFaqs = () =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <FaqsClient />
    </IntlProvider>
  );

beforeEach(() => {
  mockSearchParams.delete("category");
  mockSearchParams.delete("q");
  mockUsePlatformSettings.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("normalizeFaqCategory unit helper", () => {
  it("maps CMS 'experts' to 'advocates'", () => {
    expect(normalizeFaqCategory("experts")).toBe("advocates");
    expect(normalizeFaqCategory("Lawyers")).toBe("advocates");
  });

  it("maps CMS 'billing' to 'escrow'", () => {
    expect(normalizeFaqCategory("billing")).toBe("escrow");
    expect(normalizeFaqCategory("Payments")).toBe("escrow");
  });

  it("maps CMS 'security' to 'trust'", () => {
    expect(normalizeFaqCategory("security")).toBe("trust");
    expect(normalizeFaqCategory("Compliance")).toBe("trust");
  });

  it("maps CMS 'clients' and fallbacks", () => {
    expect(normalizeFaqCategory("clients")).toBe("clients");
    expect(normalizeFaqCategory("anything_else")).toBe("general");
  });
});

describe("FaqsClient — Knowledge Center & FAQs", () => {
  it("renders 16 core questions and category tabs with correct counts", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: mockSettings(), isLoading: false });

    renderFaqs();

    expect(screen.getByText(fp.hero.title)).toBeInTheDocument();
    expect(screen.getByText(fp.items.item1.q)).toBeInTheDocument();
    expect(screen.getByText(fp.items.item10.q)).toBeInTheDocument();

    // 16 core items total
    expect(screen.getByText("Showing 16 verified answers")).toBeInTheDocument();
  });

  it("seamlessly integrates CMS supplemental FAQs with category normalization", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: mockSettings({
        supplementalFaqs: [
          {
            id: "sup-1",
            question: "Can international law firms partner with MyJudicial?",
            answer: "Yes, cross-border partnerships are supported through our institutional desk.",
            category: "experts", // CMS category for advocates
          },
          {
            id: "sup-2",
            question: "How do Diaspora clients pay through bank wires?",
            answer: "Wire instructions are provided upon booking checkout.",
            category: "billing", // CMS category for escrow
          },
        ],
      }),
      isLoading: false,
    });

    renderFaqs();

    // 16 core + 2 supplemental = 18 total
    expect(screen.getByText("Showing 18 verified answers")).toBeInTheDocument();
    expect(
      screen.getByText("Can international law firms partner with MyJudicial?")
    ).toBeInTheDocument();
    expect(
      screen.getByText("How do Diaspora clients pay through bank wires?")
    ).toBeInTheDocument();
  });

  it("filters questions by category when a tab is clicked", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: mockSettings(), isLoading: false });

    renderFaqs();

    // Switch to 'Payments & Escrow' tab
    const escrowButtons = screen.getAllByRole("button", { name: new RegExp(fp.categories.escrow, "i") });
    fireEvent.click(escrowButtons[0]);

    // Item 10 is escrow, item 1 is clients
    expect(screen.getByText(fp.items.item10.q)).toBeInTheDocument();
    expect(screen.queryByText(fp.items.item1.q)).not.toBeInTheDocument();
  });

  it("filters questions in real-time by search query", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: mockSettings(), isLoading: false });

    renderFaqs();

    const searchInput = screen.getByRole("textbox", { name: fp.hero.searchPlaceholder });
    fireEvent.change(searchInput, { target: { value: "LiveKit" } });

    // Item 4 discusses LiveKit WebRTC
    expect(screen.getByText(fp.items.item4.q)).toBeInTheDocument();
    expect(screen.queryByText(fp.items.item1.q)).not.toBeInTheDocument();
  });

  it("supports Expand All / Collapse All toggle", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: mockSettings(), isLoading: false });

    renderFaqs();

    const expandAllBtn = screen.getByRole("button", { name: /expand all/i });
    expect(expandAllBtn).toBeInTheDocument();

    // Click Expand All
    fireEvent.click(expandAllBtn);

    // Answers should now be visible
    expect(screen.getByText(fp.items.item1.a)).toBeInTheDocument();
    expect(screen.getByText(fp.items.item2.a)).toBeInTheDocument();

    // Click Collapse All
    const collapseAllBtn = screen.getByRole("button", { name: /collapse all/i });
    fireEvent.click(collapseAllBtn);

    // Answers should be hidden
    expect(screen.queryByText(fp.items.item1.a)).not.toBeInTheDocument();
  });

  it("displays live support information from CMS settings without hardcoded placeholders", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: mockSettings({
        supportEmail: "custom-kigali@judicial.gov.rw",
        hotlinePhone: "+250 788 999 888",
        supportWorkingHours: "Mon - Sat 07:00 - 20:00 CAT",
      }),
      isLoading: false,
    });

    renderFaqs();

    // Should render the custom settings email
    expect(screen.getAllByText("custom-kigali@judicial.gov.rw")[0]).toBeInTheDocument();
    expect(screen.getAllByText("+250 788 999 888")[0]).toBeInTheDocument();
    expect(screen.getByText("Mon - Sat 07:00 - 20:00 CAT")).toBeInTheDocument();
  });

  it("copies direct question link to clipboard on 1-click anchor copy button", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    mockUsePlatformSettings.mockReturnValue({ settings: mockSettings(), isLoading: false });

    renderFaqs();

    const copyBtns = screen.getAllByRole("button", { name: /copy link to answer/i });
    fireEvent.click(copyBtns[0]);

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining("#item1"));
    });
  });
});
