import "server-only";
import { readFile, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { Redis } from "@upstash/redis";
import { SEED } from "@/data/seed";
import type { TrackerData } from "@/data/types";

const TASKS_PATH = resolve(process.cwd(), "public", "tasks.json");
const KV_KEY = "jdd-kanban:tasks";

function kvEnabled(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  );
}

let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}

async function readFromDisk(): Promise<TrackerData> {
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
 * Read the canonical tasks data. Uses Upstash Redis when its env vars are
 * present (production on Vercel); otherwise reads public/tasks.json from disk
 * (local dev). On first KV read it seeds from the bundled tasks.json.
 */
export async function readTasks(): Promise<TrackerData> {
  if (kvEnabled()) {
    const fromKV = await getRedis().get<TrackerData>(KV_KEY);
    if (fromKV && Array.isArray(fromKV.tasks)) return fromKV;
    const seed = await readFromDisk();
    await getRedis().set(KV_KEY, seed);
    return seed;
  }
  return readFromDisk();
}

/**
 * Persist the full tasks snapshot. KV path on Vercel, atomic file write
 * (tempfile + rename) on local dev so a crash mid-write doesn't corrupt JSON.
 */
export async function writeTasks(data: TrackerData): Promise<void> {
  if (kvEnabled()) {
    await getRedis().set(KV_KEY, data);
    return;
  }
  const tmpPath = `${TASKS_PATH}.tmp`;
  await writeFile(tmpPath, JSON.stringify(data, null, 2), "utf8");
  await rename(tmpPath, TASKS_PATH);
}
