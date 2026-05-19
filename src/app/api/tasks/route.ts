import { NextResponse } from "next/server";
import { readTasks, writeTasks } from "@/lib/tasks-io";
import type { StatusId, Task, TaskUpdate, TrackerData } from "@/data/types";

export async function GET() {
  const data = await readTasks();
  return NextResponse.json(data);
}

/**
 * Full-snapshot save. The Save button in the UI sends the entire current
 * TrackerData object — useful for forcing a write even when nothing has
 * changed via PATCH (e.g. after manual JSON edits, or as a confidence check).
 */
export async function PUT(request: Request) {
  let body: { data?: TrackerData };
  try {
    body = (await request.json()) as { data?: TrackerData };
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }
  const data = body.data;
  if (!data || !Array.isArray(data.tasks)) {
    return NextResponse.json(
      { message: "Body must be { data: TrackerData } with a tasks array." },
      { status: 400 },
    );
  }
  try {
    await writeTasks(data);
    return NextResponse.json({
      ok: true,
      savedAt: new Date().toISOString(),
      totalTasks: data.tasks.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Disk write failed";
    console.error("[tasks PUT] write failed:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}

interface PatchBody {
  id?: string;
  updates?: TaskUpdate;
}

const VALID_STATUSES = new Set<StatusId>([
  "not_started",
  "started",
  "in_progress",
  "testing",
  "done",
]);

export async function PATCH(request: Request) {
  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const updates = body.updates ?? {};
  if (!id) {
    return NextResponse.json({ message: "Missing task id." }, { status: 400 });
  }

  if (updates.status !== undefined && !VALID_STATUSES.has(updates.status)) {
    return NextResponse.json(
      { message: `Invalid status: ${updates.status}` },
      { status: 400 },
    );
  }
  if (updates.notes !== undefined && typeof updates.notes !== "string") {
    return NextResponse.json({ message: "notes must be a string." }, { status: 400 });
  }

  const data = await readTasks();
  const idx = data.tasks.findIndex((t) => t.id === id);
  if (idx === -1) {
    return NextResponse.json({ message: `Task not found: ${id}` }, { status: 404 });
  }

  const before = data.tasks[idx];
  const next: Task = { ...before };

  if (updates.status !== undefined) {
    next.status = updates.status;
    // Auto-manage completedAt: set when entering Done, clear when leaving Done.
    if (updates.status === "done" && before.status !== "done") {
      next.completedAt = new Date().toISOString();
    } else if (updates.status !== "done" && before.status === "done") {
      next.completedAt = null;
    }
  }
  if (updates.notes !== undefined) {
    next.notes = updates.notes;
  }

  data.tasks[idx] = next;
  await writeTasks(data);

  return NextResponse.json({ task: next });
}
