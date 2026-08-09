"use client";

import { useState, useRef, useEffect } from "react";
import { Minus, Plus } from "lucide-react";

interface GuestPickerProps {
  value: string;
  onChange: (label: string) => void;
}

interface CounterRowProps {
  label: string;
  subtitle: string;
  count: number;
  onMinus: () => void;
  onPlus: () => void;
}

function CounterRow({ label, subtitle, count, onMinus, onPlus }: CounterRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-bold text-brand-dark dark:text-gray-100">{label}</p>
        <p className="text-[12px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onMinus}
          disabled={count === 0}
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
            count === 0
              ? "border-gray-200 text-gray-200 cursor-not-allowed dark:border-gray-700 dark:text-gray-700"
              : "border-gray-400 text-gray-600 hover:border-brand-dark hover:text-brand-dark dark:border-gray-500 dark:text-gray-300 dark:hover:border-gray-100 dark:hover:text-gray-100"
          }`}
        >
          <Minus size={14} />
        </button>
        <span className="w-6 text-center text-sm font-semibold text-brand-dark dark:text-gray-100">{count}</span>
        <button
          onClick={onPlus}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-400 text-gray-600 transition-colors hover:border-brand-dark hover:text-brand-dark dark:border-gray-500 dark:text-gray-300 dark:hover:border-gray-100 dark:hover:text-gray-100"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export function GuestPicker({ value, onChange }: GuestPickerProps) {
  const [open, setOpen] = useState(false);
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const total = adults + children + infants;

  function updateCounts(a: number, c: number, i: number) {
    setAdults(a);
    setChildren(c);
    setInfants(i);
    const parts: string[] = [];
    if (a > 0) parts.push(`${a} adult${a !== 1 ? "s" : ""}`);
    if (c > 0) parts.push(`${c} child${c !== 1 ? "ren" : ""}`);
    if (i > 0) parts.push(`${i} infant${i !== 1 ? "s" : ""}`);
    onChange(parts.length > 0 ? `${total} guest${total !== 1 ? "s" : ""}` : "");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left"
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Who</span>
        <span className={`block text-[11px] ${total > 0 ? "font-semibold text-brand-dark dark:text-gray-100" : "text-slate-500 dark:text-gray-400"}`}>
          {total > 0 ? `${total} guest${total !== 1 ? "s" : ""}` : "Legal issue"}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-40 mt-2 w-[300px] rounded-xl border border-brand-border bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <CounterRow
              label={total === 0 ? "Clients" : "Adults"}
              subtitle="Ages 13 or above"
              count={adults}
              onMinus={() => updateCounts(Math.max(0, adults - 1), children, infants)}
              onPlus={() => updateCounts(adults + 1, children, infants)}
            />
            <div className="border-t border-brand-border dark:border-gray-700" />
            <CounterRow
              label="Children"
              subtitle="Ages 2\u201312"
              count={children}
              onMinus={() => updateCounts(adults, Math.max(0, children - 1), infants)}
              onPlus={() => updateCounts(adults, children + 1, infants)}
            />
            <div className="border-t border-brand-border dark:border-gray-700" />
            <CounterRow
              label="Infants"
              subtitle="Under 2"
              count={infants}
              onMinus={() => updateCounts(adults, children, Math.max(0, infants - 1))}
              onPlus={() => updateCounts(adults, children, infants + 1)}
            />
          </div>
        </>
      )}
    </div>
  );
}
