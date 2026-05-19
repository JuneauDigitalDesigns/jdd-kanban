"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Task, TrackerData } from "@/data/types";
import { getProgress } from "@/lib/progress";

/** Apple-esque priority palette matching the design handoff */
const PRIORITY_COLORS: Record<string, { text: string; dot: string }> = {
  p0: { text: "#FF453A", dot: "#FF6961" },
  p1: { text: "#FF9F0A", dot: "#FFB340" },
  p2: { text: "#8E8E93", dot: "#A1A1A6" },
};

interface EpicCardProps {
  task: Task;
  data: TrackerData;
  onClick: () => void;
  /** When true, the card is a static visual clone rendered inside a DragOverlay. */
  isOverlay?: boolean;
}

export default function EpicCard({ task, data, onClick, isOverlay = false }: EpicCardProps) {
  const areaLabel = data.enums.area.find((a) => a.id === task.area)?.label ?? task.area;
  const effortLabel = data.enums.effort.find((e) => e.id === task.effort)?.label ?? task.effort;
  const progress = getProgress(data, task.id);
  const pct = progress.total > 0 ? progress.done / progress.total : 0;

  const pri = PRIORITY_COLORS[task.priority] ?? { text: "#8E8E93", dot: "#A1A1A6" };

  // Drag wiring (skipped when rendered as an overlay clone)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: isOverlay,
  });

  const style: React.CSSProperties | undefined = isOverlay
    ? undefined
    : {
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        opacity: isDragging ? 0 : 1,
      };

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      onClick={isOverlay ? undefined : onClick}
      role="button"
      tabIndex={isOverlay ? -1 : 0}
      onKeyDown={
        isOverlay
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
      }
      className={`group relative block w-full cursor-grab select-none text-left transition ${
        isOverlay
          ? "rotate-[1deg] scale-[1.02]"
          : "hover:-translate-y-px active:cursor-grabbing"
      }`}
      style={{
        ...style,
        borderRadius: 11,
        background: "#23232c",
        border: "0.5px solid rgba(255,255,255,0.07)",
        boxShadow: isOverlay
          ? "0 1px 0 rgba(255,255,255,0.05) inset, 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.12)"
          : "0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.4)",
        padding: "12px 12px 11px",
      }}
    >
      {/* Priority row */}
      <div className="mb-2 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.04em]"
          style={{ color: pri.text }}
        >
          <i
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: pri.dot,
              boxShadow: `0 0 0 2.5px ${pri.dot}33`,
              flexShrink: 0,
            }}
          />
          {task.priority.toUpperCase()}
        </span>

        {/* Grab handle — visible on hover */}
        <span
          className="text-white/20 transition-opacity duration-100 group-hover:opacity-100"
          style={{ opacity: isOverlay ? 1 : undefined }}
          aria-hidden
        >
          <svg viewBox="0 0 8 14" width={6} height={11} fill="currentColor">
            <circle cx="2" cy="2"  r="1" />
            <circle cx="6" cy="2"  r="1" />
            <circle cx="2" cy="7"  r="1" />
            <circle cx="6" cy="7"  r="1" />
            <circle cx="2" cy="12" r="1" />
            <circle cx="6" cy="12" r="1" />
          </svg>
        </span>
      </div>

      {/* ID */}
      <div className="mb-1 font-mono text-[9px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.22)" }}>
        {task.id}
      </div>

      {/* Title */}
      <h3
        className="mb-3 line-clamp-2 text-[13px] font-medium leading-[1.35]"
        style={{ color: "#ededee", letterSpacing: "-0.005em", margin: "0 0 10px" }}
      >
        {task.name}
      </h3>

      {/* Meta chips */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span
          className="rounded-full px-2 py-0.5 text-[10px]"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "0.5px solid rgba(255,255,255,0.08)",
            color: "rgba(235,235,238,0.55)",
          }}
        >
          {areaLabel}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] uppercase"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "0.5px solid rgba(255,255,255,0.08)",
            color: "rgba(235,235,238,0.55)",
          }}
        >
          {effortLabel}
        </span>
      </div>

      {/* Progress bar */}
      {progress.total > 0 && (
        <div className="flex items-center gap-2">
          <div
            className="min-w-0 flex-1 overflow-hidden rounded-full"
            style={{ height: 3, background: "rgba(255,255,255,0.07)" }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${pct * 100}%`, background: "#0A84FF" }}
            />
          </div>
          <span
            className="shrink-0 font-mono text-[10px] tabular-nums"
            style={{ color: "rgba(235,235,238,0.35)", minWidth: 28, textAlign: "right" }}
          >
            {progress.done}/{progress.total}
          </span>
        </div>
      )}
    </div>
  );
}


