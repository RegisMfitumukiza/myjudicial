"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: string | null;
};

export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  error,
}: OtpInputProps) {
  const id = useId();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const submittedValueRef = useRef<string | null>(null);

  const getValues = useCallback(() => {
    const chars = value.split("");
    return Array.from({ length }, (_, i) => chars[i] ?? "");
  }, [value, length]);

  const focusIndex = useCallback((index: number) => {
    requestAnimationFrame(() => {
      inputRefs.current[index]?.focus();
      inputRefs.current[index]?.select();
    });
  }, []);

  const handleChange = useCallback(
    (index: number, char: string) => {
      if (disabled) return;
      if (!/^\d*$/.test(char)) return;
      const chars = getValues();
      const digit = char.slice(-1);
      chars[index] = digit;
      const next = chars.join("");
      onChange(next);
      if (digit && index < length - 1) {
        focusIndex(index + 1);
      }
    },
    [disabled, getValues, length, onChange, focusIndex],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !getValues()[index] && index > 0) {
        const chars = getValues();
        chars[index - 1] = "";
        onChange(chars.join(""));
        focusIndex(index - 1);
      }
      if (e.key === "ArrowLeft" && index > 0) focusIndex(index - 1);
      if (e.key === "ArrowRight" && index < length - 1) focusIndex(index + 1);
    },
    [getValues, length, onChange, focusIndex],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      if (disabled) return;
      const pasted = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, length);
      if (!pasted) return;
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      focusIndex(nextIndex);
    },
    [disabled, length, onChange, focusIndex],
  );

  useEffect(() => {
    if (value.length !== length) {
      // Code is incomplete (or was cleared) — allow the next completed
      // entry, even if it happens to match a previously-submitted code.
      submittedValueRef.current = null;
      return;
    }
    if (disabled) return;
    if (submittedValueRef.current === value) return;
    submittedValueRef.current = value;
    onComplete?.(value);
  }, [value, length, onComplete, disabled]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-1.5 min-[360px]:gap-2 sm:gap-3" role="group" aria-label="One-time password input">
        {getValues().map((char, i) => (
          <input
            key={`${id}-${i}`}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            disabled={disabled}
            value={char}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            aria-label={`Digit ${i + 1}`}
            className={cn(
              "h-10 w-7 min-[320px]:h-11 min-[320px]:w-8 min-[360px]:h-12 min-[360px]:w-9 sm:w-10 rounded-lg min-[360px]:rounded-xl border text-center text-base min-[320px]:text-lg min-[360px]:text-xl font-bold tracking-widest shadow-sm transition-all shrink-0",
              "focus:outline-none focus:ring-2 focus:ring-brand-dark/20 dark:focus:ring-white/20",
              char
                ? "border-brand-dark dark:border-white bg-accent text-foreground"
                : error
                  ? "border-destructive bg-destructive/10 text-foreground"
                  : "border-border bg-background text-foreground",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          />
        ))}
      </div>
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
