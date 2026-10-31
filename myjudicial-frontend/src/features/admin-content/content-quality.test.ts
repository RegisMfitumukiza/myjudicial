import { describe, it, expect } from "vitest";
import { auditContentPage, type AuditablePageDraft } from "./content-quality";
import type { ContentPage } from "@/lib/api/content-pages";

describe("auditContentPage", () => {
  const perfectDraft: AuditablePageDraft = {
    title: "About Our Platform",
    metaTitle: "About MyJudicial | Rwanda's Verified Legal Marketplace",
    metaDescription:
      "Learn about MyJudicial, the premier legal portal connecting verified advocates and legal clients across Rwanda.",
    openGraphImage: "https://myjudicial.com/og_about.png",
    blocks: [
      {
        id: "b1",
        type: "hero",
        title: "Democratizing Access to Justice",
        ctaLabel: "Find Advocates",
        ctaHref: "/find-lawyers",
      },
      {
        id: "b2",
        type: "prose",
        heading: "Our Mission",
        body: "We provide seamless access to verified legal counsel with transparent pricing and escrow-backed payments.",
      },
      {
        id: "b3",
        type: "image",
        src: "https://myjudicial.com/team.jpg",
        alt: "MyJudicial leadership team in Kigali",
      },
    ],
  };

  it("scores 100 and passes when page has no issues", () => {
    const report = auditContentPage(perfectDraft);
    expect(report.status).toBe("passed");
    expect(report.score).toBe(100);
    expect(report.criticalCount).toBe(0);
    expect(report.warningCount).toBe(0);
  });

  it("flags critical error for empty page title", () => {
    const report = auditContentPage({ ...perfectDraft, title: "" });
    expect(report.status).toBe("error");
    expect(report.criticalCount).toBeGreaterThanOrEqual(1);
    expect(report.issues.some((i) => i.id === "seo-missing-page-title")).toBe(true);
  });

  it("flags critical error for hero CTA button without href", () => {
    const draftWithBrokenCta: AuditablePageDraft = {
      ...perfectDraft,
      blocks: [
        {
          id: "hero1",
          type: "hero",
          title: "Headline",
          ctaLabel: "Click Here",
          ctaHref: "", // Missing link!
        },
      ],
    };
    const report = auditContentPage(draftWithBrokenCta);
    expect(report.status).toBe("error");
    expect(report.issues.some((i) => i.id === "link-hero-missing-href-hero1")).toBe(true);
  });

  it("flags critical error for empty prose block", () => {
    const draftWithEmptyProse: AuditablePageDraft = {
      ...perfectDraft,
      blocks: [
        {
          id: "p1",
          type: "prose",
          heading: "Empty Section",
          body: "   ",
        },
      ],
    };
    const report = auditContentPage(draftWithEmptyProse);
    expect(report.status).toBe("error");
    expect(report.issues.some((i) => i.id === "validity-prose-empty-p1")).toBe(true);
  });

  it("flags warning for missing alt text and missing OG image", () => {
    const draftWithA11yIssue: AuditablePageDraft = {
      ...perfectDraft,
      openGraphImage: "",
      blocks: [
        {
          id: "img1",
          type: "image",
          src: "https://myjudicial.com/photo.jpg",
          alt: "", // Missing alt!
        },
      ],
    };
    const report = auditContentPage(draftWithA11yIssue);
    expect(report.status).toBe("warning");
    expect(report.issues.some((i) => i.id === "seo-missing-og-image")).toBe(true);
    expect(report.issues.some((i) => i.id === "image-missing-alt-img1")).toBe(true);
  });

  it("detects placeholder tokens like [TODO] and lorem ipsum", () => {
    const draftWithPlaceholder: AuditablePageDraft = {
      ...perfectDraft,
      blocks: [
        {
          id: "p1",
          type: "prose",
          heading: "Legal Terms [TODO]",
          body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        },
      ],
    };
    const report = auditContentPage(draftWithPlaceholder);
    expect(report.issues.some((i) => i.id.includes("placeholder"))).toBe(true);
  });

  it("flags translation parity issues when localized draft has fewer sections than English", () => {
    const enPage: ContentPage = {
      id: "en_page",
      slug: "ABOUT",
      locale: "en",
      title: "About Us",
      blocks: [
        { id: "1", type: "hero", title: "Hero" },
        { id: "2", type: "prose", body: "Content 1" },
        { id: "3", type: "prose", body: "Content 2" },
      ],
      status: "published",
      effectiveDate: null,
      updatedBy: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const frenchDraft: AuditablePageDraft = {
      title: "About Us", // Untranslated title
      blocks: [
        { id: "1", type: "hero", title: "Hero" }, // Missing 2 blocks!
      ],
    };

    const report = auditContentPage(frenchDraft, enPage, "fr");
    expect(report.issues.some((i) => i.id === "translation-missing-sections")).toBe(true);
    expect(report.issues.some((i) => i.id === "translation-title-untranslated")).toBe(true);
  });
});
