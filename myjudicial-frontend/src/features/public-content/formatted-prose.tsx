import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const bodyTextClass =
  "text-xs min-[360px]:text-sm sm:text-base leading-relaxed text-muted-foreground break-words";

export interface PlatformSettingsContext {
  platformName?: string;
  supportEmail?: string;
  hotlinePhone?: string;
  officeBuilding?: string;
  officeStreet?: string;
  officeDistrict?: string;
  officePoBox?: string;
  supportWorkingHours?: string;
  dpoContactEmail?: string;
}

/**
 * Dynamically binds platform location, legal emails, hotline, and brand metadata
 * so that any changes saved in Admin Platform Settings immediately reflect inside
 * prose blocks and legal clauses.
 */
export function interpolatePlatformTokens(
  text: string,
  settings?: PlatformSettingsContext | null
): string {
  if (!text) return "";

  const building = settings?.officeBuilding?.trim();
  const street = settings?.officeStreet?.trim();
  const district = settings?.officeDistrict?.trim();
  const poBox = settings?.officePoBox?.trim();

  const addressParts = [building, street, district].filter(Boolean);
  const officeAddress =
    addressParts.join(", ") ||
    "Deco Center, 3rd Floor, KN 3 Ave & KN 4 St, Nyarugenge Central Business District, Kigali, Rwanda";

  const fullHeadquartersAddress = poBox
    ? `${officeAddress} (${poBox})`
    : officeAddress;

  // Use configured dpoContactEmail, or if it's set to the unmonitored legal@ address, fall back to active supportEmail
  const configuredDpo = settings?.dpoContactEmail?.trim();
  const dpoEmail =
    configuredDpo && !configuredDpo.includes("legal@myjudicial.com")
      ? configuredDpo
      : settings?.supportEmail?.trim() || "support@myjudicial.com";

  const supportEmail = settings?.supportEmail?.trim() || "support@myjudicial.com";
  const hotline = settings?.hotlinePhone?.trim() || "+250 788 312 456";
  const platformName = settings?.platformName?.trim() || "MyJudicial";
  const hours = settings?.supportWorkingHours?.trim() || "Monday - Friday: 8:00 AM - 6:00 PM CAT";

  return text
    // 1. Explicit dynamic template tokens
    .replace(/\{\{\s*officeAddress\s*\}\}/g, fullHeadquartersAddress)
    .replace(/\{\{\s*dpoEmail\s*\}\}/g, dpoEmail)
    .replace(/\{\{\s*supportEmail\s*\}\}/g, supportEmail)
    .replace(/\{\{\s*hotlinePhone\s*\}\}/g, hotline)
    .replace(/\{\{\s*platformName\s*\}\}/g, platformName)
    .replace(/\{\{\s*poBox\s*\}\}/g, poBox || "")
    .replace(/\{\{\s*workingHours\s*\}\}/g, hours)
    // 2. Exact legacy seed address strings replaced cleanly
    .replace(
      /Centenary House, 4th Floor, KN 3 Ave & KN 4 St, Nyarugenge Central Business District, P\.O\. Box 2848, Kigali, Rwanda/gi,
      fullHeadquartersAddress
    )
    .replace(
      /Centenary House, 4th Floor, KN 3 Ave & KN 4 St, Nyarugenge Central Business District, Kigali, Rwanda/gi,
      officeAddress
    )
    // 3. Section 23 key-value replacements
    .replace(/Physical Address:\s*[^\n]+/gi, `Physical Address: ${officeAddress}`)
    .replace(/Postal Address:\s*[^\n]+/gi, `Postal Address: ${poBox || "P.O. Box 2848, Kigali, Rwanda"}`)
    .replace(/Data Protection Officer \(DPO\) Email:\s*[^\n]+/gi, `Data Protection Officer (DPO) Email: ${dpoEmail}`)
    .replace(/Customer Support Email:\s*[^\n]+/gi, `Customer Support Email: ${supportEmail}`)
    .replace(/Telephone Hotline:\s*[^\n]+/gi, `Telephone Hotline: ${hotline}`)
    .replace(/Business Hours:\s*[^\n]+/gi, `Business Hours: ${hours}`)
    // 4. Any remaining references to unmonitored legal@ address
    .replace(/\blegal@myjudicial\.com\b/gi, dpoEmail)
    // 5. Any remaining references to default hotline
    .replace(/\+250\s*788\s*312\s*456/g, hotline);
}

export function renderTextWithLead(
  text: string,
  settings?: PlatformSettingsContext | null
): ReactNode {
  const processed = interpolatePlatformTokens(text, settings);
  const trimmed = processed.trim();
  if (!trimmed) return null;

  // Standalone URL
  if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
    return (
      <a
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary hover:underline"
      >
        {trimmed}
      </a>
    );
  }

  // Matches "Lead Title: Rest of content" or "Lead Title (Detail): Rest"
  const match = trimmed.match(/^([A-Za-z0-9\s()&/%–\-]{2,60}):\s+([\s\S]+)$/);
  if (match) {
    const [, lead, rest] = match;
    const restTrimmed = rest.trim();

    let renderedRest: ReactNode = rest;

    // Check if rest is a URL
    if (/^https?:\/\/[^\s]+$/i.test(restTrimmed)) {
      renderedRest = (
        <a
          href={restTrimmed}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline"
        >
          {restTrimmed}
        </a>
      );
    }
    // Check if rest is an email
    else if (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i.test(restTrimmed)) {
      renderedRest = (
        <a
          href={`mailto:${restTrimmed}`}
          className="font-medium text-primary hover:underline"
        >
          {restTrimmed}
        </a>
      );
    }
    // Check if rest is a phone number
    else if (/^\+?[0-9\s\-()]{7,20}$/.test(restTrimmed)) {
      renderedRest = (
        <a
          href={`tel:${restTrimmed.replace(/\s+/g, "")}`}
          className="font-medium text-primary hover:underline"
        >
          {restTrimmed}
        </a>
      );
    }

    return (
      <>
        <strong className="font-semibold text-foreground">{lead}:</strong>{" "}
        <span>{renderedRest}</span>
      </>
    );
  }

  return trimmed;
}

interface FormattedProseProps {
  body: string;
  settings?: PlatformSettingsContext | null;
  className?: string;
}

export function FormattedProse({ body, settings, className }: FormattedProseProps) {
  if (!body || !body.trim()) return null;

  const interpolated = interpolatePlatformTokens(body, settings);
  const lines = interpolated.split("\n");
  const nodes: ReactNode[] = [];

  let currentParagraphLines: string[] = [];
  let currentList: { isOrdered: boolean; items: string[] } | null = null;
  let keyCounter = 0;

  const flushParagraph = () => {
    if (currentParagraphLines.length === 0) return;
    const text = currentParagraphLines.join(" ").trim();
    currentParagraphLines = [];
    if (!text) return;

    keyCounter += 1;
    nodes.push(
      <p key={`p-${keyCounter}`} className={bodyTextClass}>
        {renderTextWithLead(text, settings)}
      </p>
    );
  };

  const flushList = () => {
    if (!currentList || currentList.items.length === 0) {
      currentList = null;
      return;
    }
    const { isOrdered, items } = currentList;
    currentList = null;
    keyCounter += 1;

    if (isOrdered) {
      nodes.push(
        <ol key={`ol-${keyCounter}`} className="my-3 space-y-2.5 ps-1 sm:ps-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary mt-0.5">
                {idx + 1}
              </span>
              <div className={cn(bodyTextClass, "flex-1 min-w-0")}>
                {renderTextWithLead(item, settings)}
              </div>
            </li>
          ))}
        </ol>
      );
    } else {
      nodes.push(
        <ul key={`ul-${keyCounter}`} className="my-3 space-y-2.5 ps-1 sm:ps-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70 dark:bg-primary" />
              <div className={cn(bodyTextClass, "flex-1 min-w-0")}>
                {renderTextWithLead(item, settings)}
              </div>
            </li>
          ))}
        </ul>
      );
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Empty line indicates paragraph / block separation
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const bulletMatch = line.match(/^[•\-\*]\s+(.*)$/);
    const orderedMatch = line.match(/^(\d+)[\.\)]\s+(.*)$/);

    if (bulletMatch) {
      flushParagraph();
      if (currentList && currentList.isOrdered) {
        flushList();
      }
      if (!currentList) {
        currentList = { isOrdered: false, items: [] };
      }
      currentList.items.push(bulletMatch[1]);
    } else if (orderedMatch) {
      flushParagraph();
      if (currentList && !currentList.isOrdered) {
        flushList();
      }
      if (!currentList) {
        currentList = { isOrdered: true, items: [] };
      }
      currentList.items.push(orderedMatch[2]);
    } else {
      // Regular line
      if (currentList) {
        flushList();
      }
      currentParagraphLines.push(line);
    }
  }

  flushParagraph();
  flushList();

  return <div className={cn("space-y-3", className)}>{nodes}</div>;
}
