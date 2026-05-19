"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Task, TaskUpdate, TrackerData } from "@/data/types";
import { getTask } from "@/lib/progress";
import StatusChip from "./StatusChip";
import MarkDoneButton from "./MarkDoneButton";

interface SubTaskDetailModalProps {
  taskId: string | null;
  data: TrackerData;
  onClose: () => void;
  onUpdate: (id: string, updates: TaskUpdate) => void | Promise<void>;
  onOpenEpic: (id: string) => void;
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px]">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-200">{value}</span>
    </span>
  );
}

/**
 * Centered modal that layers on top of the epic side panel. Shows full
 * sub-task details + the pre-baked explanation rendered as markdown.
 *
 * Closes on backdrop click, ESC, and the × button. Locks body scroll.
 */
export default function SubTaskDetailModal({
  taskId,
  data,
  onClose,
  onUpdate,
  onOpenEpic,
}: SubTaskDetailModalProps) {
  const task = taskId ? getTask(data, taskId) : undefined;
  const [notesDraft, setNotesDraft] = useState(task?.notes ?? "");

  useEffect(() => {
    setNotesDraft(task?.notes ?? "");
  }, [task?.id, task?.notes]);

  useEffect(() => {
    if (!taskId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [taskId, onClose]);

  if (!task) return null;

  const parent = task.parentId ? getTask(data, task.parentId) : null;
  const areaLabel = data.enums.area.find((a) => a.id === task.area)?.label ?? task.area;
  const priorityLabel =
    data.enums.priority.find((p) => p.id === task.priority)?.label ?? task.priority;
  const effortLabel =
    data.enums.effort.find((e) => e.id === task.effort)?.label ?? task.effort;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="subtask-modal-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60">
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-zinc-800 px-6 py-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
              {task.id}
            </div>
            <h2
              id="subtask-modal-title"
              className="text-lg font-semibold leading-snug text-zinc-100"
            >
              {task.name}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusChip
                value={task.status}
                options={data.enums.status}
                onChange={(status) => onUpdate(task.id, { status })}
              />
              <MarkDoneButton
                currentStatus={task.status}
                onMarkDone={() => onUpdate(task.id, { status: "done" })}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          >
            ✕
          </button>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Belongs to */}
          {parent && (
            <div className="mb-4">
              <div className="mb-1.5 text-[11px] uppercase tracking-wide text-zinc-500">
                Belongs to
              </div>
              <button
                type="button"
                onClick={() => {
                  onOpenEpic(parent.id);
                  onClose();
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800"
              >
                <span className="font-mono text-xs text-zinc-500">{parent.id}</span>
                <span>{parent.name}</span>
                <span aria-hidden="true" className="text-zinc-500">→</span>
              </button>
            </div>
          )}

          {/* Metadata chips */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            <MetaChip label="Area" value={areaLabel} />
            <MetaChip label="Priority" value={priorityLabel} />
            <MetaChip label="Effort" value={effortLabel} />
            {task.completedAt && (
              <MetaChip
                label="Done"
                value={new Date(task.completedAt).toLocaleDateString()}
              />
            )}
          </div>

          {/* Notes */}
          <div className="mb-5">
            <div className="mb-1.5 text-[11px] uppercase tracking-wide text-zinc-500">
              Notes
            </div>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={() => {
                if (notesDraft !== task.notes) onUpdate(task.id, { notes: notesDraft });
              }}
              placeholder="Add notes…"
              rows={3}
              className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-700 focus:outline-none"
            />
          </div>

          {/* Explanation */}
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-wide text-zinc-500">
              How to complete this
            </div>
            {task.explanation ? (
              <article className="prose-invert max-w-none text-sm leading-relaxed text-zinc-200">
                <ReactMarkdown>{task.explanation}</ReactMarkdown>
              </article>
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-800 px-3 py-4 text-center text-xs text-zinc-500">
                No explanation yet — see notes above.
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
