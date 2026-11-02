import { translateBatch } from "@/lib/api/ai";
import type { ContentBlock, ContentLocale } from "@/lib/api/content-pages";

export interface TranslatablePageData {
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  blocks: ContentBlock[];
}

interface Slot {
  text: string;
  assign: (translated: string) => void;
}

/**
 * Deep-translates all human-readable copy from a page draft using AI.
 * Preserves all structural metadata, block IDs, styling attributes, URLs, and table dimensions.
 */
export async function translatePageBlocksWithAi<T extends TranslatablePageData>(
  source: T,
  sourceLocale: ContentLocale,
  targetLocale: ContentLocale
): Promise<T> {
  if (sourceLocale === targetLocale) {
    return JSON.parse(JSON.stringify(source)) as T;
  }

  const cloned = JSON.parse(JSON.stringify(source)) as T;
  const slots: Slot[] = [];

  const addSlot = (text: string | undefined, assign: (v: string) => void) => {
    if (text && text.trim().length > 0) {
      slots.push({ text, assign });
    }
  };

  addSlot(cloned.title, (v) => {
    cloned.title = v;
  });

  addSlot(cloned.metaTitle, (v) => {
    cloned.metaTitle = v;
  });

  addSlot(cloned.metaDescription, (v) => {
    cloned.metaDescription = v;
  });

  for (const block of cloned.blocks) {
    // Translate optional heading common to many block types
    if ("heading" in block && typeof block.heading === "string") {
      addSlot(block.heading, (v) => {
        (block as { heading?: string }).heading = v;
      });
    }

    switch (block.type) {
      case "prose":
      case "callout":
        addSlot(block.body, (v) => {
          block.body = v;
        });
        break;

      case "bullets":
      case "steps":
        block.items.forEach((item, index) => {
          addSlot(item, (v) => {
            block.items[index] = v;
          });
        });
        break;

      case "table":
        block.columns.forEach((col, cIndex) => {
          addSlot(col, (v) => {
            block.columns[cIndex] = v;
          });
        });
        block.rows.forEach((row, rIndex) => {
          row.forEach((cell, cIndex) => {
            addSlot(cell, (v) => {
              block.rows[rIndex][cIndex] = v;
            });
          });
        });
        break;

      case "coreValues":
        block.values.forEach((val) => {
          addSlot(val.title, (v) => {
            val.title = v;
          });
          addSlot(val.description, (v) => {
            val.description = v;
          });
        });
        break;

      case "milestones":
        block.items.forEach((item) => {
          addSlot(item.title, (v) => {
            item.title = v;
          });
          addSlot(item.description, (v) => {
            item.description = v;
          });
        });
        break;

      case "hero":
        addSlot(block.badge, (v) => {
          block.badge = v;
        });
        addSlot(block.title, (v) => {
          block.title = v;
        });
        addSlot(block.subtitle, (v) => {
          block.subtitle = v;
        });
        addSlot(block.ctaLabel, (v) => {
          block.ctaLabel = v;
        });
        break;

      case "statsBand":
        block.stats.forEach((stat) => {
          addSlot(stat.label, (v) => {
            stat.label = v;
          });
        });
        break;

      case "ctaBand":
        addSlot(block.body, (v) => {
          block.body = v;
        });
        addSlot(block.ctaLabel, (v) => {
          block.ctaLabel = v;
        });
        break;

      case "image":
        addSlot(block.alt, (v) => {
          block.alt = v;
        });
        addSlot(block.caption, (v) => {
          block.caption = v;
        });
        break;

      case "contactCard":
      case "jobs":
      case "faq":
        // Renderers handle localization dynamically from public/portal i18n
        break;
    }
  }

  if (slots.length === 0) {
    return cloned;
  }

  const translatedTexts = await translateBatch(
    slots.map((s) => s.text),
    sourceLocale,
    targetLocale
  );

  slots.forEach((slot, i) => {
    if (translatedTexts[i] && translatedTexts[i].trim()) {
      slot.assign(translatedTexts[i]);
    }
  });

  return cloned;
}
