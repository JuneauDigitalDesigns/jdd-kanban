"use client";

import { useCallback, useRef, useState } from "react";
import type { Task, TaskUpdate, TrackerData } from "@/data/types";

export type SaveState = "idle" | "saving" | "saved" | "error";

export interface UseTasks {
  data: TrackerData;
  updateTask: (id: string, updates: TaskUpdate) => Promise<void>;
  error: string | null;
  /** Force-write the entire current state to public/tasks.json on disk. */
  saveAll: () => Promise<void>;
  saveState: SaveState;
  lastSavedAt: string | null;
  /** When true, the in-memory state has diverged from the last saved snapshot. */
  isDirty: boolean;
}

/**
 * Client-side tasks state with optimistic PATCH-to-disk via /api/tasks for
 * single-task edits, plus a saveAll() that PUTs the full snapshot for
 * explicit "force save" via the Save button in the header.
 */
export function useTasks(initial: TrackerData): UseTasks {
  const [data, setData] = useState<TrackerData>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  // ref to a timer that resets the "saved" pill back to "idle" after 2s
  const savedResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateTask = useCallback(
    async (id: string, updates: TaskUpdate) => {
      setError(null);
      const idx = data.tasks.findIndex((t) => t.id === id);
      if (idx === -1) {
        setError(`Task not found: ${id}`);
        return;
      }
      const before = data.tasks[idx];
      const optimistic: Task = { ...before };
      if (updates.status !== undefined) {
        optimistic.status = updates.status;
        if (updates.status === "done" && before.status !== "done") {
          optimistic.completedAt = new Date().toISOString();
        } else if (updates.status !== "done" && before.status === "done") {
          optimistic.completedAt = null;
        }
      }
      if (updates.notes !== undefined) {
        optimistic.notes = updates.notes;
      }
      const nextTasks = data.tasks.slice();
      nextTasks[idx] = optimistic;
      setData({ ...data, tasks: nextTasks });
      setIsDirty(true);

      try {
        const res = await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, updates }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { message?: string };
          throw new Error(body.message || `HTTP ${res.status}`);
        }
        const { task } = (await res.json()) as { task: Task };
        setData((cur) => {
          const i = cur.tasks.findIndex((t) => t.id === id);
          if (i === -1) return cur;
          const tasks = cur.tasks.slice();
          tasks[i] = task;
          return { ...cur, tasks };
        });
        // PATCH succeeded → the on-disk file is up-to-date with this change.
        // Clear dirty flag UNLESS there are other in-flight changes; for the
        // single-call simplicity here, the per-PATCH write means we're clean.
        setIsDirty(false);
      } catch (err) {
        // Roll back
        setData((cur) => {
          const i = cur.tasks.findIndex((t) => t.id === id);
          if (i === -1) return cur;
          const tasks = cur.tasks.slice();
          tasks[i] = before;
          return { ...cur, tasks };
        });
        setError(err instanceof Error ? err.message : "Update failed");
        setIsDirty(true);
      }
    },
    [data],
  );

  const saveAll = useCallback(async () => {
    setError(null);
    setSaveState("saving");
    if (savedResetTimer.current) {
      clearTimeout(savedResetTimer.current);
      savedResetTimer.current = null;
    }
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message || `HTTP ${res.status}`);
      }
      const { savedAt } = (await res.json()) as { savedAt: string };
      setLastSavedAt(savedAt);
      setIsDirty(false);
      setSaveState("saved");
      savedResetTimer.current = setTimeout(() => {
        setSaveState("idle");
        savedResetTimer.current = null;
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaveState("error");
      savedResetTimer.current = setTimeout(() => {
        setSaveState("idle");
        savedResetTimer.current = null;
      }, 3000);
    }
  }, [data]);

  return { data, updateTask, error, saveAll, saveState, lastSavedAt, isDirty };
}
