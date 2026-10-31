import type {
  ContentBlock,
  ContentLocale,
  ContentPage,
} from "@/lib/api/content-pages";

export type QualitySeverity = "error" | "warning" | "info";
export type QualityCategory = "seo" | "images" | "links" | "translations" | "validity";

export interface QualityIssue {
  id: string;
  category: QualityCategory;
  severity: QualitySeverity;
  title: string;
  message: string;
  blockId?: string;
  blockIndex?: number;
  blockType?: string;
  field?: string;
  fixSuggestion?: string;
}

export interface ContentQualityReport {
  score: number; // 0 - 100
  status: "passed" | "warning" | "error";
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  issues: QualityIssue[];
  categoryBreakdown: Record<
    QualityCategory,
    { status: "passed" | "warning" | "error"; count: number }
  >;
}

export interface AuditablePageDraft {
  title: string;
  blocks: ContentBlock[];
  status?: "draft" | "published";
  effectiveDate?: string;
  metaTitle?: string;
  metaDescription?: string;
  openGraphImage?: string;
}

const PLACEHOLDER_TOKENS = [
  "lorem ipsum",
  "[todo]",
  "[translate]",
  "[tbd]",
  "draft translation",
  "placeholder text",
  "needs review",
  "example.com",
];

function containsPlaceholder(text: string): string | null {
  const lower = text.toLowerCase();
  for (const token of PLACEHOLDER_TOKENS) {
    if (lower.includes(token)) return token;
  }
  return null;
}

function isValidHttpOrRelativeUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Industrial-grade preflight audit engine for CMS content pages.
 * Evaluates SEO metadata, image validity, link integrity, structural completeness,
 * and translation parity against the reference English page.
 */
export function auditContentPage(
  draft: AuditablePageDraft,
  enPageReference?: ContentPage | null,
  locale: ContentLocale = "en"
): ContentQualityReport {
  const issues: QualityIssue[] = [];

  // ==========================================
  // 1. SEO & METADATA CHECKS
  // ==========================================
  const pageTitle = (draft.title || "").trim();
  if (!pageTitle) {
    issues.push({
      id: "seo-missing-page-title",
      category: "seo",
      severity: "error",
      title: "Missing Page Title",
      message: "The page title is empty. A distinct page title is required before publishing.",
      field: "title",
      fixSuggestion: "Enter a descriptive title for this page (e.g. 'About MyJudicial').",
    });
  }

  const metaTitle = (draft.metaTitle || "").trim();
  if (!metaTitle) {
    issues.push({
      id: "seo-missing-meta-title",
      category: "seo",
      severity: "warning",
      title: "Missing SEO Meta Title",
      message:
        "No dedicated search engine title specified. Google will fallback to the page title or domain default.",
      field: "metaTitle",
      fixSuggestion: "Add an SEO Meta Title between 15 and 60 characters.",
    });
  } else if (metaTitle.length < 15) {
    issues.push({
      id: "seo-short-meta-title",
      category: "seo",
      severity: "warning",
      title: "SEO Meta Title is Too Short",
      message: `Meta title is only ${metaTitle.length} characters. Recommended length is 15–60 characters for optimal search ranking.`,
      field: "metaTitle",
      fixSuggestion: "Expand the title with target legal keywords or brand tagline.",
    });
  } else if (metaTitle.length > 60) {
    issues.push({
      id: "seo-long-meta-title",
      category: "seo",
      severity: "warning",
      title: "SEO Meta Title May Be Truncated",
      message: `Meta title is ${metaTitle.length} characters. Google search snippets truncate titles exceeding 60 characters.`,
      field: "metaTitle",
      fixSuggestion: "Condense the title to under 60 characters.",
    });
  }

  const metaDescription = (draft.metaDescription || "").trim();
  if (!metaDescription) {
    issues.push({
      id: "seo-missing-meta-description",
      category: "seo",
      severity: "warning",
      title: "Missing SEO Meta Description",
      message:
        "Search engines and social previews will generate an automatic snippet, which may not capture your value proposition.",
      field: "metaDescription",
      fixSuggestion: "Provide a meta description between 50 and 160 characters summarizing the page.",
    });
  } else if (metaDescription.length < 40) {
    issues.push({
      id: "seo-short-meta-description",
      category: "seo",
      severity: "warning",
      title: "SEO Meta Description is Too Brief",
      message: `Meta description is only ${metaDescription.length} characters. Aim for 50–160 characters to fill search card snippets.`,
      field: "metaDescription",
      fixSuggestion: "Add key context explaining what legal clients or advocates will find.",
    });
  } else if (metaDescription.length > 160) {
    issues.push({
      id: "seo-long-meta-description",
      category: "seo",
      severity: "warning",
      title: "SEO Meta Description Exceeds Recommended Length",
      message: `Meta description is ${metaDescription.length} characters and may be clipped on Google SERP previews.`,
      field: "metaDescription",
      fixSuggestion: "Trim the description down to 160 characters or fewer.",
    });
  }

  const ogImage = (draft.openGraphImage || "").trim();
  if (!ogImage) {
    issues.push({
      id: "seo-missing-og-image",
      category: "images",
      severity: "warning",
      title: "Missing Social Share Image (Open Graph)",
      message:
        "Shares on LinkedIn, WhatsApp, X, and Facebook will use the fallback platform logo instead of a rich page preview.",
      field: "openGraphImage",
      fixSuggestion: "Set a 1200x630px PNG/JPG image URL in the Open Graph Image field.",
    });
  } else if (!isValidHttpOrRelativeUrl(ogImage)) {
    issues.push({
      id: "seo-invalid-og-image",
      category: "images",
      severity: "error",
      title: "Invalid Open Graph Image URL",
      message: `The Open Graph image URL "${ogImage}" is malformed. It must be an absolute URL or root-relative path.`,
      field: "openGraphImage",
      fixSuggestion: "Ensure the URL starts with https:// or / (e.g. /og_about.png).",
    });
  }

  // ==========================================
  // 2. STRUCTURAL COMPLETENESS & VALIDITY
  // ==========================================
  const blocks = draft.blocks || [];
  if (blocks.length === 0) {
    issues.push({
      id: "validity-empty-blocks",
      category: "validity",
      severity: "error",
      title: "Page Has No Content Sections",
      message: "The page has no blocks. A page cannot be published empty.",
      fixSuggestion: "Add at least one section block or click 'Load Standard Blueprint'.",
    });
  }

  blocks.forEach((block, idx) => {
    const blockNum = idx + 1;

    // Check placeholders in any text fields
    if ("heading" in block && block.heading) {
      const token = containsPlaceholder(block.heading);
      if (token) {
        issues.push({
          id: `validity-placeholder-heading-${block.id}`,
          category: "validity",
          severity: "warning",
          title: `Placeholder Text in Section #${blockNum}`,
          message: `Section heading contains placeholder token "${token}".`,
          blockId: block.id,
          blockIndex: idx,
          blockType: block.type,
          fixSuggestion: "Replace placeholder copy before publishing.",
        });
      }
    }

    switch (block.type) {
      case "hero": {
        if (!block.title || !block.title.trim()) {
          issues.push({
            id: `validity-hero-empty-title-${block.id}`,
            category: "validity",
            severity: "error",
            title: `Hero Section #${blockNum} Missing Headline`,
            message: "The Hero section headline cannot be blank.",
            blockId: block.id,
            blockIndex: idx,
            blockType: "hero",
            fixSuggestion: "Enter a headline for the Hero banner.",
          });
        }
        const hasCtaLabel = Boolean(block.ctaLabel && block.ctaLabel.trim());
        const hasCtaHref = Boolean(block.ctaHref && block.ctaHref.trim());
        if (hasCtaLabel && !hasCtaHref) {
          issues.push({
            id: `link-hero-missing-href-${block.id}`,
            category: "links",
            severity: "error",
            title: `Hero CTA Button Missing Link`,
            message: `CTA button is labeled "${block.ctaLabel}" but has no destination link.`,
            blockId: block.id,
            blockIndex: idx,
            blockType: "hero",
            fixSuggestion: "Provide a target link (e.g. /find-lawyers or /contact).",
          });
        } else if (!hasCtaLabel && hasCtaHref) {
          issues.push({
            id: `link-hero-missing-label-${block.id}`,
            category: "links",
            severity: "warning",
            title: `Hero CTA Link Has No Label`,
            message: `CTA destination is set to "${block.ctaHref}" but has no button text.`,
            blockId: block.id,
            blockIndex: idx,
            blockType: "hero",
            fixSuggestion: "Add a button label or clear the CTA URL.",
          });
        } else if (hasCtaHref && block.ctaHref) {
          if (!isValidHttpOrRelativeUrl(block.ctaHref)) {
            issues.push({
              id: `link-hero-invalid-href-${block.id}`,
              category: "links",
              severity: "error",
              title: `Invalid Hero CTA Link`,
              message: `CTA link "${block.ctaHref}" is not a valid relative path or https URL.`,
              blockId: block.id,
              blockIndex: idx,
              blockType: "hero",
              fixSuggestion: "Use a valid path like /about or https://...",
            });
          }
        }
        break;
      }

      case "prose": {
        if (!block.body || !block.body.trim()) {
          issues.push({
            id: `validity-prose-empty-${block.id}`,
            category: "validity",
            severity: "error",
            title: `Prose Section #${blockNum} is Empty`,
            message: "Prose block has no body content.",
            blockId: block.id,
            blockIndex: idx,
            blockType: "prose",
            fixSuggestion: "Add text or delete this empty section.",
          });
        } else {
          const token = containsPlaceholder(block.body);
          if (token) {
            issues.push({
              id: `validity-prose-placeholder-${block.id}`,
              category: "validity",
              severity: "warning",
              title: `Placeholder in Prose Section #${blockNum}`,
              message: `Found placeholder marker "${token}" in prose copy.`,
              blockId: block.id,
              blockIndex: idx,
              blockType: "prose",
              fixSuggestion: "Review and replace mock text with final copy.",
            });
          }
        }
        break;
      }

      case "callout": {
        if (!block.body || !block.body.trim()) {
          issues.push({
            id: `validity-callout-empty-${block.id}`,
            category: "validity",
            severity: "error",
            title: `Callout Section #${blockNum} is Empty`,
            message: "Callout block has no message text.",
            blockId: block.id,
            blockIndex: idx,
            blockType: "callout",
            fixSuggestion: "Enter notice text or remove the block.",
          });
        }
        break;
      }

      case "bullets":
      case "steps": {
        const items = block.items || [];
        const filledItems = items.filter((item) => item && item.trim().length > 0);
        if (filledItems.length === 0) {
          issues.push({
            id: `validity-list-empty-${block.id}`,
            category: "validity",
            severity: "error",
            title: `List Section #${blockNum} Has No Items`,
            message: `The ${block.type} section contains no populated list items.`,
            blockId: block.id,
            blockIndex: idx,
            blockType: block.type,
            fixSuggestion: "Add at least one list item or remove the block.",
          });
        } else if (filledItems.length < items.length) {
          issues.push({
            id: `validity-list-blank-items-${block.id}`,
            category: "validity",
            severity: "warning",
            title: `Empty List Rows in Section #${blockNum}`,
            message: `${items.length - filledItems.length} list item(s) are blank.`,
            blockId: block.id,
            blockIndex: idx,
            blockType: block.type,
            fixSuggestion: "Delete blank list rows.",
          });
        }
        break;
      }

      case "table": {
        const cols = (block.columns || []).filter((c) => c && c.trim());
        const rows = block.rows || [];
        if (cols.length === 0) {
          issues.push({
            id: `validity-table-no-cols-${block.id}`,
            category: "validity",
            severity: "error",
            title: `Table Section #${blockNum} Missing Headers`,
            message: "Table has no defined column headers.",
            blockId: block.id,
            blockIndex: idx,
            blockType: "table",
            fixSuggestion: "Define column headers or remove table.",
          });
        }
        if (rows.length === 0) {
          issues.push({
            id: `validity-table-no-rows-${block.id}`,
            category: "validity",
            severity: "warning",
            title: `Table Section #${blockNum} Has No Data Rows`,
            message: "Table has column headers but no content rows.",
            blockId: block.id,
            blockIndex: idx,
            blockType: "table",
            fixSuggestion: "Add at least one data row.",
          });
        }
        break;
      }

      case "coreValues": {
        const values = block.values || [];
        const filled = values.filter((v) => v.title && v.title.trim());
        if (filled.length === 0) {
          issues.push({
            id: `validity-values-empty-${block.id}`,
            category: "validity",
            severity: "error",
            title: `Core Values Section #${blockNum} Has No Values`,
            message: "No core values are populated in this section.",
            blockId: block.id,
            blockIndex: idx,
            blockType: "coreValues",
            fixSuggestion: "Add at least one core value with a title and description.",
          });
        }
        break;
      }

      case "milestones": {
        const milestones = block.items || [];
        const filled = milestones.filter((m) => m.title && m.title.trim());
        if (filled.length === 0) {
          issues.push({
            id: `validity-milestones-empty-${block.id}`,
            category: "validity",
            severity: "error",
            title: `Milestones Section #${blockNum} Has No Milestones`,
            message: "No milestones or timeline items are populated.",
            blockId: block.id,
            blockIndex: idx,
            blockType: "milestones",
            fixSuggestion: "Add milestone entries with a year and description.",
          });
        }
        break;
      }

      case "statsBand": {
        const stats = block.stats || [];
        const filled = stats.filter((s) => s.value && s.value.trim());
        if (filled.length === 0) {
          issues.push({
            id: `validity-stats-empty-${block.id}`,
            category: "validity",
            severity: "warning",
            title: `Stats Band Section #${blockNum} Has No Metrics`,
            message: "Stats band has no populated metrics or labels.",
            blockId: block.id,
            blockIndex: idx,
            blockType: "statsBand",
            fixSuggestion: "Add key metrics (e.g. 500+ Verified Advocates) or delete section.",
          });
        }
        break;
      }

      case "ctaBand": {
        const hasLabel = Boolean(block.ctaLabel && block.ctaLabel.trim());
        const hasHref = Boolean(block.ctaHref && block.ctaHref.trim());
        if (!hasLabel || !hasHref) {
          issues.push({
            id: `link-cta-band-incomplete-${block.id}`,
            category: "links",
            severity: "error",
            title: `Call to Action Band #${blockNum} Incomplete`,
            message: "CTA band requires both button text and destination URL.",
            blockId: block.id,
            blockIndex: idx,
            blockType: "ctaBand",
            fixSuggestion: "Provide both CTA Label and CTA Link.",
          });
        } else if (!isValidHttpOrRelativeUrl(block.ctaHref)) {
          issues.push({
            id: `link-cta-band-invalid-${block.id}`,
            category: "links",
            severity: "error",
            title: `Invalid CTA Band Link`,
            message: `CTA link "${block.ctaHref}" is not a valid relative path or https URL.`,
            blockId: block.id,
            blockIndex: idx,
            blockType: "ctaBand",
            fixSuggestion: "Change to a valid destination like /contact.",
          });
        }
        break;
      }

      case "image": {
        const src = (block.src || "").trim();
        const alt = (block.alt || "").trim();
        if (!src) {
          issues.push({
            id: `image-missing-src-${block.id}`,
            category: "images",
            severity: "error",
            title: `Image Section #${blockNum} Has No Source URL`,
            message: "Image block has no image URL and will render as a broken image.",
            blockId: block.id,
            blockIndex: idx,
            blockType: "image",
            fixSuggestion: "Provide a valid image URL or uploaded asset path.",
          });
        } else if (!isValidHttpOrRelativeUrl(src)) {
          issues.push({
            id: `image-invalid-src-${block.id}`,
            category: "images",
            severity: "error",
            title: `Invalid Image Source in Section #${blockNum}`,
            message: `Image URL "${src}" is not a valid URL.`,
            blockId: block.id,
            blockIndex: idx,
            blockType: "image",
            fixSuggestion: "Ensure the image URL starts with https:// or /.",
          });
        } else if (src.startsWith("http://")) {
          issues.push({
            id: `image-insecure-src-${block.id}`,
            category: "images",
            severity: "warning",
            title: `Insecure Image Protocol in Section #${blockNum}`,
            message: `Image "${src}" uses unencrypted http:// and may trigger browser mixed content warnings.`,
            blockId: block.id,
            blockIndex: idx,
            blockType: "image",
            fixSuggestion: "Upgrade image URL to https://.",
          });
        }

        if (!alt) {
          issues.push({
            id: `image-missing-alt-${block.id}`,
            category: "images",
            severity: "warning",
            title: `Missing Alt Text in Section #${blockNum}`,
            message:
              "Image is missing an alternative description (alt text). This harms accessibility for screen readers and SEO indexing.",
            blockId: block.id,
            blockIndex: idx,
            blockType: "image",
            fixSuggestion: "Add a concise description of the image content.",
          });
        }
        break;
      }

      default:
        break;
    }
  });

  // ==========================================
  // 3. TRANSLATION & LOCALIZATION PARITY
  // ==========================================
  if (locale !== "en" && enPageReference) {
    const enBlocks = enPageReference.blocks || [];
    const localizedBlocks = draft.blocks || [];

    // Compare block counts
    if (localizedBlocks.length < enBlocks.length) {
      issues.push({
        id: "translation-missing-sections",
        category: "translations",
        severity: "warning",
        title: `Incomplete ${locale.toUpperCase()} Translation`,
        message: `The English master page has ${enBlocks.length} sections, but this ${locale.toUpperCase()} draft only has ${localizedBlocks.length} sections. Some content is missing.`,
        fixSuggestion: `Add the missing sections or use 'Copy from English' and translate the copy.`,
      });
    }

    // Check if the title is still verbatim English
    if (
      pageTitle &&
      enPageReference.title &&
      pageTitle.toLowerCase() === enPageReference.title.trim().toLowerCase() &&
      pageTitle.length > 5
    ) {
      issues.push({
        id: "translation-title-untranslated",
        category: "translations",
        severity: "warning",
        title: `Page Title Appears Untranslated`,
        message: `Page title is identical to the English version ("${enPageReference.title}").`,
        field: "title",
        fixSuggestion: `Translate the page title into ${locale === "fr" ? "French" : "Kinyarwanda"}.`,
      });
    }

    // Check block-by-block for verbatim untranslated copy
    localizedBlocks.forEach((block, idx) => {
      const enMatch = enBlocks[idx];
      if (!enMatch || enMatch.type !== block.type) return;

      if (block.type === "prose" && enMatch.type === "prose") {
        if (
          block.body.trim().length > 30 &&
          block.body.trim().toLowerCase() === enMatch.body.trim().toLowerCase()
        ) {
          issues.push({
            id: `translation-untranslated-prose-${block.id}`,
            category: "translations",
            severity: "warning",
            title: `Untranslated Section #${idx + 1} (${block.type})`,
            message: `Section text is identical to English master. Localized ${locale.toUpperCase()} copy is recommended.`,
            blockId: block.id,
            blockIndex: idx,
            blockType: block.type,
            fixSuggestion: `Translate this section into ${locale.toUpperCase()}.`,
          });
        }
      }
    });
  }

  // ==========================================
  // SCORE & STATUS CALCULATION
  // ==========================================
  const criticalCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  let calculatedScore = 100 - criticalCount * 25 - warningCount * 8 - infoCount * 2;
  if (calculatedScore < 0) calculatedScore = 0;
  if (criticalCount > 0 && calculatedScore > 65) calculatedScore = 65;

  let status: "passed" | "warning" | "error" = "passed";
  if (criticalCount > 0) {
    status = "error";
  } else if (warningCount > 0) {
    status = "warning";
  }

  const categoryMap: Record<
    QualityCategory,
    { status: "passed" | "warning" | "error"; count: number }
  > = {
    seo: { status: "passed", count: 0 },
    images: { status: "passed", count: 0 },
    links: { status: "passed", count: 0 },
    translations: { status: "passed", count: 0 },
    validity: { status: "passed", count: 0 },
  };

  issues.forEach((issue) => {
    categoryMap[issue.category].count += 1;
    if (issue.severity === "error") {
      categoryMap[issue.category].status = "error";
    } else if (issue.severity === "warning" && categoryMap[issue.category].status !== "error") {
      categoryMap[issue.category].status = "warning";
    }
  });

  return {
    score: calculatedScore,
    status,
    criticalCount,
    warningCount,
    infoCount,
    issues,
    categoryBreakdown: categoryMap,
  };
}
