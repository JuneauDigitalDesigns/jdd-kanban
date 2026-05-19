"use client";

import { useEffect, useState } from "react";
import type { TaskUpdate, TrackerData } from "@/data/types";
import { getProgress, getSubTasks, getTask } from "@/lib/progress";
import StatusChip from "./StatusChip";
import MarkDoneButton from "./MarkDoneButton";
import ProgressBadge from "./ProgressBadge";
import SubTaskRow from "./SubTaskRow";

interface TaskDetailPanelProps {
  data: TrackerData;
  /** Epic ID (only epics open in the side panel; sub-tasks open in the modal). */
  taskId: string | null;
  onClose: () => void;
  onUpdate: (id: string, updates: TaskUpdate) => void | Promise<void>;
  onOpenSubTask: (id: string) => void;
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
 * Right-side slide-in panel for an epic. Sub-tasks shown in the list open in
 * SubTaskDetailModal (layered on top of this panel), not in the panel itself.
 */
export default function TaskDetailPanel({
  data,
  taskId,
  onClose,
  onUpdate,
  onOpenSubTask,
}: TaskDetailPanelProps) {
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
    return () => document.removeEventListener("keydown", onKey);
  }, [taskId, onClose]);

  if (!task) return null;

  // This panel only renders epics. If a sub-task is somehow passed in, render nothing.
  if (task.parentId !== null) return null;

  const progress = getProgress(data, task.id);
  const subs = getSubTasks(data, task.id);
  const areaLabel = data.enums.area.find((a) => a.id === task.area)?.label ?? task.area;
  const priorityLabel =
    data.enums.priority.find((p) => p.id === task.priority)?.label ?? task.priority;
  const effortLabel =
    data.enums.effort.find((e) => e.id === task.effort)?.label ?? task.effort;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] transition-opacity duration-200"
        aria-hidden="true"
      />
      {/* Sliding panel */}
      <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[520px] flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 transition-transform duration-200">
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-zinc-800 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
              <span className="font-mono">{task.id}</span>
              <span>·</span>
              <ProgressBadge progress={progress} size="sm" />
            </div>
            <h2 className="text-lg font-semibold leading-tight text-zinc-100">{task.name}</h2>
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
            aria-label="Close detail"
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          >
            ✕
          </button>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Metadata strip */}
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
              rows={4}
              className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-700 focus:outline-none"
            />
          </div>

          {/* Sub-tasks */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wide text-zinc-500">
                Sub-tasks
              </div>
              {progress.total > 0 && (
                <div className="text-[11px] text-zinc-500">{progress.label}</div>
              )}
            </div>
            {subs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-800 px-3 py-4 text-center text-xs text-zinc-500">
                No sub-tasks for this epic.
              </div>
            ) : (
              <div className="space-y-1.5">
                {subs
                  .slice()
                  .sort((a, b) => {
                    const order = (s: string) =>
                      data.enums.status.findIndex((o) => o.id === s);
                    return order(a.status) - order(b.status);
                  })
                  .map((st) => (
                    <SubTaskRow
                      key={st.id}
                      task={st}
                      data={data}
                      onUpdate={onUpdate}
                      onOpenSubTask={onOpenSubTask}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
