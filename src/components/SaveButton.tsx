"use client";

import { useEffect, useState } from "react";
import type { SaveState } from "@/hooks/useTasks";

interface SaveButtonProps {
  saveState: SaveState;
  lastSavedAt: string | null;
  isDirty: boolean;
  onSave: () => void;
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Never saved";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 5) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * Force-save button for the top-right of the header.
 * - Cmd/Ctrl + S also triggers it.
 * - Per-edit PATCHes still happen automatically; this is the "snapshot" save.
 */
export default function SaveButton({
  saveState,
  lastSavedAt,
  isDirty,
  onSave,
}: SaveButtonProps) {
  // Live-updating "X ago" label
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // Cmd/Ctrl + S keyboard shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onSave]);

  const isSaving = saveState === "saving";
  const isSaved = saveState === "saved";
  const isError = saveState === "error";

  const baseClasses =
    "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-sm transition focus:outline-none focus-visible:ring-2";
  const stateClasses = isError
    ? "border-red-700 bg-red-950/50 text-red-200 hover:bg-red-900/60 focus-visible:ring-red-600"
    : isSaved
    ? "border-teal-700 bg-teal-900/50 text-teal-200 focus-visible:ring-teal-600"
    : isSaving
    ? "cursor-wait border-zinc-700 bg-zinc-900 text-zinc-400"
    : isDirty
    ? "border-blue-700 bg-blue-900/40 text-blue-100 hover:bg-blue-900/60 focus-visible:ring-blue-600"
    : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800 focus-visible:ring-zinc-600";

  const label = isSaving
    ? "Saving…"
    : isSaved
    ? "Saved"
    : isError
    ? "Save failed — retry"
    : isDirty
    ? "Save"
    : "Save snapshot";

  const icon = isSaving ? (
    <svg
      className="h-3.5 w-3.5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M21 12a9 9 0 0 1-9 9" strokeLinecap="round" />
    </svg>
  ) : isSaved ? (
    <span aria-hidden="true">✓</span>
  ) : isError ? (
    <span aria-hidden="true">!</span>
  ) : (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center items-end gap-0.5">
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className={`${baseClasses} ${stateClasses}`}
        title="Save full snapshot to public/tasks.json (Cmd/Ctrl+S)"
      >
        {icon}
        {label}
      </button>
      <span className="text-[10px] text-zinc-500 sm:ml-2" title={lastSavedAt ? `Last saved at ${new Date(lastSavedAt).toLocaleString()}` : undefined}>
        {isDirty && saveState === "idle"
          ? "Unsaved changes"
          : `Last saved ${formatRelative(lastSavedAt)}`}
      </span>
    </div>
  );
}
