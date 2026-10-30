import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

import enMessages from "../../../messages/en.json";
import { PublicContentPageView } from "./public-content-renderer";
import type { ContentPage } from "@/lib/api/content-pages";
import type { PlatformPublicSettings } from "@/features/settings/hooks/useSocialLinks";

// Mock next-intl/server getTranslations
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async ({ namespace }: { namespace: string }) => {
    const keys = namespace.split(".");
    let current: any = enMessages;
    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        current = undefined;
        break;
      }
    }

    return (key: string, values?: Record<string, any>) => {
      const path = key.split(".");
      let val: any = current;
      for (const p of path) {
        if (val && typeof val === "object" && p in val) {
          val = val[p];
        } else {
          val = undefined;
          break;
        }
      }
      if (typeof val !== "string") {
        val = key;
      }
      if (values) {
        for (const [vKey, vVal] of Object.entries(values)) {
          val = val.replace(new RegExp(`\\{${vKey}\\}`, "g"), String(vVal));
        }
      }
      return val;
    };
  }),
}));

import { DEFAULTS } from "@/features/settings/settings";

const mockSettings: PlatformPublicSettings = {
  ...DEFAULTS,
  platformName: "MyJudicial Rwanda",
  supportEmail: "support@myjudicial.com",
  hotlinePhone: "+250 788 312 456",
  whatsappNumber: "+250 788 312 456",
  officeBuilding: "Centenary House, 4th Floor",
  officeStreet: "KN 3 Ave & KN 4 St",
  officeDistrict: "Nyarugenge CBD, Kigali, Rwanda",
  officePoBox: "P.O. Box 2848, Kigali",
  supportWorkingHours: "Monday – Friday: 8:00 AM – 6:00 PM CAT",
  dpoContactEmail: "dpo@myjudicial.com",
  careersEmail: "careers@myjudicial.com",
  careersHiringStatus: "ACTIVELY_HIRING",
  careersOpenRoles: [
    {
      id: "role-1",
      title: "Senior Legal Counsel (Litigation)",
      department: "Legal Affairs",
      location: "Kigali, Rwanda",
      type: "Full-Time",
      applyUrl: "https://myjudicial.com/apply/counsel",
      summary: "Lead complex commercial arbitration and civil litigation.",
      description: "Working closely with verified advocates across the country.",
      responsibilities: ["Lead trial representation", "Draft petitions"],
      requirements: ["Rwanda Bar Association certification", "5+ years experience"],
      published: true,
    },
  ],
  supplementalFaqs: [
    {
      id: "faq-1",
      question: "How does the escrow payment system protect my funds?",
      answer: "Your consultation fee is safely held in escrow until the legal consultation is verified and completed.",
      category: "Payments",
    },
  ],
  socialLinks: {
    x: "https://twitter.com/myjudicial",
    linkedin: "https://linkedin.com/company/myjudicial",
  },
  platformTagline: "Democratizing Access to Justice Across Rwanda",
  copyrightNotice: "© 2026 MyJudicial Ltd. All rights reserved.",
  minAdvanceBookingHours: 2,
  cancellationGraceHours: 24,
};

function createMockPage(overrides: Partial<ContentPage> & { slug: ContentPage["slug"]; title: string }): ContentPage {
  return {
    id: `page-${overrides.slug.toLowerCase()}`,
    locale: "en",
    status: "published",
    effectiveDate: null,
    blocks: [],
    updatedBy: null,
    createdAt: "2026-10-30T00:00:00.000Z",
    updatedAt: "2026-10-30T00:00:00.000Z",
    ...overrides,
  };
}

describe("PublicContentPageView - Content Rendering Pipeline", () => {
  it("renders the fallback component when content is not published yet", async () => {
    const FallbackComponent = () => <div data-testid="legacy-fallback">Legacy Client Fallback Content</div>;

    const rendered = await PublicContentPageView({
      slug: "ABOUT",
      locale: "en",
      content: null,
      settings: mockSettings,
      fallback: <FallbackComponent />,
    });

    render(rendered);
    expect(screen.getByTestId("legacy-fallback")).toBeInTheDocument();
    expect(screen.getByText("Legacy Client Fallback Content")).toBeInTheDocument();
  });

  it("renders a neutral unavailable message if no fallback is provided and page is missing", async () => {
    const rendered = await PublicContentPageView({
      slug: "ABOUT",
      locale: "en",
      content: null,
      settings: mockSettings,
    });

    render(rendered);
    expect(screen.getByText("This page has not been published yet.")).toBeInTheDocument();
  });

  it("renders published ABOUT page with Hero, Prose, Core Values, Milestones, and CTA blocks", async () => {
    const aboutPage = createMockPage({
      slug: "ABOUT",
      title: "About MyJudicial",
      effectiveDate: "30 October 2026",
      blocks: [
        {
          id: "b-hero",
          type: "hero",
          badge: "Our Mission",
          title: "Transforming Legal Access in Rwanda",
          subtitle: "Connecting every citizen with verified legal practitioners.",
          ctaLabel: "Find a Lawyer",
          ctaHref: "/en/search",
        },
        {
          id: "b-prose",
          type: "prose",
          heading: "Our Journey",
          body: "Founded in Kigali, MyJudicial provides an escrow-backed technology bridge.",
        },
        {
          id: "b-values",
          type: "coreValues",
          heading: "Our Guiding Values",
          values: [
            {
              id: "v-1",
              title: "Radical Transparency",
              description: "Clear fixed pricing without surprise legal retainers.",
              icon: "Scale",
            },
            {
              id: "v-2",
              title: "Verified Excellence",
              description: "Every advocate is verified on the Rwanda Bar Roll.",
              icon: "ShieldCheck",
            },
          ],
        },
        {
          id: "b-milestones",
          type: "milestones",
          heading: "Key Milestones",
          items: [
            {
              id: "m-1",
              year: "2025",
              title: "Escrow Integration",
              description: "Dual mobile money escrow protection deployed.",
            },
          ],
        },
        {
          id: "b-stats",
          type: "statsBand",
          heading: "Our Impact",
          stats: [
            { id: "s-1", value: "30", label: "Districts Covered" },
            { id: "s-2", value: "500+", label: "Verified Lawyers" },
          ],
        },
        {
          id: "b-cta",
          type: "ctaBand",
          heading: "Ready to speak with certified counsel?",
          body: "Book your consultation with confidence.",
          ctaLabel: "Get Started Now",
          ctaHref: "/en/search",
        },
      ],
    });

    const rendered = await PublicContentPageView({
      slug: "ABOUT",
      locale: "en",
      content: { page: aboutPage, servedLocale: "en", isFallback: false },
      settings: mockSettings,
    });

    render(rendered);

    // Hero block
    expect(screen.getByText("Our Mission")).toBeInTheDocument();
    expect(screen.getByText("Transforming Legal Access in Rwanda")).toBeInTheDocument();
    expect(screen.getByText("Find a Lawyer")).toBeInTheDocument();

    // Prose block
    expect(screen.getByText("Our Journey")).toBeInTheDocument();
    expect(screen.getByText("Founded in Kigali, MyJudicial provides an escrow-backed technology bridge.")).toBeInTheDocument();

    // Core Values block
    expect(screen.getByText("Our Guiding Values")).toBeInTheDocument();
    expect(screen.getByText("Radical Transparency")).toBeInTheDocument();
    expect(screen.getByText("Verified Excellence")).toBeInTheDocument();

    // Milestones block
    expect(screen.getByText("Key Milestones")).toBeInTheDocument();
    expect(screen.getByText("2025")).toBeInTheDocument();
    expect(screen.getByText("Escrow Integration")).toBeInTheDocument();

    // Stats band
    expect(screen.getByText("Our Impact")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("Districts Covered")).toBeInTheDocument();
    expect(screen.getByText("500+")).toBeInTheDocument();

    // CTA band
    expect(screen.getByText("Ready to speak with certified counsel?")).toBeInTheDocument();
    expect(screen.getByText("Get Started Now")).toBeInTheDocument();
  });

  it("dynamically renders ContactCard block with live data from Settings", async () => {
    const contactPage = createMockPage({
      slug: "CONTACT",
      title: "Contact Us",
      blocks: [
        {
          id: "b-card",
          type: "contactCard",
        },
      ],
    });

    const rendered = await PublicContentPageView({
      slug: "CONTACT",
      locale: "en",
      content: { page: contactPage, servedLocale: "en", isFallback: false },
      settings: mockSettings,
    });

    render(rendered);

    expect(screen.getByText("Contact us")).toBeInTheDocument();
    expect(screen.getByText("support@myjudicial.com")).toBeInTheDocument();
    expect(screen.getAllByText("+250 788 312 456")).toHaveLength(2);
    expect(screen.getByText(/Centenary House, 4th Floor/)).toBeInTheDocument();
    expect(screen.getByText("P.O. Box 2848, Kigali")).toBeInTheDocument();
    expect(screen.getByText("dpo@myjudicial.com")).toBeInTheDocument();
  });

  it("dynamically renders Jobs block with live open positions from Careers Hub", async () => {
    const careersPage = createMockPage({
      slug: "CAREERS",
      title: "Join Our Team",
      blocks: [
        {
          id: "b-jobs",
          type: "jobs",
        },
      ],
    });

    const rendered = await PublicContentPageView({
      slug: "CAREERS",
      locale: "en",
      content: { page: careersPage, servedLocale: "en", isFallback: false },
      settings: mockSettings,
    });

    render(rendered);

    expect(screen.getByText("Open positions")).toBeInTheDocument();
    expect(screen.getByText("Senior Legal Counsel (Litigation)")).toBeInTheDocument();
    expect(screen.getByText(/Legal Affairs · Kigali, Rwanda · Full-Time/)).toBeInTheDocument();
    expect(screen.getByText("Lead complex commercial arbitration and civil litigation.")).toBeInTheDocument();
    expect(screen.getByText("Rwanda Bar Association certification")).toBeInTheDocument();
    expect(screen.getByText("Apply")).toHaveAttribute("href", "https://myjudicial.com/apply/counsel");
  });

  it("dynamically renders FAQ block with live supplemental FAQs", async () => {
    const helpPage = createMockPage({
      slug: "HELP",
      title: "Help & FAQ",
      blocks: [
        {
          id: "b-faq",
          type: "faq",
        },
      ],
    });

    const rendered = await PublicContentPageView({
      slug: "HELP",
      locale: "en",
      content: { page: helpPage, servedLocale: "en", isFallback: false },
      settings: mockSettings,
    });

    render(rendered);

    expect(screen.getByText("Frequently asked questions")).toBeInTheDocument();
    expect(screen.getByText("How does the escrow payment system protect my funds?")).toBeInTheDocument();
    expect(screen.getByText(/Your consultation fee is safely held in escrow/)).toBeInTheDocument();
  });

  it("displays the translation-pending banner when serving English fallback to French or Kinyarwanda visitors", async () => {
    const frenchRequestedPage = createMockPage({
      slug: "ABOUT",
      title: "About MyJudicial",
      blocks: [
        {
          id: "b-1",
          type: "prose",
          heading: "Our Vision",
          body: "Universal access to justice across Rwanda.",
        },
      ],
    });

    const rendered = await PublicContentPageView({
      slug: "ABOUT",
      locale: "fr",
      content: { page: frenchRequestedPage, servedLocale: "en", isFallback: true },
      settings: mockSettings,
    });

    render(rendered);

    // Verify translation notice is shown
    expect(
      screen.getByText(
        "This page is currently available in English only. The French and Kinyarwanda versions will be published soon."
      )
    ).toBeInTheDocument();
  });

  it("displays the preview mode banner when isPreview is true", async () => {
    const draftPage = createMockPage({
      slug: "ABOUT",
      title: "About MyJudicial Draft",
      status: "draft",
      blocks: [
        {
          id: "b-draft",
          type: "prose",
          body: "This is unpublished draft copy.",
        },
      ],
    });

    const rendered = await PublicContentPageView({
      slug: "ABOUT",
      locale: "en",
      content: { page: draftPage, servedLocale: "en", isFallback: false },
      settings: mockSettings,
      isPreview: true,
    });

    render(rendered);

    expect(
      screen.getByText("Preview of the saved '{slug}' draft. Save again to update it.")
    ).toBeInTheDocument();
    expect(screen.getByText("This is unpublished draft copy.")).toBeInTheDocument();
  });
});
