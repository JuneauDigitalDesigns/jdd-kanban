"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { StatusId, Task, TrackerData } from "@/data/types";
import { getEpics, getTask, getProgress } from "@/lib/progress";
import { useTasks } from "@/hooks/useTasks";
import EpicCard from "./EpicCard";
import KanbanColumn from "./KanbanColumn";
import TaskDetailPanel from "./TaskDetailPanel";
import SubTaskDetailModal from "./SubTaskDetailModal";
import SaveButton from "./SaveButton";

interface KanbanBoardProps {
  initial: TrackerData;
}

type SortKey =
  | "default"
  | "priority-hi"
  | "priority-lo"
  | "completed-most"
  | "completed-least"
  | "subtasks-most"
  | "subtasks-least";

const PRIORITY_ORDER: Record<string, number> = { p0: 0, p1: 1, p2: 2 };

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default",         label: "Default order" },
  { value: "priority-hi",     label: "Priority: High → Low" },
  { value: "priority-lo",     label: "Priority: Low → High" },
  { value: "completed-most",  label: "Most completed" },
  { value: "completed-least", label: "Least completed" },
  { value: "subtasks-most",   label: "Most sub-tasks" },
  { value: "subtasks-least",  label: "Least sub-tasks" },
];

const VALID_STATUSES = new Set<StatusId>([
  "not_started",
  "started",
  "in_progress",
  "testing",
  "done",
]);

export default function KanbanBoard({ initial }: KanbanBoardProps) {
  const { data, updateTask, error, saveAll, saveState, lastSavedAt, isDirty } =
    useTasks(initial);
  const [openEpicId, setOpenEpicId] = useState<string | null>(null);
  const [openSubTaskId, setOpenSubTaskId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("default");

  function sortEpics(items: Task[]): Task[] {
    if (sortBy === "default") return items;
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case "priority-hi":
          return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
        case "priority-lo":
          return (PRIORITY_ORDER[b.priority] ?? 9) - (PRIORITY_ORDER[a.priority] ?? 9);
        case "completed-most": {
          const pa = getProgress(data, a.id);
          const pb = getProgress(data, b.id);
          return pb.ratio - pa.ratio;
        }
        case "completed-least": {
          const pa = getProgress(data, a.id);
          const pb = getProgress(data, b.id);
          return pa.ratio - pb.ratio;
        }
        case "subtasks-most": {
          const pa = getProgress(data, a.id);
          const pb = getProgress(data, b.id);
          return pb.total - pa.total;
        }
        case "subtasks-least": {
          const pa = getProgress(data, a.id);
          const pb = getProgress(data, b.id);
          return pa.total - pb.total;
        }
        default:
          return 0;
      }
    });
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const epics = getEpics(data);
  const statusOptions = data.enums.status;
  const epicsByStatus: Record<StatusId, Task[]> = {
    not_started: [],
    started: [],
    in_progress: [],
    testing: [],
    done: [],
  };
  for (const e of epics) {
    epicsByStatus[e.status].push(e);
  }

  const totalDone = data.tasks.filter((t) => t.status === "done").length;
  const draggingTask = draggingId ? getTask(data, draggingId) : null;

  function handleDragStart(e: DragStartEvent) {
    setDraggingId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setDraggingId(null);
    const taskId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId || !VALID_STATUSES.has(overId as StatusId)) return;
    const newStatus = overId as StatusId;
    const task = getTask(data, taskId);
    if (!task || task.status === newStatus) return;
    updateTask(taskId, { status: newStatus });
  }

  function handleDragCancel() {
    setDraggingId(null);
  }

  return (
    <div className="min-h-screen bg-[#101013] text-[#ededee]">
      {/* Top bar */}
      <header
        className="sticky top-0 z-20 backdrop-blur-md"
        style={{
          borderBottom: "0.5px solid rgba(255,255,255,0.07)",
          background: "rgba(16,16,19,0.85)",
        }}
      >
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-base font-semibold tracking-tight">
              {data.meta.projectName}
            </h1>
            <p className="text-xs text-zinc-500">
              {data.meta.businessName} · {data.meta.totalTasks} tasks ·{" "}
              <span className="text-zinc-400">{totalDone} done</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Sort control */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "rgba(235,235,238,0.35)", whiteSpace: "nowrap" }}>
                Sort
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                style={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  background: "rgba(0, 0, 0, 0.60)",
                  border: "0.5px solid rgba(255,255,255,0.10)",
                  borderRadius: 8,
                  color: "rgba(235,235,238,0.75)",
                  fontSize: 12,
                  fontFamily: "inherit",
                  padding: "5px 28px 5px 10px",
                  cursor: "pointer",
                  outline: "none",
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(235,235,238,0.4)' d='M0 0h10L5 6z'/></svg>")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 9px center",
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-md border border-red-900/50 bg-red-950/40 px-3 py-1.5 text-xs text-red-300"
              >
                {error}
              </div>
            )}
            <SaveButton
              saveState={saveState}
              lastSavedAt={lastSavedAt}
              isDirty={isDirty}
              onSave={saveAll}
            />
          </div>
        </div>
      </header>

      {/* Kanban columns */}
      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <DndContext
          id="kanban-dnd"
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {statusOptions.map((opt) => {
              const items = sortEpics(epicsByStatus[opt.id as StatusId]);
              return (
                <KanbanColumn key={opt.id} option={opt} items={items}>
                  {items.map((task) => (
                    <EpicCard
                      key={task.id}
                      task={task}
                      data={data}
                      onClick={() => setOpenEpicId(task.id)}
                    />
                  ))}
                </KanbanColumn>
              );
            })}
          </div>

          <DragOverlay dropAnimation={null}>
            {draggingTask ? (
              <EpicCard task={draggingTask} data={data} onClick={() => {}} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      <TaskDetailPanel
        data={data}
        taskId={openEpicId}
        onClose={() => setOpenEpicId(null)}
        onUpdate={updateTask}
        onOpenSubTask={(id) => setOpenSubTaskId(id)}
      />

      <SubTaskDetailModal
        taskId={openSubTaskId}
        data={data}
        onClose={() => setOpenSubTaskId(null)}
        onUpdate={updateTask}
        onOpenEpic={(id) => setOpenEpicId(id)}
      />
    </div>
  );
}