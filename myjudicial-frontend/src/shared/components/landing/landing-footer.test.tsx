import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { IntlProvider } from "@/i18n/intl-provider";
import enMessages from "../../../../messages/en.json";
import frMessages from "../../../../messages/fr.json";
import rwMessages from "../../../../messages/rw.json";
import { DEFAULTS } from "@/features/settings/settings";

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const mockUsePlatformSettings = vi.fn();
vi.mock("@/features/settings/hooks/useSocialLinks", () => ({
  usePlatformSettings: () => mockUsePlatformSettings(),
}));

import LandingFooter from "./landing-footer";

describe("LandingFooter Localization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders English tagline and disclaimer on English pages with default settings", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: { ...DEFAULTS },
      isLoading: false,
    });

    render(
      <IntlProvider locale="en" messages={enMessages as any}>
        <LandingFooter />
      </IntlProvider>
    );

    expect(screen.getByText(DEFAULTS.platformTagline)).toBeInTheDocument();
    expect(screen.getByText(DEFAULTS.legalDisclaimer)).toBeInTheDocument();
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
  });

  it("falls back to French tagline, disclaimer, and copyright on French pages when settings hold English defaults", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: { ...DEFAULTS },
      isLoading: false,
    });

    render(
      <IntlProvider locale="fr" messages={frMessages as any}>
        <LandingFooter />
      </IntlProvider>
    );

    // Should display French translations rather than the default English strings
    expect(screen.getByText(frMessages.landing.footer.tagline)).toBeInTheDocument();
    expect(screen.getByText(frMessages.landing.footer.disclaimer)).toBeInTheDocument();
    expect(screen.getByText(/Tous droits réservés/i)).toBeInTheDocument();
  });

  it("falls back to Kinyarwanda tagline, disclaimer, and copyright on Kinyarwanda pages", () => {
    mockUsePlatformSettings.mockReturnValue({
      settings: { ...DEFAULTS },
      isLoading: false,
    });

    render(
      <IntlProvider locale="rw" messages={rwMessages as any}>
        <LandingFooter />
      </IntlProvider>
    );

    expect(screen.getByText(rwMessages.landing.footer.tagline)).toBeInTheDocument();
    expect(screen.getByText(rwMessages.landing.footer.disclaimer)).toBeInTheDocument();
    expect(screen.getByText(/Uburenganzira bwose bwubahirizwa/i)).toBeInTheDocument();
  });
});
