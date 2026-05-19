"use client";

import type { Task, TaskUpdate, TrackerData } from "@/data/types";
import StatusChip from "./StatusChip";
import MarkDoneButton from "./MarkDoneButton";

interface SubTaskRowProps {
  task: Task;
  data: TrackerData;
  onUpdate: (id: string, updates: TaskUpdate) => void | Promise<void>;
  onOpenSubTask: (id: string) => void;
}

export default function SubTaskRow({
  task,
  data,
  onUpdate,
  onOpenSubTask,
}: SubTaskRowProps) {
  const effortLabel = data.enums.effort.find((e) => e.id === task.effort)?.label ?? task.effort;
  return (
    <div className="group flex items-start gap-3 rounded-lg border border-zinc-800/70 bg-zinc-950/40 px-3 py-2.5 transition hover:border-zinc-700 hover:bg-zinc-900/60">
      <button
        type="button"
        onClick={() => onOpenSubTask(task.id)}
        className="flex-1 min-w-0 text-left text-sm text-zinc-200 hover:text-white"
        title="Open details"
      >
        <div className="truncate font-medium">{task.name}</div>
        {task.notes && (
          <div className="mt-0.5 truncate text-xs text-zinc-500">{task.notes}</div>
        )}
      </button>
      <div className="flex shrink-0 items-center gap-2">
        <StatusChip
          value={task.status}
          options={data.enums.status}
          size="sm"
          onChange={(status) => onUpdate(task.id, { status })}
        />
        <span className="hidden text-[10px] uppercase tracking-wide text-zinc-500 sm:inline">
          {effortLabel.split(" ")[0]}
        </span>
        <MarkDoneButton
          currentStatus={task.status}
          size="sm"
          onMarkDone={() => onUpdate(task.id, { status: "done" })}
        />
      </div>
    </div>
  );
}
