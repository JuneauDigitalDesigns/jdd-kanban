# JDD Buildout Tracker

Local Kanban app for tracking the buildout of Juneau Digital Designs — 103 tasks
across 20 epics, with pre-researched step-by-step guidance baked into every
task. Dark Apple-esque theme. Runs entirely on your machine; no API keys
required at runtime.

## Quick start

```bash
cd C:\Users\Xander\Desktop\jdd-kanban
npm install
npm run dev
```

Open <http://localhost:3000>. No `.env.local` needed.

## How it works

- **Kanban board**: 5 columns by Status — Not Started → Started → In Progress → Testing → Done. Each column shows the 20 epic cards in their current Status; the per-card badge reads `X / Y done` showing sub-task completion.
- **Click an epic card** → right-side detail panel slides in. Header shows the epic name, an inline-editable Status chip, and a one-click "Mark Done" button. Below: editable Notes, then the full sub-task list.
- **Each sub-task row** has its own Status chip (inline-editable) and a "Mark Done" button.
- **Click any sub-task** → centered modal layers on top of the panel. Shows:
  - The sub-task's metadata (area, priority, effort, completion date)
  - A clickable "Belongs to" chip back to the parent epic
  - Editable notes
  - **A pre-baked step-by-step explanation** rendered as markdown — context, steps, verification, pitfalls
- **Close the modal** (ESC / backdrop / × button) → returns to the epic panel.

## Pre-baked explanations

Every task — epic and sub-task alike — ships with a permanent `explanation`
field containing ~200–400 words of markdown guidance:

- **Why this matters** — 1–2 sentences on what the task produces / why it blocks progress
- **Steps** — numbered, concrete actions (URLs, commands, file paths)
- **Verify** — how to confirm it's done
- **Pitfalls** — common gotchas

These were researched once and stored in [`src/data/explanations.ts`](src/data/explanations.ts).
The app does not call any AI at runtime — explanations load instantly with the
task data. No API key required. No latency on click. No spend per click.

### Updating an explanation

1. Edit [`src/data/explanations.ts`](src/data/explanations.ts) — find the task ID's key and update its markdown string.
2. Regenerate the JSON: `npx tsx scripts/generate-tasks-json.ts`.
3. Refresh the browser — the new explanation shows up.

## Data lives in `public/tasks.json`

The on-disk JSON file is the single source of truth.

- Every status/notes change in the UI is PATCHed to disk via `/api/tasks` immediately.
- You can edit `public/tasks.json` by hand at any time (with the dev server running) and refresh the browser — your manual edits will show up.
- The page is configured with `dynamic = "force-dynamic"`, so it always reads the file fresh on each request.
- `src/data/seed.ts` (merged with `src/data/explanations.ts`) is a TypeScript fallback if the file is missing.

### Schema

See [`src/data/types.ts`](src/data/types.ts). Each task is:

```ts
{
  id: "ep-1" | "st-001" | ...;
  name: string;
  status: "not_started" | "started" | "in_progress" | "testing" | "done";
  area: "ops_repo" | "site_template" | "jdd_site" | "external_setup" | "docs" | "live_testing" | "pre_launch";
  priority: "p0" | "p1" | "p2";
  effort: "s" | "m" | "l";
  notes: string;
  parentId: string | null;     // null = epic; otherwise the parent epic's id
  order: number;
  completedAt: string | null;  // ISO timestamp; auto-set when status flips to done
  explanation: string;         // markdown; pre-baked per task
}
```

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- `react-markdown` for rendering explanations

No live AI calls anymore — pre-baked explanations replaced the on-demand Claude integration.

## Project layout

```
src/
├── app/
│   ├── layout.tsx              # dark html root
│   ├── page.tsx                # reads tasks, renders <KanbanBoard>
│   ├── globals.css             # Tailwind + dark theme overrides
│   └── api/
│       └── tasks/route.ts      # GET full data, PATCH a single task
├── components/
│   ├── KanbanBoard.tsx         # 5 status columns + panel + modal hosts
│   ├── EpicCard.tsx            # card with progress badge
│   ├── TaskDetailPanel.tsx     # epic-only slide-in side panel
│   ├── SubTaskRow.tsx          # inline-editable sub-task row in the panel
│   ├── SubTaskDetailModal.tsx  # centered modal with notes + explanation
│   ├── StatusChip.tsx          # dropdown chip
│   ├── MarkDoneButton.tsx      # one-click "✓ Done"
│   └── ProgressBadge.tsx       # "X / Y done"
├── data/
│   ├── types.ts                # TypeScript shapes
│   ├── seed.ts                 # 103-task fallback
│   └── explanations.ts         # 103 pre-baked markdown explanations
├── hooks/
│   └── useTasks.ts             # client state + optimistic PATCH
└── lib/
    ├── tasks-io.ts             # atomic read/write of tasks.json
    └── progress.ts             # rollup helpers (epics, sub-tasks, progress)

scripts/
└── generate-tasks-json.ts      # regenerates public/tasks.json from seed.ts
```

## Deferred features

The schema is forward-compatible. Add later by extending `Task` in `src/data/types.ts`:

- **`dependsOn: string[]`** — block tasks behind prerequisites (dim/lock cards).
- **`links: { label: string; url: string }[]`** — clickable reference URLs per task.
- **Drag-and-drop** to move cards between columns (replace click-chip-to-change).
- **Webhook on Done** for piping milestones to Slack/Discord.
- **Auto-rollup**: epic auto-flips to Done when all sub-tasks complete.
