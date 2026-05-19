import KanbanBoard from "@/components/KanbanBoard";
import { readTasks } from "@/lib/tasks-io";

// Always read fresh from disk on each request, so manual edits to
// public/tasks.json show up on the next page load.
export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await readTasks();
  return <KanbanBoard initial={data} />;
}
