import type { Task, TrackerData } from "./types";
import { EXPLANATIONS } from "./explanations";

// Below, task literals omit the `explanation` field — it's attached from
// EXPLANATIONS at the bottom of the file. Use `Omit<Task, "explanation">`
// for the intermediate type so TS doesn't complain about missing fields.
type RawTask = Omit<Task, "explanation">;
type RawData = Omit<TrackerData, "tasks"> & { tasks: RawTask[] };

/**
 * Initial seed for the tracker. Mirrored as public/tasks.json — the JSON file
 * is the live source of truth; this TS const is used as fallback if that file
 * is missing or unreadable.
 *
 * Explanations are stored separately in ./explanations.ts and merged in
 * post-build. Keeps task metadata readable; long markdown lives in one file.
 */
const RAW: RawData = {
  version: "1.0.0",
  generated: "2026-05-16",
  meta: {
    totalTasks: 103,
    epics: 20,
    subTasks: 83,
    businessName: "Juneau Digital Designs",
    projectName: "JDD Buildout Tracker",
  },
  enums: {
    status: [
      { id: "not_started", label: "Not Started", color: "#52525b", order: 1 },
      { id: "started", label: "Started", color: "#1e3a8a", order: 2 },
      { id: "in_progress", label: "In Progress", color: "#2563eb", order: 3 },
      { id: "testing", label: "Testing", color: "#0e7490", order: 4 },
      { id: "done", label: "Done", color: "#0f766e", order: 5 },
    ],
    area: [
      { id: "ops_repo", label: "Ops Repo (jdd-ops)" },
      { id: "site_template", label: "Site Template" },
      { id: "jdd_site", label: "JDD Site" },
      { id: "external_setup", label: "External Service Setup" },
      { id: "docs", label: "Documentation" },
      { id: "live_testing", label: "Live Testing" },
      { id: "pre_launch", label: "Pre-Launch Checklist" },
    ],
    priority: [
      { id: "p0", label: "P0 — blocks first client", color: "#991b1b" },
      { id: "p1", label: "P1 — important", color: "#71717a" },
      { id: "p2", label: "P2 — nice to have", color: "#a1a1aa" },
    ],
    effort: [
      { id: "s", label: "S (≤30 min)" },
      { id: "m", label: "M (1–3 hr)" },
      { id: "l", label: "L (half day+)" },
    ],
  },
  tasks: [
    // ─── EPICS ───────────────────────────────────────────────────────────
    { id: "ep-1", name: "Ops repo scaffold (jdd-ops)", status: "done", area: "ops_repo", priority: "p0", effort: "l", notes: "Local folder C:\\Users\\Xander\\Desktop\\jdd-ops. Holds onboard.js orchestrator.", parentId: null, order: 1, completedAt: null },
    { id: "ep-2", name: "Business-site-template refactor", status: "done", area: "site_template", priority: "p0", effort: "m", notes: "Schema-driven Next.js 16 template cloned per client.", parentId: null, order: 2, completedAt: null },
    { id: "ep-3", name: "JDD onboarding wiring", status: "done", area: "jdd_site", priority: "p0", effort: "m", notes: "/onboarding form -> /api/onboarding -> Make webhook.", parentId: null, order: 3, completedAt: null },
    { id: "ep-4", name: "Lead capture (LeadForm to Retell)", status: "done", area: "site_template", priority: "p0", effort: "l", notes: "Visitor name+phone -> Retell calls within 60s.", parentId: null, order: 4, completedAt: null },
    { id: "ep-5", name: "Vercel env auto-sync", status: "done", area: "ops_repo", priority: "p0", effort: "m", notes: "onboard.js step 9 + npm run sync-env.", parentId: null, order: 5, completedAt: null },
    { id: "ep-6", name: "Plan-tier provisioning", status: "done", area: "ops_repo", priority: "p0", effort: "l", notes: "Starter/Growth/Enterprise branching in onboard.js.", parentId: null, order: 6, completedAt: null },
    { id: "ep-7", name: "E2E testing infrastructure", status: "done", area: "ops_repo", priority: "p0", effort: "m", notes: "Fixtures + dry-run + teardown + TESTING.md.", parentId: null, order: 7, completedAt: null },
    { id: "ep-8", name: "Enterprise cap correction", status: "done", area: "ops_repo", priority: "p1", effort: "s", notes: "Reduced max sites 10 to 3.", parentId: null, order: 8, completedAt: null },
    { id: "ep-9", name: "Operations runbook", status: "done", area: "docs", priority: "p1", effort: "m", notes: "jdd-ops/RUNBOOK.md.", parentId: null, order: 9, completedAt: null },
    { id: "ep-10", name: "External service accounts", status: "not_started", area: "external_setup", priority: "p0", effort: "l", notes: "API keys for 7 services.", parentId: null, order: 10, completedAt: null },
    { id: "ep-11", name: "Vercel x GitHub integration", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "Install Vercel GitHub App on xjuneau1.", parentId: null, order: 11, completedAt: null },
    { id: "ep-12", name: "Master Make.com scenario", status: "not_started", area: "external_setup", priority: "p0", effort: "m", notes: "Template scenario cloned per Growth/Enterprise client.", parentId: null, order: 12, completedAt: null },
    { id: "ep-13", name: "Push template to GitHub", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "xjuneau1/business-site-template private repo.", parentId: null, order: 13, completedAt: null },
    { id: "ep-14", name: "Push jdd-ops to GitHub", status: "not_started", area: "ops_repo", priority: "p2", effort: "s", notes: "Currently local only.", parentId: null, order: 14, completedAt: null },
    { id: "ep-15", name: "Live E2E test (Starter)", status: "not_started", area: "live_testing", priority: "p0", effort: "m", notes: "Verify Resend email path with real creds.", parentId: null, order: 15, completedAt: null },
    { id: "ep-16", name: "Live E2E test (Growth)", status: "not_started", area: "live_testing", priority: "p0", effort: "m", notes: "Verify Retell call within 60s + Airtable row.", parentId: null, order: 16, completedAt: null },
    { id: "ep-17", name: "Live E2E test (Enterprise)", status: "not_started", area: "live_testing", priority: "p1", effort: "l", notes: "2 sites shared Airtable base.", parentId: null, order: 17, completedAt: null },
    { id: "ep-18", name: "Stripe billing pipeline", status: "not_started", area: "pre_launch", priority: "p0", effort: "l", notes: "$147/$297/$697 subscriptions.", parentId: null, order: 18, completedAt: null },
    { id: "ep-19", name: "Looker Studio dashboard", status: "not_started", area: "pre_launch", priority: "p1", effort: "m", notes: "PDF section 13b monthly client report.", parentId: null, order: 19, completedAt: null },
    { id: "ep-20", name: "First paying client", status: "not_started", area: "pre_launch", priority: "p0", effort: "l", notes: "The launch goal.", parentId: null, order: 20, completedAt: null },

    // ─── EP-1 sub-tasks (5) ─────────────────────────────────────────────
    { id: "st-001", name: "Create jdd-ops folder + .gitignore + .env.example", status: "done", area: "ops_repo", priority: "p0", effort: "s", notes: "All credential keys defined.", parentId: "ep-1", order: 1, completedAt: null },
    { id: "st-002", name: "package.json + npm scripts", status: "done", area: "ops_repo", priority: "p0", effort: "s", notes: "onboard, sync-env, teardown, update-prompt.", parentId: "ep-1", order: 2, completedAt: null },
    { id: "st-003", name: "CLAUDE.md + README.md", status: "done", area: "ops_repo", priority: "p1", effort: "s", notes: "", parentId: "ep-1", order: 3, completedAt: null },
    { id: "st-004", name: "Implement onboard.js steps 1-8", status: "done", area: "ops_repo", priority: "p0", effort: "l", notes: "Schema validate, GitHub repo, write site.ts, build, Claude prompt, Retell agent, Twilio number, Airtable base.", parentId: "ep-1", order: 4, completedAt: null },
    { id: "st-005", name: "scripts/update-agent-prompt.js (live Retell PATCH)", status: "done", area: "ops_repo", priority: "p1", effort: "s", notes: "", parentId: "ep-1", order: 5, completedAt: null },

    // ─── EP-2 sub-tasks (5) ─────────────────────────────────────────────
    { id: "st-006", name: "Rename content.ts to site.ts; update 8 imports", status: "done", area: "site_template", priority: "p0", effort: "s", notes: "", parentId: "ep-2", order: 1, completedAt: null },
    { id: "st-007", name: "Rewrite CLAUDE.md and README.md for template", status: "done", area: "site_template", priority: "p1", effort: "s", notes: "", parentId: "ep-2", order: 2, completedAt: null },
    { id: "st-008", name: "Add selectedPlan/siteIndex/siteCount to ContentMeta", status: "done", area: "site_template", priority: "p0", effort: "s", notes: "", parentId: "ep-2", order: 3, completedAt: null },
    { id: "st-009", name: "Add resend dependency + .env.example", status: "done", area: "site_template", priority: "p0", effort: "s", notes: "", parentId: "ep-2", order: 4, completedAt: null },
    { id: "st-010", name: "Verify npm run build passes", status: "done", area: "site_template", priority: "p0", effort: "s", notes: "", parentId: "ep-2", order: 5, completedAt: null },

    // ─── EP-3 sub-tasks (4) ─────────────────────────────────────────────
    { id: "st-011", name: "app/lib/site-schema.ts with Intake type + mappers", status: "done", area: "jdd_site", priority: "p0", effort: "m", notes: "", parentId: "ep-3", order: 1, completedAt: null },
    { id: "st-012", name: "Wire /api/onboarding to POST Intake to Make webhook", status: "done", area: "jdd_site", priority: "p0", effort: "m", notes: "", parentId: "ep-3", order: 2, completedAt: null },
    { id: "st-013", name: "Rename premium to enterprise everywhere", status: "done", area: "jdd_site", priority: "p0", effort: "s", notes: "Fixed silent downgrade bug.", parentId: "ep-3", order: 3, completedAt: null },
    { id: "st-014", name: "Enterprise multi-site UI (Add another site button)", status: "done", area: "jdd_site", priority: "p0", effort: "m", notes: "Section 15.5 of the onboarding form.", parentId: "ep-3", order: 4, completedAt: null },

    // ─── EP-4 sub-tasks (4) ─────────────────────────────────────────────
    { id: "st-015", name: "Rewrite LeadForm.tsx with name+phone required", status: "done", area: "site_template", priority: "p0", effort: "m", notes: "Honeypot + phone validation included.", parentId: "ep-4", order: 1, completedAt: null },
    { id: "st-016", name: "Create /api/contact route (dual-mode webhook/email)", status: "done", area: "site_template", priority: "p0", effort: "m", notes: "LEAD_DELIVERY_MODE=email for Starter.", parentId: "ep-4", order: 2, completedAt: null },
    { id: "st-017", name: "Create CallbackModal.tsx floating FAB + modal", status: "done", area: "site_template", priority: "p1", effort: "m", notes: "", parentId: "ep-4", order: 3, completedAt: null },
    { id: "st-018", name: "Mount modal in VariationD.tsx + CSS", status: "done", area: "site_template", priority: "p1", effort: "s", notes: "", parentId: "ep-4", order: 4, completedAt: null },

    // ─── EP-5 sub-tasks (3) ─────────────────────────────────────────────
    { id: "st-019", name: "lib/vercel-sync.js shared module", status: "done", area: "ops_repo", priority: "p0", effort: "m", notes: "ensureProject + upsertEnvVar.", parentId: "ep-5", order: 1, completedAt: null },
    { id: "st-020", name: "Add step 9 to onboard.js", status: "done", area: "ops_repo", priority: "p0", effort: "s", notes: "", parentId: "ep-5", order: 2, completedAt: null },
    { id: "st-021", name: "scripts/sync-vercel-env.js standalone helper", status: "done", area: "ops_repo", priority: "p0", effort: "s", notes: "Re-runnable at Checkpoint 3.", parentId: "ep-5", order: 3, completedAt: null },

    // ─── EP-6 sub-tasks (6) ─────────────────────────────────────────────
    { id: "st-022", name: "loadIntake with INTAKE preferred + CONTENT fallback", status: "done", area: "ops_repo", priority: "p0", effort: "m", notes: "", parentId: "ep-6", order: 1, completedAt: null },
    { id: "st-023", name: "validateIntake with 2-3 site bound for Enterprise", status: "done", area: "ops_repo", priority: "p0", effort: "s", notes: "", parentId: "ep-6", order: 2, completedAt: null },
    { id: "st-024", name: "Refactor main loop to fan out per site", status: "done", area: "ops_repo", priority: "p0", effort: "l", notes: "Per-step log prefix shows site X/Y.", parentId: "ep-6", order: 3, completedAt: null },
    { id: "st-025", name: "Skip voice provisioning for plan=starter", status: "done", area: "ops_repo", priority: "p0", effort: "s", notes: "", parentId: "ep-6", order: 4, completedAt: null },
    { id: "st-026", name: "Shared Airtable base for Enterprise (Site singleSelect)", status: "done", area: "ops_repo", priority: "p0", effort: "m", notes: "", parentId: "ep-6", order: 5, completedAt: null },
    { id: "st-027", name: "Add --dry-run flag", status: "done", area: "ops_repo", priority: "p1", effort: "m", notes: "", parentId: "ep-6", order: 6, completedAt: null },

    // ─── EP-7 sub-tasks (6) ─────────────────────────────────────────────
    { id: "st-028", name: "Create _e2e-starter fixture", status: "done", area: "ops_repo", priority: "p1", effort: "s", notes: "", parentId: "ep-7", order: 1, completedAt: null },
    { id: "st-029", name: "Create _e2e-growth fixture", status: "done", area: "ops_repo", priority: "p1", effort: "s", notes: "", parentId: "ep-7", order: 2, completedAt: null },
    { id: "st-030", name: "Create _e2e-enterprise fixture (2 sites)", status: "done", area: "ops_repo", priority: "p1", effort: "s", notes: "", parentId: "ep-7", order: 3, completedAt: null },
    { id: "st-031", name: "Create _e2e-overflow fixture (4 sites negative test)", status: "done", area: "ops_repo", priority: "p2", effort: "s", notes: "", parentId: "ep-7", order: 4, completedAt: null },
    { id: "st-032", name: "scripts/teardown.js with _e2e- slug guard", status: "done", area: "ops_repo", priority: "p1", effort: "m", notes: "Deletes GitHub, Vercel, Twilio, Retell, Airtable, local folder.", parentId: "ep-7", order: 5, completedAt: null },
    { id: "st-033", name: "TESTING.md 3-layer playbook", status: "done", area: "docs", priority: "p1", effort: "m", notes: "Dry-run -> webhook.site -> live + teardown.", parentId: "ep-7", order: 6, completedAt: null },

    // ─── EP-8 sub-tasks (3) ─────────────────────────────────────────────
    { id: "st-034", name: "Cap route.ts additionalSites slice 9 to 2", status: "done", area: "jdd_site", priority: "p1", effort: "s", notes: "", parentId: "ep-8", order: 1, completedAt: null },
    { id: "st-035", name: "Update onboarding form (4 cap edits)", status: "done", area: "jdd_site", priority: "p1", effort: "s", notes: "", parentId: "ep-8", order: 2, completedAt: null },
    { id: "st-036", name: "Add upper-bound enterprise check in validateIntake", status: "done", area: "ops_repo", priority: "p1", effort: "s", notes: "", parentId: "ep-8", order: 3, completedAt: null },

    // ─── EP-9 sub-task (1) ──────────────────────────────────────────────
    { id: "st-037", name: "Write jdd-ops/RUNBOOK.md", status: "done", area: "docs", priority: "p1", effort: "m", notes: "One-time setup + per-client checkpoints.", parentId: "ep-9", order: 1, completedAt: null },

    // ─── EP-10 sub-tasks (8) ────────────────────────────────────────────
    { id: "st-038", name: "Sign up for Anthropic API, get ANTHROPIC_API_KEY", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "console.anthropic.com", parentId: "ep-10", order: 1, completedAt: null },
    { id: "st-039", name: "Sign up for Resend, verify sender domain", status: "not_started", area: "external_setup", priority: "p0", effort: "m", notes: "DNS records required. leads@juneaudigitaldesigns.com.", parentId: "ep-10", order: 2, completedAt: null },
    { id: "st-040", name: "Sign up for Twilio, get SID + Auth Token", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "Pre-load credit.", parentId: "ep-10", order: 3, completedAt: null },
    { id: "st-041", name: "Sign up for Retell, create LLM, pick voice", status: "not_started", area: "external_setup", priority: "p0", effort: "m", notes: "API key + LLM ID + voice ID.", parentId: "ep-10", order: 4, completedAt: null },
    { id: "st-042", name: "Sign up for Airtable, create PAT", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "data + schema scopes.", parentId: "ep-10", order: 5, completedAt: null },
    { id: "st-043", name: "Generate GitHub fine-grained PAT", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "repo + delete_repo on xjuneau1.", parentId: "ep-10", order: 6, completedAt: null },
    { id: "st-044", name: "Confirm Vercel team, generate VERCEL_TOKEN", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "", parentId: "ep-10", order: 7, completedAt: null },
    { id: "st-045", name: "Fill in jdd-ops/.env with all values", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "Last step after all keys gathered.", parentId: "ep-10", order: 8, completedAt: null },

    // ─── EP-11 sub-tasks (3) ────────────────────────────────────────────
    { id: "st-046", name: "Visit vercel.com/integrations/github, click Add Integration", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "", parentId: "ep-11", order: 1, completedAt: null },
    { id: "st-047", name: "Install Vercel app on xjuneau1 (All repositories)", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "All repos so new client repos auto-detected.", parentId: "ep-11", order: 2, completedAt: null },
    { id: "st-048", name: "Verify Vercel Add New Project lists xjuneau1 repos", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "", parentId: "ep-11", order: 3, completedAt: null },

    // ─── EP-12 sub-tasks (5) ────────────────────────────────────────────
    { id: "st-049", name: "Sign up for Make.com (free tier)", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "", parentId: "ep-12", order: 1, completedAt: null },
    { id: "st-050", name: "Create scenario with Custom Webhook trigger", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "", parentId: "ep-12", order: 2, completedAt: null },
    { id: "st-051", name: "Send sample payload so Make learns schema", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "", parentId: "ep-12", order: 3, completedAt: null },
    { id: "st-052", name: "Add HTTP module to Retell create-phone-call with placeholders", status: "not_started", area: "external_setup", priority: "p0", effort: "m", notes: "Leave TWILIO_NUMBER and RETELL_AGENT_ID as literals.", parentId: "ep-12", order: 4, completedAt: null },
    { id: "st-053", name: "Save and deactivate master scenario", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "", parentId: "ep-12", order: 5, completedAt: null },

    // ─── EP-13 sub-tasks (2) ────────────────────────────────────────────
    { id: "st-054", name: "Install gh CLI or create repo via GitHub web UI", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "", parentId: "ep-13", order: 1, completedAt: null },
    { id: "st-055", name: "Push business-site-template to xjuneau1 (private)", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "Currently only committed locally.", parentId: "ep-13", order: 2, completedAt: null },

    // ─── EP-15 sub-tasks (3) ────────────────────────────────────────────
    { id: "st-056", name: "Run npm run onboard --schema clients/_e2e-starter/site.ts (live)", status: "not_started", area: "live_testing", priority: "p0", effort: "s", notes: "", parentId: "ep-15", order: 1, completedAt: null },
    { id: "st-057", name: "Verify Resend email arrives after test lead", status: "not_started", area: "live_testing", priority: "p0", effort: "s", notes: "", parentId: "ep-15", order: 2, completedAt: null },
    { id: "st-058", name: "Run npm run teardown --slug _e2e-starter", status: "not_started", area: "live_testing", priority: "p1", effort: "s", notes: "", parentId: "ep-15", order: 3, completedAt: null },

    // ─── EP-16 sub-tasks (7) ────────────────────────────────────────────
    { id: "st-059", name: "Run npm run onboard --schema clients/_e2e-growth/site.ts (live)", status: "not_started", area: "live_testing", priority: "p0", effort: "s", notes: "", parentId: "ep-16", order: 1, completedAt: null },
    { id: "st-060", name: "Manually call purchased Twilio number, verify agent answers", status: "not_started", area: "live_testing", priority: "p0", effort: "s", notes: "Checkpoint 2 in PDF section 12.", parentId: "ep-16", order: 2, completedAt: null },
    { id: "st-061", name: "Clone master Make scenario, paste webhook URL into .env.local", status: "not_started", area: "live_testing", priority: "p0", effort: "s", notes: "Follow RUNBOOK Part B.", parentId: "ep-16", order: 3, completedAt: null },
    { id: "st-062", name: "Run npm run sync-env --slug _e2e-growth", status: "not_started", area: "live_testing", priority: "p0", effort: "s", notes: "", parentId: "ep-16", order: 4, completedAt: null },
    { id: "st-063", name: "Submit lead form on deployed site, verify Retell call within 60s", status: "not_started", area: "live_testing", priority: "p0", effort: "s", notes: "", parentId: "ep-16", order: 5, completedAt: null },
    { id: "st-064", name: "Verify Airtable row appears with call summary", status: "not_started", area: "live_testing", priority: "p0", effort: "s", notes: "", parentId: "ep-16", order: 6, completedAt: null },
    { id: "st-065", name: "Run npm run teardown --slug _e2e-growth", status: "not_started", area: "live_testing", priority: "p1", effort: "s", notes: "", parentId: "ep-16", order: 7, completedAt: null },

    // ─── EP-17 sub-tasks (6) ────────────────────────────────────────────
    { id: "st-066", name: "Run live Enterprise onboard (2 sites)", status: "not_started", area: "live_testing", priority: "p1", effort: "m", notes: "", parentId: "ep-17", order: 1, completedAt: null },
    { id: "st-067", name: "Verify 2 Vercel deployments + 2 Twilio numbers + 2 Retell agents", status: "not_started", area: "live_testing", priority: "p1", effort: "s", notes: "", parentId: "ep-17", order: 2, completedAt: null },
    { id: "st-068", name: "Verify shared Airtable base has Site column with both choices", status: "not_started", area: "live_testing", priority: "p1", effort: "s", notes: "", parentId: "ep-17", order: 3, completedAt: null },
    { id: "st-069", name: "Clone master Make scenario twice (one per site)", status: "not_started", area: "live_testing", priority: "p1", effort: "m", notes: "", parentId: "ep-17", order: 4, completedAt: null },
    { id: "st-070", name: "Submit lead on each site, verify correct routing", status: "not_started", area: "live_testing", priority: "p1", effort: "s", notes: "", parentId: "ep-17", order: 5, completedAt: null },
    { id: "st-071", name: "Run npm run teardown --slug _e2e-enterprise", status: "not_started", area: "live_testing", priority: "p1", effort: "s", notes: "", parentId: "ep-17", order: 6, completedAt: null },

    // ─── EP-18 sub-tasks (4) ────────────────────────────────────────────
    { id: "st-072", name: "Sign up for Stripe, verify business", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "", parentId: "ep-18", order: 1, completedAt: null },
    { id: "st-073", name: "Create 3 subscription products: Starter $147, Growth $297, Enterprise $697", status: "not_started", area: "external_setup", priority: "p0", effort: "s", notes: "", parentId: "ep-18", order: 2, completedAt: null },
    { id: "st-074", name: "Add Stripe checkout link to JDD /pricing page", status: "not_started", area: "jdd_site", priority: "p0", effort: "m", notes: "", parentId: "ep-18", order: 3, completedAt: null },
    { id: "st-075", name: "Wire Stripe webhook to gate onboarding form access", status: "not_started", area: "jdd_site", priority: "p0", effort: "l", notes: "", parentId: "ep-18", order: 4, completedAt: null },

    // ─── EP-19 sub-tasks (2) ────────────────────────────────────────────
    { id: "st-076", name: "Create master Looker Studio template", status: "not_started", area: "external_setup", priority: "p1", effort: "m", notes: "Call volume, GA4, Vercel Core Web Vitals.", parentId: "ep-19", order: 1, completedAt: null },
    { id: "st-077", name: "Document or script Looker clone step", status: "not_started", area: "ops_repo", priority: "p2", effort: "m", notes: "", parentId: "ep-19", order: 2, completedAt: null },

    // ─── EP-20 sub-tasks (6) ────────────────────────────────────────────
    { id: "st-078", name: "Find first prospect (cold outreach, referral, BNI)", status: "not_started", area: "pre_launch", priority: "p0", effort: "l", notes: "", parentId: "ep-20", order: 1, completedAt: null },
    { id: "st-079", name: "Complete 15-min discovery call", status: "not_started", area: "pre_launch", priority: "p0", effort: "s", notes: "", parentId: "ep-20", order: 2, completedAt: null },
    { id: "st-080", name: "Complete 15-min intake + Stripe charge", status: "not_started", area: "pre_launch", priority: "p0", effort: "s", notes: "", parentId: "ep-20", order: 3, completedAt: null },
    { id: "st-081", name: "Run onboard.js live for first paying client", status: "not_started", area: "pre_launch", priority: "p0", effort: "m", notes: "", parentId: "ep-20", order: 4, completedAt: null },
    { id: "st-082", name: "Walk through 3 Checkpoints (preview, agent test call, end-to-end form)", status: "not_started", area: "pre_launch", priority: "p0", effort: "m", notes: "", parentId: "ep-20", order: 5, completedAt: null },
    { id: "st-083", name: "Hand off domain, go live", status: "not_started", area: "pre_launch", priority: "p0", effort: "s", notes: "", parentId: "ep-20", order: 6, completedAt: null },
  ],
};

/**
 * The exported SEED merges RAW with EXPLANATIONS so every Task has the
 * `explanation` field populated. Empty string fallback if a task ID has no
 * explanation in the map (shouldn't happen — all 103 are covered).
 */
export const SEED: TrackerData = {
  ...RAW,
  tasks: RAW.tasks.map((t): Task => ({
    ...t,
    explanation: EXPLANATIONS[t.id] ?? "",
  })),
};

