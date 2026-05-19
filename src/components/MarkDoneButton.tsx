"use client";

import type { StatusId } from "@/data/types";

interface MarkDoneButtonProps {
  currentStatus: StatusId;
  onMarkDone: () => void;
  size?: "sm" | "md";
}

export default function MarkDoneButton({
  currentStatus,
  onMarkDone,
  size = "md",
}: MarkDoneButtonProps) {
  const isDone = currentStatus === "done";
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!isDone) onMarkDone();
      }}
      disabled={isDone}
      className={`inline-flex items-center gap-1 rounded-full border font-medium transition ${pad} ${
        isDone
          ? "cursor-default border-teal-800 bg-teal-900/40 text-teal-400/60"
          : "border-teal-700 bg-teal-800 text-white hover:bg-teal-700"
      }`}
    >
      <span aria-hidden="true">✓</span>
      {isDone ? "Done" : "Mark Done"}
    </button>
  );
}
