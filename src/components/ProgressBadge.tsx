import type { ProgressInfo } from "@/lib/progress";

interface ProgressBadgeProps {
  progress: ProgressInfo;
  size?: "sm" | "md";
}

export default function ProgressBadge({ progress, size = "md" }: ProgressBadgeProps) {
  if (progress.total === 0) return null;
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  const complete = progress.ratio >= 1;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${pad} ${
        complete
          ? "bg-teal-900/50 text-teal-300 ring-1 ring-inset ring-teal-700/50"
          : "bg-zinc-800 text-zinc-300 ring-1 ring-inset ring-zinc-700"
      }`}
      title={`${progress.done} of ${progress.total} sub-tasks complete`}
    >
      {complete ? "✓ " : ""}
      {progress.label}
    </span>
  );
}
