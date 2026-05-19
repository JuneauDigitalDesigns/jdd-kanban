/**
 * Type definitions for the JDD Buildout Tracker.
 *
 * The on-disk source of truth is public/tasks.json; src/data/seed.ts contains
 * the same data as a TS const for fallback if the JSON file is missing.
 */

export type StatusId = "not_started" | "started" | "in_progress" | "testing" | "done";
export type AreaId =
  | "ops_repo"
  | "site_template"
  | "jdd_site"
  | "external_setup"
  | "docs"
  | "live_testing"
  | "pre_launch";
export type PriorityId = "p0" | "p1" | "p2";
export type EffortId = "s" | "m" | "l";

export interface EnumValue {
  id: string;
  label: string;
  color?: string;
  order?: number;
}

export interface Task {
  id: string;
  name: string;
  status: StatusId;
  area: AreaId;
  priority: PriorityId;
  effort: EffortId;
  notes: string;
  parentId: string | null;
  order: number;
  /** ISO timestamp set when status flips to "done"; cleared when status moves away. */
  completedAt: string | null;
  /** Pre-baked markdown guidance for how to complete this task. Shown in the SubTaskDetailModal. */
  explanation: string;
}

export interface TrackerData {
  version: string;
  generated: string;
  meta: {
    totalTasks: number;
    epics: number;
    subTasks: number;
    businessName: string;
    projectName: string;
  };
  enums: {
    status: EnumValue[];
    area: EnumValue[];
    priority: EnumValue[];
    effort: EnumValue[];
  };
  tasks: Task[];
}

export type TaskUpdate = Partial<Pick<Task, "status" | "notes">>;
