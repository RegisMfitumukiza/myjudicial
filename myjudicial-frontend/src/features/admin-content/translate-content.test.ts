import { describe, expect, it, vi } from "vitest";
import { translatePageBlocksWithAi, type TranslatablePageData } from "./translate-content";

// Mock the AI translateBatch API
vi.mock("@/lib/api/ai", () => ({
  translateBatch: vi.fn(async (texts: string[], _source: string, target: string) => {
    return texts.map((t) => `[${target.toUpperCase()}] ${t}`);
  }),
}));

describe("translatePageBlocksWithAi", () => {
  it("returns an exact clone if source and target locales are identical", async () => {
    const page: TranslatablePageData = {
      title: "About Us",
      blocks: [{ id: "b1", type: "prose", heading: "Our Mission", body: "To deliver justice." }],
    };

    const result = await translatePageBlocksWithAi(page, "en", "en");
    expect(result).toEqual(page);
    expect(result).not.toBe(page); // Must be a clone
  });

  it("translates title, meta, prose, bullets, tables, and coreValues into target locale", async () => {
    const page: TranslatablePageData = {
      title: "Terms of Service",
      metaTitle: "Read our Terms",
      metaDescription: "Governing terms for Rwanda law.",
      blocks: [
        { id: "b1", type: "prose", heading: "Preamble", body: "Welcome to MyJudicial." },
        { id: "b2", type: "bullets", heading: "Rules", items: ["Be truthful", "Respect timelines"] },
        {
          id: "b3",
          type: "table",
          heading: "Fees",
          columns: ["Plan", "Cost"],
          rows: [["Basic", "Free"], ["Pro", "200 RWF"]],
        },
        {
          id: "b4",
          type: "coreValues",
          values: [
            { id: "v1", title: "Integrity", description: "Honest legal service", icon: "Scale" },
          ],
        },
        {
          id: "b5",
          type: "hero",
          title: "Join our Mission",
          subtitle: "Empowering Rwanda",
          ctaLabel: "Apply Now",
          ctaHref: "/careers",
        },
      ],
    };

    const translated = await translatePageBlocksWithAi(page, "en", "fr");

    expect(translated.title).toBe("[FR] Terms of Service");
    expect(translated.metaTitle).toBe("[FR] Read our Terms");
    expect(translated.metaDescription).toBe("[FR] Governing terms for Rwanda law.");

    const prose = translated.blocks[0] as { heading?: string; body: string };
    expect(prose.heading).toBe("[FR] Preamble");
    expect(prose.body).toBe("[FR] Welcome to MyJudicial.");

    const bullets = translated.blocks[1] as { heading?: string; items: string[] };
    expect(bullets.heading).toBe("[FR] Rules");
    expect(bullets.items).toEqual(["[FR] Be truthful", "[FR] Respect timelines"]);

    const table = translated.blocks[2] as { columns: string[]; rows: string[][] };
    expect(table.columns).toEqual(["[FR] Plan", "[FR] Cost"]);
    expect(table.rows).toEqual([["[FR] Basic", "[FR] Free"], ["[FR] Pro", "[FR] 200 RWF"]]);

    const coreValues = translated.blocks[3] as { values: { title: string; description: string; icon: string }[] };
    expect(coreValues.values[0].title).toBe("[FR] Integrity");
    expect(coreValues.values[0].description).toBe("[FR] Honest legal service");
    expect(coreValues.values[0].icon).toBe("Scale"); // Structural icon preserved

    const hero = translated.blocks[4] as { title: string; subtitle?: string; ctaLabel?: string; ctaHref?: string };
    expect(hero.title).toBe("[FR] Join our Mission");
    expect(hero.subtitle).toBe("[FR] Empowering Rwanda");
    expect(hero.ctaLabel).toBe("[FR] Apply Now");
    expect(hero.ctaHref).toBe("/careers"); // Structural href preserved
  });
});
