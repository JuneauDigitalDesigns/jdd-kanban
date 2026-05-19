import "server-only";
import { readFile, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { SEED } from "@/data/seed";
import type { TrackerData } from "@/data/types";

const TASKS_PATH = resolve(process.cwd(), "public", "tasks.json");

/**
 * Read the canonical tasks.json from disk. Falls back to the in-memory SEED
 * (with a console warning) if the file is missing or corrupt.
 */
export async function readTasks(): Promise<TrackerData> {
  try {
    const raw = await readFile(TASKS_PATH, "utf8");
    return JSON.parse(raw) as TrackerData;
  } catch (err) {
    console.warn(
      `[tasks-io] Could not read ${TASKS_PATH} — falling back to seed.`,
      err instanceof Error ? err.message : err,
    );
    return SEED;
  }
}

/**
 * Atomically write tasks.json. Writes to a tempfile then renames, so a crash
 * mid-write doesn't leave the on-disk JSON half-written.
 */
export async function writeTasks(data: TrackerData): Promise<void> {
  const tmpPath = `${TASKS_PATH}.tmp`;
  await writeFile(tmpPath, JSON.stringify(data, null, 2), "utf8");
  await rename(tmpPath, TASKS_PATH);
}
