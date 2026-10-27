/**
 * Name formatting utilities.
 *
 * Names are normalised to Title Case at the data-persistence layer so every
 * consumer (dashboards, emails, public profiles) always receives correctly
 * capitalised names regardless of how the user typed them during registration
 * or profile update.
 */

/**
 * Convert a single name segment to Title Case.
 * Handles hyphenated names (e.g. "jean-pierre" → "Jean-Pierre") and
 * preserves internal casing for particles that are already correctly set.
 *
 * @param name - Raw name string (any casing)
 * @returns Title-cased name
 */
export function toTitleCase(name: string): string {
  if (!name) return name;
  return name
    .trim()
    // Capitalise first letter of each word
    .split(" ")
    .map((word) =>
      word
        // Handle hyphenated segments (e.g. "jean-pierre")
        .split("-")
        .map((part) =>
          part.length > 0
            ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            : part
        )
        .join("-")
    )
    .join(" ");
}

/**
 * Normalise a firstName / lastName pair so both are Title Cased and
 * neither is empty.  Falls back to the supplied `fallback` value.
 */
export function normaliseNamePair(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback = "User"
): { firstName: string; lastName: string } {
  const fn = firstName ? toTitleCase(firstName) : "";
  const ln = lastName ? toTitleCase(lastName) : "";
  return {
    firstName: fn || fallback,
    lastName: ln || fn || fallback,
  };
}
