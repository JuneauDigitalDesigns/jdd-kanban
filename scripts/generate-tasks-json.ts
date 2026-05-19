/**
 * One-off generator: writes public/tasks.json from src/data/seed.ts.
 * Run after editing seed.ts or explanations.ts:
 *   npx tsx scripts/generate-tasks-json.ts
 */
import { writeFileSync } from "node:fs";
import { SEED } from "../src/data/seed";

writeFileSync("public/tasks.json", JSON.stringify(SEED, null, 2));
console.log(
  `Wrote public/tasks.json — ${SEED.tasks.length} tasks; ${
    SEED.tasks.filter((t) => t.explanation).length
  } with explanations.`,
);
