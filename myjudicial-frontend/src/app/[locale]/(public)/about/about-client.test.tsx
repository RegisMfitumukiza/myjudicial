import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { IntlProvider } from "@/i18n/intl-provider";
import enMessages from "../../../../../messages/en.json";

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

const mockUsePublicStats = vi.fn();
vi.mock("@/lib/api/landing", () => ({
  usePublicStats: () => mockUsePublicStats(),
}));

import AboutClient from "./about-client";

const messages = enMessages as never;
const aboutMessages = enMessages.about;

const mockSettings = (over: Record<string, unknown> = {}) => ({
  aboutHeroBadge: "",
  aboutHeroTitle: "",
  aboutHeroSubtitle: "",
  aboutMission: "",
  aboutVision: "",
  aboutStory: "",
  aboutCoreValues: [],
  aboutMilestones: [],
  ...over,
});

const renderAbout = () =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <AboutClient />
    </IntlProvider>
  );

beforeEach(() => {
  mockUsePlatformSettings.mockReset();
  mockUsePublicStats.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AboutClient — Public About Page", () => {
  it("renders default hero headings, stats, and operational trust pillars", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: mockSettings(), isLoading: false });
    mockUsePublicStats.mockReturnValue({
      data: { verifiedExperts: 45, completedConsultations: 120 },
      isLoading: false,
    });

    renderAbout();

    expect(screen.getByText(aboutMessages.hero.badge)).toBeInTheDocument();
    expect(screen.getByText(aboutMessages.hero.title)).toBeInTheDocument();
    expect(screen.getByText(aboutMessages.hero.subtitle)).toBeInTheDocument();
    expect(screen.getByText(/45\+.*Verified Advocates/i)).toBeInTheDocument();
    expect(screen.getByText(/120\+.*Completed Consultations/i)).toBeInTheDocument();
    expect(screen.getByText(aboutMessages.hero.stats.escrowProtected)).toBeInTheDocument();
    expect(screen.getByText(aboutMessages.hero.stats.nationwide)).toBeInTheDocument();
  });

  it("shows graceful trust pillar fallbacks instead of broken dashes when live stats are unavailable", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: mockSettings(), isLoading: false });
    mockUsePublicStats.mockReturnValue({ data: null, isLoading: false });

    renderAbout();

    expect(screen.getByText(aboutMessages.hero.stats.barCertified)).toBeInTheDocument();
    expect(screen.getByText(aboutMessages.hero.stats.verifiedConsultations)).toBeInTheDocument();
  });

  it("renders custom CMS hero titles and mission overrides", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: mockSettings({
        aboutHeroBadge: "Custom Badge",
        aboutHeroTitle: "Custom Legal Infrastructure",
        aboutHeroSubtitle: "Custom Subtitle for Rwanda",
        aboutMission: "Custom mission paragraph 1.\n\nCustom mission paragraph 2.",
      }),
      isLoading: false,
    });
    mockUsePublicStats.mockReturnValue({ data: null, isLoading: false });

    renderAbout();

    expect(screen.getByText("Custom Badge")).toBeInTheDocument();
    expect(screen.getByText("Custom Legal Infrastructure")).toBeInTheDocument();
    expect(screen.getByText("Custom Subtitle for Rwanda")).toBeInTheDocument();
    expect(screen.getByText("Custom mission paragraph 1.")).toBeInTheDocument();
    expect(screen.getByText("Custom mission paragraph 2.")).toBeInTheDocument();
  });

  it("renders all 4 verification protocol stages", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: mockSettings(), isLoading: false });
    mockUsePublicStats.mockReturnValue({ data: null, isLoading: false });

    renderAbout();

    expect(screen.getByText(aboutMessages.verification.title)).toBeInTheDocument();
    expect(screen.getByText(aboutMessages.verification.stage1Title)).toBeInTheDocument();
    expect(screen.getByText(aboutMessages.verification.stage2Title)).toBeInTheDocument();
    expect(screen.getByText(aboutMessages.verification.stage3Title)).toBeInTheDocument();
    expect(screen.getByText(aboutMessages.verification.stage4Title)).toBeInTheDocument();
  });

  it("renders the institutional ecosystem section with partner link", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: mockSettings(), isLoading: false });
    mockUsePublicStats.mockReturnValue({ data: null, isLoading: false });

    renderAbout();

    expect(screen.getByText(aboutMessages.ecosystem.title)).toBeInTheDocument();
    expect(screen.getByText(aboutMessages.ecosystem.legal.title)).toBeInTheDocument();
    expect(screen.getByText(aboutMessages.ecosystem.financial.title)).toBeInTheDocument();
    expect(screen.getByText(aboutMessages.ecosystem.regulatory.title)).toBeInTheDocument();

    const partnerLink = screen.getByRole("link", { name: new RegExp(aboutMessages.ecosystem.partnerAction, "i") });
    expect(partnerLink).toHaveAttribute("href", "/contact?type=institutional");
  });

  it("does not render redundant footer-competing CTA or duplicate disclaimer band", () => {
    mockUsePlatformSettings.mockReturnValue({ settings: mockSettings(), isLoading: false });
    mockUsePublicStats.mockReturnValue({ data: null, isLoading: false });

    renderAbout();

    // The redundant "Ready to get started?" CTA and duplicate disclaimer band should NOT exist
    expect(screen.queryByText(aboutMessages.cta.title)).not.toBeInTheDocument();
    expect(screen.queryByText(aboutMessages.disclaimer.text)).not.toBeInTheDocument();
  });
});
