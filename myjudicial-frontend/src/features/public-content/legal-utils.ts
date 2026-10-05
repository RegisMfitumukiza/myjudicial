export function slugifyLegalHeading(text: string): string {
  // Strip leading numbering e.g. "1. ", "10. ", "1 - "
  const withoutNumbering = text.replace(/^\s*\d+[\.\s\-:]+\s*/u, "");
  const slug = withoutNumbering
    .toLowerCase()
    .trim()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .join("-");
  return slug || "section";
}