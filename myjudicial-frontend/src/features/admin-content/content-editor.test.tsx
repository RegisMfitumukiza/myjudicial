import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { IntlProvider } from "@/i18n/intl-provider";
import enMessages from "../../../messages/en.json";
import {
  type ContentBlock,
  type ContentPage,
} from "@/lib/api/content-pages";

/*
 * The editor talks to the API through `@/lib/api/content-pages`, which is
 * mocked here. The UI components are real, so these tests exercise the actual
 * interaction flow (tabs, blocks, save/publish/copy/delete), not a stooge.
 */
vi.mock("@/lib/api/content-pages", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/content-pages")>(
    "@/lib/api/content-pages"
  );
  return {
    ...actual,
    fetchContentSchema: vi.fn(),
    fetchAdminContentPages: vi.fn(),
    saveContentPage: vi.fn(),
    copyContentPage: vi.fn(),
    deleteContentPage: vi.fn(),
    fetchContentPageRevisions: vi.fn(),
    restoreContentPageRevision: vi.fn(),
  };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

import * as contentApi from "@/lib/api/content-pages";
import { toast } from "sonner";
import { ContentEditor } from "./content-editor";

const api = vi.mocked(contentApi);

const messages = enMessages as never;
const cp = enMessages.adminContent;

const SCHEMA = {
  slugs: ["ABOUT", "CAREERS", "HELP", "CONTACT", "PRIVACY", "TERMS", "COOKIES"],
  locales: ["en", "fr", "rw"],
  allowedBlocks: {
    ABOUT: ["prose", "bullets", "steps", "callout", "table", "coreValues", "milestones", "hero", "statsBand", "ctaBand", "image"],
    CAREERS: ["prose", "bullets", "callout", "jobs", "hero", "statsBand", "ctaBand", "image"],
    HELP: ["prose", "bullets", "steps", "callout", "faq"],
    CONTACT: ["prose", "callout", "contactCard", "hero", "image"],
    PRIVACY: ["prose", "bullets", "steps", "callout", "table"],
    TERMS: ["prose", "bullets", "steps", "callout", "table"],
    COOKIES: ["prose", "bullets", "table", "callout"],
  },
};

const proseBlock = (over: Partial<Extract<ContentBlock, { type: "prose" }>> = {}): ContentBlock => ({
  id: "b1",
  type: "prose",
  heading: "What we collect",
  body: "Only what you give us.",
  ...over,
});

const existingEnPage: ContentPage = {
  id: "p1",
  slug: "PRIVACY",
  locale: "en",
  title: "Privacy Policy",
  blocks: [proseBlock()],
  status: "draft",
  effectiveDate: null,
  updatedBy: null,
  createdAt: "2026-09-28T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
};

const setupApi = (pages: ContentPage[] = []) => {
  api.fetchContentSchema.mockResolvedValue(SCHEMA as never);
  api.fetchAdminContentPages.mockResolvedValue(pages);
  api.saveContentPage.mockImplementation(async (input) => ({
    id: "p_new",
    slug: input.slug,
    locale: input.locale,
    title: input.title,
    blocks: input.blocks,
    status: input.status,
    effectiveDate: input.effectiveDate ?? null,
    updatedBy: null,
    createdAt: "2026-09-28T00:00:00.000Z",
    updatedAt: new Date().toISOString(),
  }));
  api.copyContentPage.mockImplementation(async (slug, _from, toLocale) => ({
    id: "p_copy",
    slug,
    locale: toLocale,
    title: "Privacy Policy (copied)",
    blocks: [proseBlock()],
    status: "draft",
    effectiveDate: null,
    updatedBy: null,
    createdAt: "2026-09-28T00:00:00.000Z",
    updatedAt: "2026-09-28T00:00:00.000Z",
  }));
  api.deleteContentPage.mockResolvedValue(true);
};

const renderEditor = () =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <ContentEditor />
    </IntlProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  setupApi();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  // Radix Select scrolls its highlighted option into view; jsdom does not
  // implement scrollIntoView.
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ContentEditor — navigation", () => {
  it(
    "renders all seven page tabs and the three locale tabs",
    async () => {
      renderEditor();
      expect(await screen.findByRole("button", { name: cp.page_privacy })).toBeInTheDocument();
      for (const label of [cp.page_about, cp.page_careers, cp.page_help, cp.page_contact, cp.page_terms, cp.page_cookies]) {
        expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
      }
      expect(screen.getByRole("button", { name: "EN" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "FR" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "RW" })).toBeInTheDocument();
    },
    20000
  );
});

describe("ContentEditor — empty page", () => {
  it("shows the never-written state and disables save until content exists", async () => {
    renderEditor();
    expect(await screen.findByText(cp.neverWrittenTitle)).toBeInTheDocument();
    expect(screen.getByText(cp.noBlocks)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: cp.saveDraft })).toBeDisabled();
  });

  it("requires a title before saving", async () => {
    renderEditor();
    await screen.findByText(cp.neverWrittenTitle);
    const addButton = screen.getByRole("button", { name: cp.addBlock });
    fireEvent.click(addButton);
    fireEvent.click(screen.getByRole("button", { name: cp.saveDraft }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(cp.titleRequired));
    expect(api.saveContentPage).not.toHaveBeenCalled();
  });
});

describe("ContentEditor — editing and saving", () => {
  it("renders existing blocks and can save a draft", async () => {
    renderEditorTo(existingEnPage);

    const bodyInput = (await screen.findByDisplayValue("Only what you give us.")) as HTMLInputElement;
    expect(bodyInput).toBeInTheDocument();
    // Unchanged from the loaded row, so Save is disabled.
    expect(screen.getByRole("button", { name: cp.saveDraft })).toBeDisabled();

    fireEvent.change(bodyInput, { target: { value: "Only what you choose to give us." } });
    expect(screen.getByRole("button", { name: cp.saveDraft })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: cp.saveDraft }));
    await waitFor(() => expect(api.saveContentPage).toHaveBeenCalledTimes(1));
    const saved = api.saveContentPage.mock.calls[0][0];
    expect(saved.status).toBe("draft");
    expect(saved.title).toBe("Privacy Policy");
    expect((saved.blocks[0] as Extract<ContentBlock, { type: "prose" }>).body).toBe(
      "Only what you choose to give us."
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(cp.draftToast));
  });

  it("publishes when the publish button is pressed", async () => {
    renderEditorTo(existingEnPage);
    await screen.findByDisplayValue("What we collect");

    fireEvent.click(screen.getByRole("button", { name: cp.publish }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: cp.publish }));
    await waitFor(() => expect(api.saveContentPage).toHaveBeenCalledTimes(1));
    expect(api.saveContentPage.mock.calls[0][0].status).toBe("published");
  });

  it("lists revision history and restores a snapshot", async () => {
    const revision = {
      id: "r1",
      pageId: "p1",
      title: "Privacy Policy",
      blocks: [],
      status: "published" as const,
      effectiveDate: null,
      metaTitle: null,
      metaDescription: null,
      openGraphImage: null,
      changeType: "PUBLISH" as const,
      authorEmail: "admin@myjudicial.com",
      createdAt: "2026-09-28T10:00:00.000Z",
    };
    api.fetchContentPageRevisions.mockResolvedValue([revision]);
    api.restoreContentPageRevision.mockResolvedValue(existingEnPage);

    renderEditorTo(existingEnPage);
    await screen.findByDisplayValue("Only what you give us.");

    fireEvent.click(screen.getByRole("button", { name: cp.refresh }));
    await screen.findByText(cp.change_publish);
    expect(api.fetchContentPageRevisions).toHaveBeenCalledWith("PRIVACY", "en");

    fireEvent.click(screen.getByRole("button", { name: cp.restore }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: cp.restore }));

    await waitFor(() =>
      expect(api.restoreContentPageRevision).toHaveBeenCalledWith("PRIVACY", "en", "r1")
    );
    await waitFor(() => expect(api.fetchContentPageRevisions).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(cp.restoreToast));
  });

  it("can add, edit and reorder blocks", async () => {
    renderEditor();
    await screen.findByText(cp.neverWrittenTitle);

    // Add the default prose block and give it a body.
    fireEvent.click(screen.getByRole("button", { name: cp.addBlock }));
    // queryAllByText returns [] once a block exists (the get* variant throws
    // on zero results, which would flake this wait).
    await waitFor(() => expect(screen.queryAllByText(cp.noBlocks)).toHaveLength(0));
    const proseBody = screen.getByRole("textbox", { name: cp.body }) as HTMLTextAreaElement;
    fireEvent.change(proseBody, { target: { value: "Intro paragraph." } });

    // Pick "Bullet list" in the block-type menu and add one.
    fireEvent.click(screen.getByRole("combobox"));
    const bulletOption = await screen.findByRole("option", { name: cp.block_bullets });
    fireEvent.click(bulletOption);
    fireEvent.click(screen.getByRole("button", { name: cp.addBlock }));

    // The new bullet block has one labelled item textbox.
    const itemInput = (await screen.findByRole("textbox", { name: `${cp.items} 1` })) as HTMLInputElement;
    fireEvent.change(itemInput, { target: { value: "First item" } });

    // Title the page and save — both the prose and the bullet list persist.
    fireEvent.change(screen.getByLabelText(cp.pageTitle), { target: { value: "Privacy Policy" } });
    fireEvent.click(screen.getByRole("button", { name: cp.saveDraft }));
    await waitFor(() => expect(api.saveContentPage).toHaveBeenCalledTimes(1));
    const blocks = api.saveContentPage.mock.calls[0][0].blocks as ContentBlock[];
    expect(blocks.length).toBe(2);
    expect(blocks.map((b) => b.type)).toContain("prose");
    expect(blocks.map((b) => b.type)).toContain("bullets");
  });
});

describe("ContentEditor — per-page allowed blocks", () => {
  it("limits the add-block menu to types allowed for the selected page", async () => {
    renderEditor();
    await screen.findByText(cp.neverWrittenTitle);

    fireEvent.click(screen.getByRole("button", { name: cp.page_cookies }));
    await screen.findByText(cp.neverWrittenTitle);

    // COOKIES allows prose/bullets/table/callout but not jobs/faq/contactCard.
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    // Radix Select options render in a portal; find them by role.
    const options = await waitFor(() => screen.getAllByRole("option"));
    const labels = options.map((o) => o.textContent);
    for (const blocked of [cp.block_jobs, cp.block_faq, cp.block_contactCard]) {
      expect(labels).not.toContain(blocked);
    }
  });

  it(
    "lets ABOUT pages build coreValues and milestones blocks and saves them",
    async () => {
      renderEditor();
      await screen.findByText(cp.neverWrittenTitle);

    fireEvent.click(screen.getByRole("button", { name: cp.page_about }));
    await screen.findByText(cp.neverWrittenTitle);

    // ABOUT allows the new block types.
    fireEvent.click(screen.getByRole("combobox"));
    const menu = await waitFor(() => screen.getAllByRole("option"));
    const labels = menu.map((o) => o.textContent);
    expect(labels).toContain(cp.block_coreValues);
    expect(labels).toContain(cp.block_milestones);

    // Add a core values block with two values.
    fireEvent.click(await screen.findByRole("option", { name: cp.block_coreValues }));
    fireEvent.click(screen.getByRole("button", { name: cp.addBlock }));

    fireEvent.change(await screen.findByRole("textbox", { name: `${cp.valueTitle} 1` }), {
      target: { value: "Justice" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: `${cp.valueDescription} 1` }), {
      target: { value: "Fair and equal access to legal help." },
    });

    fireEvent.click(screen.getByRole("button", { name: cp.addValue }));
    fireEvent.change(await screen.findByRole("textbox", { name: `${cp.valueTitle} 2` }), {
      target: { value: "Integrity" },
    });

    // Add a milestones block with one entry.
    // The block-type picker is the only combobox without an aria-label; the
    // core-values icon pickers are labelled "Icon N".
    const typeSelect = screen.getAllByRole("combobox").find((el) => !el.getAttribute("aria-label"));
    expect(typeSelect).toBeTruthy();
    fireEvent.click(typeSelect as HTMLElement);
    fireEvent.click(await screen.findByRole("option", { name: cp.block_milestones }));
    fireEvent.click(screen.getByRole("button", { name: cp.addBlock }));

    // The milestone title/description labels collide with the core-values
    // ones ("Title 1", "Description 1"); the milestones block renders after
    // coreValues, so take the last match. The year label is unique.
    fireEvent.change(await screen.findByRole("textbox", { name: `${cp.milestoneYear} 1` }), {
      target: { value: "2024" },
    });
    const titleBoxes = screen.getAllByRole("textbox", { name: `${cp.milestoneTitle} 1` });
    fireEvent.change(titleBoxes[titleBoxes.length - 1], {
      target: { value: "Launched the platform" },
    });

    fireEvent.change(screen.getByLabelText(cp.pageTitle), { target: { value: "About us" } });
    fireEvent.click(screen.getByRole("button", { name: cp.saveDraft }));
    await waitFor(() => expect(api.saveContentPage).toHaveBeenCalledTimes(1));
    const blocks = api.saveContentPage.mock.calls[0][0].blocks as ContentBlock[];

    const core = blocks.find((b) => b.type === "coreValues") as Extract<ContentBlock, { type: "coreValues" }>;
    expect(core).toBeDefined();
    expect(core.values).toHaveLength(2);

    const milestones = blocks.find((b) => b.type === "milestones") as Extract<ContentBlock, { type: "milestones" }>;
    expect(milestones).toBeDefined();
    expect(milestones.items).toHaveLength(1);
    expect(milestones.items[0].year).toBe("2024");
  },
    20000
  );

  it("lets ABOUT pages author statsBand and ctaBand blocks and saves them", async () => {
    renderEditor();
    await screen.findByText(cp.neverWrittenTitle);

    fireEvent.click(screen.getByRole("button", { name: cp.page_about }));
    await screen.findByText(cp.neverWrittenTitle);

    const typeSelect = () =>
      screen.getAllByRole("combobox").find((el) => !el.getAttribute("aria-label")) as HTMLElement;

    // Add a stats band with one statistic.
    fireEvent.click(typeSelect());
    fireEvent.click(await screen.findByRole("option", { name: cp.block_statsBand }));
    fireEvent.click(screen.getByRole("button", { name: cp.addBlock }));

    fireEvent.change(await screen.findByRole("textbox", { name: `${cp.statValue} 1` }), {
      target: { value: "30s" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: `${cp.statLabel} 1` }), {
      target: { value: "Response time" },
    });

    // Add a CTA band and give it a link.
    fireEvent.click(typeSelect());
    fireEvent.click(await screen.findByRole("option", { name: cp.block_ctaBand }));
    fireEvent.click(screen.getByRole("button", { name: cp.addBlock }));

    fireEvent.change(await screen.findByRole("textbox", { name: cp.ctaLabel }), {
      target: { value: "Browse lawyers" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: cp.ctaHref }), {
      target: { value: "/en/search" },
    });

    fireEvent.change(screen.getByLabelText(cp.pageTitle), { target: { value: "About us" } });
    fireEvent.click(screen.getByRole("button", { name: cp.saveDraft }));
    await waitFor(() => expect(api.saveContentPage).toHaveBeenCalledTimes(1));
    const blocks = api.saveContentPage.mock.calls[0][0].blocks as ContentBlock[];

    const stats = blocks.find((b) => b.type === "statsBand") as Extract<ContentBlock, { type: "statsBand" }>;
    expect(stats).toBeDefined();
    expect(stats.stats).toHaveLength(1);
    expect(stats.stats[0].value).toBe("30s");
    expect(stats.stats[0].label).toBe("Response time");

    const band = blocks.find((b) => b.type === "ctaBand") as Extract<ContentBlock, { type: "ctaBand" }>;
    expect(band).toBeDefined();
    expect(band.ctaLabel).toBe("Browse lawyers");
    expect(band.ctaHref).toBe("/en/search");
  }, 20000);
});

describe("ContentEditor — copy from English and delete", () => {
  it("only offers copy-from-English on fr/rw, and the copy lands as a draft", async () => {
    renderEditorTo(existingEnPage);
    await screen.findByDisplayValue("What we collect");

    expect(screen.queryByRole("button", { name: cp.copyFromEnglish })).not.toBeInTheDocument();
    const copy = screen.queryByRole("button", { name: cp.copyFromEnglish });
    expect(copy).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "FR" }));
    await screen.findByText(cp.neverWrittenTitle);
    fireEvent.click(screen.getByRole("button", { name: cp.copyFromEnglish }));

    await waitFor(() => expect(api.copyContentPage).toHaveBeenCalledWith("PRIVACY", "en", "fr"));
    expect(await screen.findByDisplayValue("Privacy Policy (copied)")).toBeInTheDocument();
  });

  it("deletes the page after confirmation", async () => {
    renderEditorTo(existingEnPage);
    await screen.findByDisplayValue("What we collect");

    fireEvent.click(screen.getByRole("button", { name: cp.deletePage }));
    await waitFor(() => expect(api.deleteContentPage).toHaveBeenCalledWith("PRIVACY", "en"));
    expect(await screen.findByText(cp.neverWrittenTitle)).toBeInTheDocument();
  });
});

/** Renders the editor pre-seeded with the given page rows. */
function renderEditorTo(...pages: ContentPage[]) {
  setupApi(pages);
  return renderEditor();
}