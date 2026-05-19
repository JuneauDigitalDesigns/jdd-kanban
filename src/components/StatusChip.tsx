"use client";

import { useEffect, useRef, useState } from "react";
import type { EnumValue, StatusId } from "@/data/types";

interface StatusChipProps {
  value: StatusId;
  options: EnumValue[];
  onChange: (next: StatusId) => void;
  size?: "sm" | "md";
}

/**
 * Inline-editable status chip. Click to open a dropdown menu of all statuses.
 * Closes on outside click or ESC.
 */
export default function StatusChip({ value, options, onChange, size = "md" }: StatusChipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const current = options.find((o) => o.id === value);
  const color = current?.color ?? "#52525b";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`inline-flex items-center gap-1.5 rounded-full font-medium text-white shadow-sm hover:brightness-110 transition ${pad}`}
        style={{ backgroundColor: color }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {current?.label ?? value}
        <span aria-hidden="true" className="opacity-70">▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 min-w-[140px] rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-xl shadow-black/40"
          onClick={(e) => e.stopPropagation()}
        >
          {options.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (opt.id !== value) onChange(opt.id as StatusId);
                }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-zinc-800 ${
                  opt.id === value ? "text-zinc-100" : "text-zinc-300"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: opt.color ?? "#52525b" }}
                />
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
