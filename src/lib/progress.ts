import type { Task, TrackerData } from "@/data/types";

export interface ProgressInfo {
  done: number;
  total: number;
  label: string; // "3 / 5 done" or "" if no sub-tasks
  ratio: number; // 0..1; 0 when no sub-tasks
}

/** Computes how many sub-tasks of a given epic are Done. Works on any state slice. */
export function getProgress(data: TrackerData, epicId: string): ProgressInfo {
  const subs = data.tasks.filter((t) => t.parentId === epicId);
  const done = subs.filter((t) => t.status === "done").length;
  const total = subs.length;
  return {
    done,
    total,
    label: total === 0 ? "" : `${done} / ${total} done`,
    ratio: total === 0 ? 0 : done / total,
  };
}

/** Returns the sub-tasks of a parent, sorted by their order field. */
export function getSubTasks(data: TrackerData, parentId: string): Task[] {
  return data.tasks
    .filter((t) => t.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

/** Returns just the epics (top-level records), sorted by their order field. */
export function getEpics(data: TrackerData): Task[] {
  return data.tasks
    .filter((t) => t.parentId === null)
    .sort((a, b) => a.order - b.order);
}

/** Looks up a single task by id; returns undefined if missing. */
export function getTask(data: TrackerData, id: string): Task | undefined {
  return data.tasks.find((t) => t.id === id);
}
