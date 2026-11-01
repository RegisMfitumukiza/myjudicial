import { describe, it, expect } from "vitest";

import { cn, formatCopyright, formatWorkingHours } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy classes with spaces", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("ignores falsy values", () => {
    expect(cn("a", false, undefined, null, 0, "b")).toBe("a b");
  });

  it("handles clsx object syntax", () => {
    expect(cn({ a: true, b: false })).toBe("a");
  });

  it("merges conflicting tailwind classes (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("keeps distinct classes from both inputs", () => {
    expect(cn("bg-red-500", "px-4")).toBe("bg-red-500 px-4");
  });

  it("returns empty string for no args", () => {
    expect(cn()).toBe("");
  });
});

describe("formatCopyright", () => {
  const currentYear = new Date().getFullYear();

  it("normalizes duplicated copyright symbols and years", () => {
    expect(formatCopyright(`© ${currentYear} © ${currentYear} MyJudicial Ltd. All rights reserved.`)).toBe(
      `© ${currentYear} MyJudicial Ltd. All rights reserved.`
    );
  });

  it("handles strings that already start with © and current year", () => {
    expect(formatCopyright(`© ${currentYear} MyJudicial Ltd. All rights reserved.`)).toBe(
      `© ${currentYear} MyJudicial Ltd. All rights reserved.`
    );
  });

  it("handles strings with (c) or c and year", () => {
    expect(formatCopyright(`(c) ${currentYear} MyJudicial Ltd. All rights reserved.`)).toBe(
      `© ${currentYear} MyJudicial Ltd. All rights reserved.`
    );
    expect(formatCopyright(`c ${currentYear} MyJudicial Ltd. All rights reserved.`)).toBe(
      `© ${currentYear} MyJudicial Ltd. All rights reserved.`
    );
  });

  it("prepends © and current year when only company/rights name is provided", () => {
    expect(formatCopyright("MyJudicial Ltd. All rights reserved.")).toBe(
      `© ${currentYear} MyJudicial Ltd. All rights reserved.`
    );
  });

  it("falls back to default when input is null, undefined, or empty", () => {
    expect(formatCopyright(null, "MyJudicial, Inc. All rights reserved.")).toBe(
      `© ${currentYear} MyJudicial, Inc. All rights reserved.`
    );
    expect(formatCopyright(undefined, "MyJudicial, Inc. All rights reserved.")).toBe(
      `© ${currentYear} MyJudicial, Inc. All rights reserved.`
    );
    expect(formatCopyright("", "MyJudicial, Inc. All rights reserved.")).toBe(
      `© ${currentYear} MyJudicial, Inc. All rights reserved.`
    );
  });

  it("preserves intentional historic year ranges", () => {
    expect(formatCopyright(`© 2023-${currentYear} MyJudicial Ltd. All rights reserved.`)).toBe(
      `© 2023–${currentYear} MyJudicial Ltd. All rights reserved.`
    );
  });

  it("localizes rights reserved statement for French and Kinyarwanda", () => {
    expect(
      formatCopyright("© 2026 MyJudicial Ltd. All rights reserved.", "MyJudicial, Inc. Tous droits réservés.", "fr")
    ).toBe(`© ${currentYear} MyJudicial, Inc. Tous droits réservés.`);

    expect(
      formatCopyright("MyJudicial Ltd. All rights reserved.", undefined, "fr")
    ).toBe(`© ${currentYear} MyJudicial Ltd. Tous droits réservés.`);

    expect(
      formatCopyright("MyJudicial Ltd. All rights reserved.", undefined, "rw")
    ).toBe(`© ${currentYear} MyJudicial Ltd. Uburenganzira bwose bwubahirizwa.`);
  });
});

describe("formatWorkingHours", () => {
  it("formats standard operating hours for French, Kinyarwanda, and English", () => {
    expect(formatWorkingHours("Monday – Friday: 8:00 AM – 6:00 PM CAT", "fr")).toBe(
      "Lundi – Vendredi : 08h00 – 18h00 (CAT)"
    );
    expect(formatWorkingHours("Monday – Friday: 8:00 AM – 6:00 PM CAT", "rw")).toBe(
      "Kuwa Mbere – Kuwa Gatanu: 8:00 – 18:00 (CAT)"
    );
    expect(formatWorkingHours("Monday – Friday: 8:00 AM – 6:00 PM CAT", "en")).toBe(
      "Monday – Friday: 8:00 AM – 6:00 PM CAT"
    );
  });

  it("uses provided fallback when default hours are present", () => {
    expect(
      formatWorkingHours("Monday – Friday: 8:00 AM – 6:00 PM CAT", "fr", "Lundi à Vendredi de 8h à 18h")
    ).toBe("Lundi à Vendredi de 8h à 18h");
  });

  it("translates day names in custom hours for non-English locales", () => {
    expect(formatWorkingHours("Monday - Saturday: 8:00 AM - 5:00 PM", "fr")).toBe(
      "Lundi - Samedi: 8:00 AM - 5:00 PM"
    );
    expect(formatWorkingHours("Monday - Friday", "rw")).toBe(
      "Kuwa Mbere - Kuwa Gatanu"
    );
  });
});

