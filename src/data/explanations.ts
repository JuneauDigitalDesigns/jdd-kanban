/**
 * Pre-baked step-by-step guidance for every task in the JDD Buildout Tracker.
 *
 * Each entry is markdown rendered by react-markdown in the SubTaskDetailModal.
 * Format per explanation:
 *   ## Why this matters
 *   ## Steps
 *   ## Verify
 *   ## Pitfalls
 *
 * Keep these in sync with the actual code paths in jdd-ops, business-site-template,
 * and juneau-digital-designs. If the implementation changes, update the matching
 * explanation here so the tracker stays a reliable source of truth.
 */

export const EXPLANATIONS: Record<string, string> = {
  // ════════════════════════════════════════════════════════════════════════
  // EPICS — top-level summaries of each block of work
  // ════════════════════════════════════════════════════════════════════════

  "ep-1": `## Why this matters

The ops repo is the orchestration brain of the entire JDD business. Every client provisioning run starts here. Without it, you have no way to spin up a client's site + voice agent reliably.

## Steps

1. Folder lives at \`C:\\Users\\Xander\\Desktop\\jdd-ops\` — local only, never deployed.
2. Houses the master \`.env\` (gitignored) with credentials for all 7 external services.
3. \`onboard.js\` runs the 9-step provisioning pipeline; sub-scripts in \`scripts/\` handle re-runs.
4. \`clients/{slug}/\` subdirectories hold each client's intake schema, env state, and cloned site repo.

## Verify

- \`cd jdd-ops && node onboard.js --help\` prints usage and exits cleanly.
- \`ls clients/\` shows your provisioned clients plus the \`_e2e-*\` fixtures.
- \`.env.example\` is committed; \`.env\` is gitignored.

## Pitfalls

- Never commit \`.env\` or \`clients/*/.env.local\` — they contain master credentials.
- Keep the repo local until you've removed any accidental secrets from history.
`,

  "ep-2": `## Why this matters

The business-site-template is what \`onboard.js\` clones for every client. Schema-driven means one repo serves all clients — the per-client content lives in \`src/data/site.ts\`, which is overwritten during provisioning.

## Steps

1. Located at \`C:\\Users\\Xander\\Desktop\\business-site-template\\business-template\`.
2. All brand, palette, copy, and SEO flows from \`src/data/site.ts\` (exports \`CONTENT\` typed as \`SiteContent\`).
3. Palette → CSS custom properties wired in \`VariationD.tsx\`. No hardcoded colors.
4. Tailwind 4 + Next.js 16 App Router + TypeScript.

## Verify

- \`cd business-template && npm run build\` passes.
- Search for \`@/data/content\` returns zero matches (rename complete).
- \`CLAUDE.md\` references \`src/data/site.ts\` consistently.

## Pitfalls

- Never hardcode brand values in components. Always \`import { CONTENT } from '@/data/site'\`.
- After \`onboard.js\` writes a client's content, the template's \`site.ts\` still has the PEAK placeholder — that's fine. The clone is what gets written to.
`,

  "ep-3": `## Why this matters

The JDD site itself has to capture client intake (brand, palette, services, etc.) and forward it as a typed JSON envelope to Make.com. This is how a new client triggers provisioning.

## Steps

1. \`/onboarding\` page renders the multi-section form (\`onboardingpageclient.tsx\`).
2. Form posts to \`/api/onboarding\`, which Turnstile-verifies, sanitizes, maps to the \`Intake\` envelope, and forwards to \`MAKE_WEBHOOK_URL\`.
3. The wire format is \`{ plan, siteCount, sites: SiteContent[] }\` — uniform across all three tiers.
4. Enterprise selections trigger the "+ Add another site" UI (max 2 additional = 3 sites total).

## Verify

- Submit the form locally with \`MAKE_WEBHOOK_URL\` pointing at webhook.site. The payload should have the right \`plan\` value and \`sites.length\` matching what was entered.
- The Resend email backup still arrives.

## Pitfalls

- The slug used to be \`premium\` in the API but \`enterprise\` in the form — bug fixed via rename. Don't reintroduce.
- If \`MAKE_WEBHOOK_URL\` is unset in JDD's env, the API returns 500 — set it via \`.env.local\`.
`,

  "ep-4": `## Why this matters

The Retell agent provisioned per client is useless without a way to receive the lead's phone number. The LeadForm + /api/contact route is the bridge that triggers the outbound call within 60 seconds.

## Steps

1. \`LeadForm.tsx\` collects name (required) + phone (required) + email (optional). Honeypot for bot defense.
2. \`/api/contact\` validates, then POSTs to \`MAKE_WEBHOOK_URL\` (Growth/Enterprise) OR sends Resend email (Starter).
3. Make.com fires Retell \`create-phone-call\` with the lead's phone + the client's agent_id + their Twilio number.
4. \`CallbackModal.tsx\` is a floating "Get a callback now" FAB version of the same flow.

## Verify

- \`npm run dev\` in the template; submit the form with your phone → in webhook mode you see a payload at webhook.site, in email mode you get a Resend email.
- The callback modal opens/closes via ESC + backdrop + close button.

## Pitfalls

- Phone is required because Retell can't call without it. Don't add a "skip phone" option.
- \`LEAD_DELIVERY_MODE\` env var must be set per client (\`email\` for Starter, \`webhook\` for Growth/Enterprise). \`onboard.js\` step 9 sets this automatically.
`,

  "ep-5": `## Why this matters

The deployed client site needs runtime env vars (MAKE_WEBHOOK_URL, RESEND_API_KEY, etc.). Without auto-sync to Vercel, you'd have to manually paste env vars per client per project — error-prone.

## Steps

1. \`jdd-ops/lib/vercel-sync.js\` exports \`syncEnvToVercel({ slug, clientDir, extraEnv })\`.
2. Step 9 of \`onboard.js\` calls it after \`commitAndPush\` runs.
3. Reads \`clients/{slug}/.env.local\`, upserts each key via Vercel API (\`POST /v10/projects/{slug}/env\` with PATCH-on-409 fallback).
4. Standalone script \`scripts/sync-vercel-env.js\` re-runs it at Checkpoint 3 after pasting \`MAKE_WEBHOOK_URL\`.

## Verify

- Run \`npm run sync-env -- --slug _e2e-growth\` with VERCEL_TOKEN set; check the Vercel dashboard for the project's env vars.
- Re-running the sync is idempotent (PATCHes existing values rather than duplicating).

## Pitfalls

- Requires the Vercel GitHub App to be installed on \`xjuneau1\` so projects auto-create. See EP-11.
- Empty values in \`.env.local\` are skipped (logged as "skipped"). Fill them and re-run sync.
`,

  "ep-6": `## Why this matters

Different plan tiers buy different things. Starter clients don't need a Retell agent. Enterprise clients need 2–3 sites with shared voice minutes. The orchestrator must branch correctly per plan or you waste API quota / mis-provision.

## Steps

1. \`onboard.js\` reads \`intake.plan\` (one of \`starter | growth | enterprise\`).
2. Starter: skip steps 6/7/8 entirely; site only; \`LEAD_DELIVERY_MODE=email\` in env.
3. Growth: full pipeline; 1 Retell agent + 1 Twilio number + 1 Airtable base.
4. Enterprise: loop the pipeline per site (\`sites.length\` = 2 or 3); shared Airtable base with a Site singleSelect column; agents share the master Retell account's minute pool.

## Verify

- Dry-run the three fixtures: \`node onboard.js --schema clients/_e2e-{starter|growth|enterprise}/site.ts --dry-run\` produces the right step sequence for each.
- Enterprise dry-run shows \`site 1/2\` and \`site 2/2\` markers and reuses the Airtable base on iteration 2.

## Pitfalls

- Single-site Enterprise is rejected by \`validateIntake\` (range 2–3 enforced).
- Enterprise sites must have unique \`brand.short\` values — used to derive slug names like \`{baseSlug}-1\`, \`{baseSlug}-2\`.
`,

  "ep-7": `## Why this matters

Provisioning is too expensive to test ad-hoc on live APIs. Fixtures let you validate plan branching without burning Twilio inventory or Retell minutes. Teardown lets you clean up after live tests so you don't leave orphaned resources.

## Steps

1. Four fixtures under \`jdd-ops/clients/_e2e-*/site.ts\`: starter, growth, enterprise (2 sites), overflow (4 sites — negative test).
2. \`--dry-run\` flag in \`onboard.js\` simulates the full pipeline without API calls.
3. \`scripts/teardown.js\` deletes every resource created for a slug (GitHub repo, Vercel project, Twilio number, Retell agent, Airtable base, local folder). Refuses non-\`_e2e-\` slugs as a safety guard.
4. \`TESTING.md\` documents the 3-layer playbook: dry-run → webhook.site → live + teardown.

## Verify

- \`node onboard.js --schema clients/_e2e-overflow/site.ts --dry-run\` exits with non-zero, error: "enterprise plan requires 2 or 3 sites (got 4)".
- All three positive fixtures dry-run with exit 0.

## Pitfalls

- Never modify the \`_e2e-\` slug guard in teardown.js — it's what stops you from accidentally tearing down a real paying client.
- Make scenarios aren't auto-deleted by teardown — clean those up manually in the Make dashboard.
`,

  "ep-8": `## Why this matters

Enterprise was originally capped at 10 sites in the form. That's the wrong product fit — Enterprise is "2 or 3 sites that share minutes," anything bigger is a different SKU. Wrong cap leads to overpromised UI and confused customers.

## Steps

1. \`app/api/onboarding/route.ts\` line 463: \`slice(0, 9)\` → \`slice(0, 2)\` (max 2 additional + 1 primary = 3 total).
2. \`app/components/onboarding/onboardingpageclient.tsx\` — 4 edits to button gate, label counter, intro text, and field comment.
3. \`jdd-ops/onboard.js validateIntake\` — added upper bound check: rejects when \`sites.length > 3\`.
4. \`jdd-ops/CLAUDE.md\` table cell: \`N (2–10)\` → \`N (2–3)\`.

## Verify

- Open the form, select Enterprise. The "+ Add another site" button disappears after 2 additional sites.
- \`_e2e-overflow\` fixture (4 sites) is rejected by the validator with exit code 1.
- \`_e2e-enterprise\` fixture (2 sites) still passes.

## Pitfalls

- If you ever introduce a higher-tier plan later, don't reuse the \`enterprise\` slug — add a new one (e.g., \`agency\`) with its own cap.
`,

  "ep-9": `## Why this matters

The provisioning pipeline has two external dependencies that require one-time manual setup (Vercel GitHub App install + master Make.com scenario). Without a checked-in runbook, that knowledge lives in your head and disappears under pressure.

## Steps

1. \`jdd-ops/RUNBOOK.md\` documents the full setup, divided into:
   - **Part A** — one-time setup before first paid client (master \`.env\`, push template to GitHub, Vercel GitHub App, master Make scenario).
   - **Part B** — per-client setup at Checkpoint 3 (clone Make scenario, paste webhook URL, run sync-env, redeploy).
   - **Part C** — rationale for per-client clones (Retell agent_id + Twilio from_number differ per client).
   - **Part D** — cleanup of test resources.

## Verify

- Open \`jdd-ops/RUNBOOK.md\` and read it top-to-bottom. Each step should have concrete URLs, commands, or file paths — no hand-waving.
- A new operator could follow it without asking you questions.

## Pitfalls

- Keep the runbook updated when the pipeline changes. Stale runbooks are worse than no runbook.
`,

  "ep-10": `## Why this matters

\`onboard.js\` needs credentials for 7 external services to run. Until your master \`.env\` is fully populated, even dry-runs will hit "Missing required env" failures. This is the gating step before any live provisioning works.

## Steps

1. Sign up for each service (see sub-tasks). Generate API keys, copy IDs.
2. Fill \`C:\\Users\\Xander\\Desktop\\jdd-ops\\.env\` (copy from \`.env.example\`).
3. Anthropic, Resend, Twilio, Retell (+ LLM + voice IDs), Airtable (+ workspace ID), GitHub (PAT), Vercel (token + team ID).

## Verify

- \`cd jdd-ops && node -e "require('dotenv').config(); console.log(Object.keys(process.env).filter(k => process.env[k] && k.match(/ANTHROPIC|TWILIO|RETELL|AIRTABLE|GITHUB|VERCEL|RESEND/)))"\` lists every key with a value.
- A dry-run of \`_e2e-growth\` reaches step 9 without "Missing required env" errors.

## Pitfalls

- Don't commit \`.env\` — \`.gitignore\` already excludes it but double-check.
- Use **fine-grained** GitHub PATs scoped to \`xjuneau1\` only, not classic tokens with broad access.
- Resend sender domain takes ~1 hour to verify DNS — start that early.
`,

  "ep-11": `## Why this matters

\`onboard.js\` step 9 calls Vercel's \`POST /v10/projects\` with a \`gitRepository\` field. Without the Vercel GitHub App installed on your org, this 403s and the deployment never starts.

## Steps

1. Sign in to vercel.com with the team that owns client projects.
2. Visit \`https://vercel.com/integrations/github\` → Add Integration → pick your Vercel team scope.
3. On GitHub: install to \`xjuneau1\` → "All repositories" (not "Only select repositories" — otherwise every new client repo needs manual allowlisting).
4. Verify in Vercel dashboard → Add New Project → repos under \`xjuneau1\` should appear in the picker.

## Verify

- The Vercel dashboard's "Add New Project" picker lists at least \`business-site-template\` and any existing client repos.
- After provisioning a test client, the Vercel project appears within seconds of the GitHub push.

## Pitfalls

- "Only select repositories" is the default and the most common cause of failed Vercel provisioning. Always pick "All repositories" for this use case.
- The integration is per Vercel team — if you switch teams later, you need to install it again on the new team.
`,

  "ep-12": `## Why this matters

Make.com is the glue between a client site's \`/api/contact\` and Retell's \`create-phone-call\`. The master scenario is the template you clone per client — each clone hardcodes that one client's \`agent_id\` and Twilio \`from_number\`. Without the master, you'd rebuild the scenario from scratch every time.

## Steps

1. Sign up for Make.com (free tier covers single-tenant ops fine).
2. New scenario: Webhook trigger module → HTTP module → optional notification.
3. HTTP module body uses literal placeholders \`<<<TWILIO_NUMBER>>>\` and \`<<<RETELL_AGENT_ID>>>\` so clones know what to replace.
4. Send a sample payload to the webhook so Make learns the schema.
5. Save and deactivate. Clones are the only scenarios that actually run.

## Verify

- The master scenario is visible in your dashboard and inactive.
- Cloning it produces a new scenario with the same structure and a new webhook URL.

## Pitfalls

- Activate clones, not the master. Activating the master would call Retell with the literal placeholder strings as agent_id and immediately fail.
- Don't accidentally share one scenario across clients — different clients have different agent_ids and from_numbers.
`,

  "ep-13": `## Why this matters

\`onboard.js\` step 2 calls \`octokit.repos.createUsingTemplate\` against \`TEMPLATE_REPO\` (env value: \`xjuneau1/business-site-template\`). Until that repo exists on GitHub, every provisioning run fails at step 2.

## Steps

1. Install GitHub CLI (\`gh\`) or use the GitHub web UI to create an empty private repo at \`xjuneau1/business-site-template\`.
2. Run from \`business-site-template/business-template/\`:
   \`\`\`
   gh repo create xjuneau1/business-site-template --private --source=. --push
   \`\`\`
3. Or manual: \`git remote add origin https://github.com/xjuneau1/business-site-template.git && git push -u origin master\`.

## Verify

- \`gh repo view xjuneau1/business-site-template\` returns the repo with CLAUDE.md visible.
- A test \`onboard.js\` run gets past step 2 (no "Could not create repo from template" error).

## Pitfalls

- The repo must be private (you don't want clients' site templates publicly browsable before launch).
- After pushing, mark the repo as a "Template repository" in GitHub Settings → makes the createUsingTemplate API work.
`,

  "ep-14": `## Why this matters

\`jdd-ops\` is currently local-only. If your laptop dies you lose the master \`.env\` (which you can rebuild from the API dashboards) AND all your client folders + state (which you cannot easily reconstruct). Pushing to GitHub backs it up.

## Steps

1. Create private repo \`xjuneau1/jdd-ops\` on GitHub.
2. In \`jdd-ops\`: \`git init && git add -A && git commit -m "Initial commit"\`.
3. \`git remote add origin https://github.com/xjuneau1/jdd-ops.git && git push -u origin main\`.
4. Confirm \`.gitignore\` excludes \`.env\` and \`clients/*/.env.local\`.

## Verify

- \`git log\` shows the commit.
- \`gh repo view xjuneau1/jdd-ops\` shows the repo with onboard.js + scripts visible.
- \`git status\` after \`git add -A\` does NOT show \`.env\` or any \`.env.local\` files.

## Pitfalls

- Double-check \`.env\` isn't tracked before pushing. If it is, \`git rm --cached .env\` and re-commit BEFORE pushing.
- Don't push individual client folders' \`.env.local\` — they contain Retell + Twilio + Airtable IDs that shouldn't be in git.
`,

  "ep-15": `## Why this matters

You need to prove the Starter pipeline (site only, no voice) works end-to-end before charging a real client. The \`_e2e-starter\` fixture is built for exactly this: a disposable test client you can provision, verify, and tear down.

## Steps

1. \`node onboard.js --schema clients/_e2e-starter/site.ts\` (live, not dry-run).
2. Wait for the handoff summary. Note the GitHub repo URL.
3. Vercel auto-deploys. Visit the preview URL.
4. Submit the lead form on the deployed site → Resend should email \`owner+e2estarter@juneaudigitaldesigns.com\`.
5. \`npm run teardown -- --slug _e2e-starter\` to clean up.

## Verify

- The Vercel deployment loads without errors.
- The Resend email arrives within 30 seconds.
- After teardown, the GitHub repo + Vercel project are gone.

## Pitfalls

- Make sure \`RESEND_API_KEY\` and \`RESEND_FROM_EMAIL\` are set in \`jdd-ops/.env\` first — these get pushed to the client's Vercel env automatically.
- Resend sender domain must be verified or emails won't deliver.
`,

  "ep-16": `## Why this matters

Growth is your highest-volume tier. You need to prove the full voice pipeline — site + Retell agent + Twilio number + Make routing + Airtable logging — works end-to-end with real APIs. This live test catches issues that dry-runs can't (Twilio number availability, Retell agent config, Make routing).

## Steps

1. \`node onboard.js --schema clients/_e2e-growth/site.ts\` (live).
2. Handoff prints Twilio number + Retell agent ID + Airtable base ID.
3. Manually call the Twilio number → Retell agent answers with brand greeting (Checkpoint 2).
4. Clone master Make scenario, paste webhook URL into \`clients/_e2e-growth/.env.local\`, run \`npm run sync-env -- --slug _e2e-growth\`, redeploy.
5. Submit the lead form on the deployed site with your phone → Retell calls you within 60 seconds.
6. After hangup, an Airtable row appears in the client's Calls base.
7. \`npm run teardown -- --slug _e2e-growth\`.

## Verify

- Inbound test call connects and hits the agent.
- Outbound callback fires within 60s of form submission.
- Airtable row contains caller info, summary, duration.

## Pitfalls

- Forget to paste the Make webhook URL → form submissions 500 and no callback happens.
- Use your own phone number for the test, not a Google Voice or VOIP number that filters spam-flagged numbers.
`,

  "ep-17": `## Why this matters

Enterprise is the most complex tier — 2 or 3 sites, separate phone numbers per site, but shared Retell minutes and a shared Airtable base. Many things have to compose correctly: per-site routing, the Site column in Airtable, distinct Make scenarios. Live test catches per-site mix-ups.

## Steps

1. \`node onboard.js --schema clients/_e2e-enterprise/site.ts\` (live).
2. Verify 2 Vercel deployments (\`_e2e-enterprise-1\`, \`_e2e-enterprise-2\`).
3. Verify 2 Twilio numbers, 2 Retell agents, 1 shared Airtable base with Site singleSelect column.
4. Clone the master Make scenario twice — once per site, each pointed at its own agent_id + from_number.
5. Submit a lead on each deployed site → 2 distinct calls land on your phone with the right brand greeting.
6. Airtable shows rows from both sites in the same base, distinguished by Site value.
7. \`npm run teardown -- --slug _e2e-enterprise\`.

## Verify

- Each call's caller-ID matches the right site's Twilio number.
- Greetings reference the right brand name per site.
- Airtable rows have correct Site values (\`e2e-ent-anc\` vs \`e2e-ent-jnu\`).

## Pitfalls

- Cloning the master Make scenario only once means both sites POST to the same scenario → both calls go to the first site's agent. Clone N times for N sites.
- Forgetting to set AIRTABLE_SITE_TAG in the per-site env means rows land without a Site value (still works but harder to filter).
`,

  "ep-18": `## Why this matters

You need to collect payment before provisioning runs. Without Stripe gating onboarding form access, anyone could trigger a $30+ Twilio/Retell setup by filling the form. Stripe billing turns the JDD site into a real product.

## Steps

1. Sign up for Stripe and verify business.
2. Create 3 subscription products: Starter ($147/mo), Growth ($297/mo), Enterprise ($697/mo).
3. Add Stripe checkout link to the JDD \`/pricing\` page — each tier's "Get started" button hits a Stripe checkout session.
4. Wire a Stripe webhook (\`checkout.session.completed\`) to mark that email as paid + unlock /onboarding access (e.g., set a paid flag in a small DB or send a magic link).

## Verify

- A test checkout (using Stripe test card 4242 4242 4242 4242) succeeds.
- The webhook fires and the user is redirected to /onboarding with access granted.
- A user who tries to load /onboarding without paying gets redirected to /pricing.

## Pitfalls

- Use Stripe's test mode end-to-end first. Don't switch to live mode until the webhook + access gating fully works.
- Stripe charges are 2.9% + $0.30 — factor that into your gross margins.
`,

  "ep-19": `## Why this matters

Per the PDF section 13b, every client gets a monthly performance report dashboard (call volume, site traffic, Core Web Vitals). Looker Studio is free, dashboards can be templatized, and you can clone one per client during onboarding.

## Steps

1. In Looker Studio, build a master dashboard template with:
   - Call volume chart (from Airtable connector or CSV export)
   - GA4 site traffic widget
   - Vercel Core Web Vitals (via API or manual entry)
2. Save as "JDD Master Client Report — Template".
3. Document the per-client clone process: copy template → swap data sources to the client's Airtable base + GA4 property → share with the client.
4. Optionally automate via Looker Studio API (limited but functional).

## Verify

- The template renders cleanly with sample data.
- Cloning + reconnecting data sources for one client produces a working personalized dashboard.

## Pitfalls

- Looker Studio's "Make a copy" only works if the original is set to allow it. Check sharing settings.
- Airtable-to-Looker requires an intermediate connector (e.g., Coupler.io) since Looker doesn't natively support Airtable.
`,

  "ep-20": `## Why this matters

This is the goal. Every other task in this tracker exists to make this one possible. Don't let the buildout become an end in itself — the test of whether JDD is real is whether one real business has paid you and is using their deployed site + voice agent.

## Steps

1. Find a prospect (cold outreach to local Juneau businesses, BNI referral, friends-of-friends).
2. 15-min discovery call to understand their needs and qualify them for a tier.
3. Pitch: "I'll build your site + AI receptionist for $X/month. Setup is on me if you sign up today."
4. Stripe charge + send /onboarding link.
5. Run \`onboard.js\` for them. Walk through the 3 Checkpoints (~1 hour live).
6. Connect their custom domain. Go live.

## Verify

- They've paid via Stripe.
- Their site is live at their domain.
- They've received at least one real lead via the form → Retell callback worked.

## Pitfalls

- Don't overpromise in the discovery call. Stick to the proven features (site + voice + Airtable logging). Custom integrations are version 2.
- Charge BEFORE provisioning. You'll lose Twilio + Retell + Vercel resources to non-paying "test" clients otherwise.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-1 sub-tasks — Ops repo scaffold (jdd-ops)
  // ════════════════════════════════════════════════════════════════════════

  "st-001": `## Why this matters

\`.env.example\` defines the contract for which credentials \`onboard.js\` needs. \`.gitignore\` keeps real credentials out of git. The folder itself is the root of your operations.

## Steps

1. \`mkdir C:\\Users\\Xander\\Desktop\\jdd-ops\` (plus \`scripts/\`, \`lib/\`, \`clients/\` subfolders).
2. Write \`.env.example\` with all 7 service credentials as empty keys (ANTHROPIC_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, RETELL_API_KEY, RETELL_LLM_ID, RETELL_DEFAULT_VOICE_ID, AIRTABLE_API_KEY, AIRTABLE_WORKSPACE_ID, GITHUB_TOKEN, GITHUB_ORG, VERCEL_TOKEN, VERCEL_TEAM_ID, RESEND_API_KEY, RESEND_FROM_EMAIL, TEMPLATE_REPO).
3. \`.gitignore\`: \`node_modules/\`, \`.env\`, \`clients/*/.env.local\`, \`clients/*/repo/node_modules/\`, \`clients/*/repo/.next/\`.

## Verify

- \`ls jdd-ops/\` shows all expected files.
- \`cat .env.example\` lists every required credential.

## Pitfalls

- If you ever delete \`.env.example\`, future onboarders won't know what keys to set.
- Don't add real values to \`.env.example\` — only key names with empty values.
`,

  "st-002": `## Why this matters

\`package.json\` defines the npm scripts you invoke daily (\`npm run onboard\`, \`npm run sync-env\`, etc.) and which deps are needed. Without these, the orchestrator won't run.

## Steps

1. \`{ "type": "module", "scripts": { "onboard": "node onboard.js", "update-prompt": "node scripts/update-agent-prompt.js", "sync-env": "node scripts/sync-vercel-env.js", "teardown": "node scripts/teardown.js" } }\`.
2. Dependencies: \`@anthropic-ai/sdk\`, \`@octokit/rest\`, \`airtable\`, \`dotenv\`, \`twilio\`.
3. \`npm install\` to materialize \`node_modules\`.

## Verify

- \`npm run onboard -- --help\` prints usage.
- \`npm run teardown -- --help\` prints usage.

## Pitfalls

- \`"type": "module"\` is required because the script uses ES module imports (\`import twilio from 'twilio'\`).
- If you accidentally use CommonJS \`require\` anywhere, Node will throw — convert everything to ESM \`import\`.
`,

  "st-003": `## Why this matters

\`CLAUDE.md\` is what future Claude Code sessions read first. \`README.md\` is what humans read first. Both keep institutional knowledge in the repo instead of in your head.

## Steps

1. \`CLAUDE.md\` documents: plan tiers table, hard rules (never invent values, never commit .env), Vercel sync section, Twilio/Retell/Airtable ownership.
2. \`README.md\` documents: usage instructions, folder layout, the 3 human checkpoints.

## Verify

- Open both files. They should be readable by someone who's never touched the repo.
- Hard rules in CLAUDE.md cover every gotcha you've hit.

## Pitfalls

- Keep both files in sync with reality. If you change \`onboard.js\` behavior, update CLAUDE.md too.
`,

  "st-004": `## Why this matters

\`onboard.js\` is the heart of the business. Steps 1–8 cover schema load + validate, GitHub repo from template, clone + write site.ts, write .env.local, npm build, Claude prompt gen, Retell agent, Twilio number + Airtable base. Without these, you have no automation.

## Steps

1. Each step is a function that logs (\`[step N/9 site X/Y]\`) and exits 1 on error.
2. Step 1: \`loadIntake\` (supports both new INTAKE shape and legacy CONTENT fallback) + \`validateIntake\`.
3. Step 2: \`octokit.repos.createUsingTemplate({ template_owner, template_repo, owner, name, private })\`, then \`git clone\` with token-authed URL.
4. Step 3: read cloned \`src/data/site.ts\`, splice in new CONTENT block.
5. Step 4: write \`.env.local\` based on plan tier.
6. Step 5: \`execSync('npm install && npm run build', { cwd: repoDir })\`.
7. Step 6: \`anthropic.messages.create({ model: 'claude-sonnet-4-6', ... })\` with the per-task prompt template.
8. Step 7: POST to \`https://api.retellai.com/create-agent\` with response_engine + voice_id + general_prompt.
9. Step 8a: derive area code from \`brand.phone\`, search Twilio, buy, set voice webhook. 8b: create Airtable base via meta/bases API. 8c: git commit + push.

## Verify

- Dry-run all three \`_e2e-*\` fixtures and check the step sequence matches the expected matrix.
- Live-run \`_e2e-growth\` and confirm a deployed site + working voice agent.

## Pitfalls

- Step 5 (npm install + build) takes 60–90s — don't optimize it away; it's how you catch template breakage before any external resource is created.
- Step 2 (repo creation) needs 2-3s after the API returns before \`git clone\` works — there's a built-in 3s wait.
`,

  "st-005": `## Why this matters

After Checkpoint 2 you'll often want to tune the Retell agent prompt manually. Without an automation, you'd have to copy-paste the prompt into the Retell dashboard for every client every time you tweak it.

## Steps

1. \`scripts/update-agent-prompt.js\` reads \`clients/{slug}/agent-prompt.txt\` (which onboard.js step 6 wrote there).
2. Sends \`PATCH /update-agent/{agentId}\` with \`{ general_prompt: prompt }\` to Retell API.
3. Invoked via \`npm run update-prompt -- <agentId> --slug <slug>\`.

## Verify

- \`npm run update-prompt -- agent_test123 --slug _e2e-growth\` succeeds against a real Retell agent.
- The agent's prompt in the Retell dashboard reflects the edit.

## Pitfalls

- Don't blindly re-upload the auto-generated prompt — manually tune it for each client during Checkpoint 2 first, then upload the tuned version.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-2 sub-tasks — Business-site-template refactor
  // ════════════════════════════════════════════════════════════════════════

  "st-006": `## Why this matters

The PDF blueprint says the schema file is \`src/data/site.ts\` (not \`content.ts\`). Renaming keeps the codebase aligned with the documented convention and avoids confusion for future contributors.

## Steps

1. \`mv src/data/content.ts src/data/site.ts\`.
2. Find every \`from '@/data/content'\` import (8 sites total) and replace with \`from '@/data/site'\`.
3. Update any documentation references in CLAUDE.md, README.md, RULES.md.

## Verify

- \`grep -r "@/data/content" src/\` returns zero matches.
- \`npm run build\` passes.

## Pitfalls

- TypeScript \`type\` imports (\`import type { FaqItem } from '@/data/content'\`) need the same rename. Easy to miss.
`,

  "st-007": `## Why this matters

The template's CLAUDE.md gets cloned into every client repo. It needs to be the right context for AI sessions working on a specific client's site (not the template itself).

## Steps

1. Rewrite \`CLAUDE.md\` to describe: this is a per-client cloned site; schema is in \`src/data/site.ts\` (exports CONTENT); never hardcode brand values; palette flows via VariationD.tsx CSS vars; dual-mode \`/api/contact\` based on \`LEAD_DELIVERY_MODE\`.
2. \`README.md\` describes: per-client provisioning role, local dev, build, deferred features.

## Verify

- Open the cloned site repo from a recent client and verify CLAUDE.md reads correctly for that context.
- The mention of \`MAKE_WEBHOOK_URL\` requirement is present.

## Pitfalls

- Don't accidentally include personal info or JDD-master credentials in the template's CLAUDE.md — it ships to every client repo.
`,

  "st-008": `## Why this matters

The orchestrator needs to read \`selectedPlan\` and (for Enterprise) \`siteIndex\`/\`siteCount\`/\`siblingSlugs\` from the cloned site's \`_meta\` block. Without these fields in \`ContentMeta\`, the orchestrator can't branch.

## Steps

1. Edit \`src/data/site.ts\` → \`ContentMeta\` interface, add:
   \`selectedPlan: "starter" | "growth" | "enterprise"\`,
   \`siteIndex?: number\`, \`siteCount?: number\`, \`siblingSlugs?: string[]\`.
2. Update the PEAK placeholder's \`_meta\` block to include \`selectedPlan: "growth"\`.

## Verify

- \`npm run build\` passes (TS checks the placeholder still satisfies the type).
- Open a cloned client's \`site.ts\` after a provisioning run — \`_meta.selectedPlan\` is populated.

## Pitfalls

- \`siteIndex\`, \`siteCount\`, \`siblingSlugs\` are optional because Starter/Growth don't use them. Don't make them required.
`,

  "st-009": `## Why this matters

The \`/api/contact\` route uses \`resend\` to send lead emails on Starter sites. Without the dependency in \`package.json\`, the build fails. \`.env.example\` documents the env vars the route reads.

## Steps

1. \`npm install resend --save\` in the template.
2. Write \`.env.example\` with: \`LEAD_DELIVERY_MODE=webhook\`, \`MAKE_WEBHOOK_URL=\`, \`RESEND_API_KEY=\`, \`RESEND_FROM_EMAIL=leads@juneaudigitaldesigns.com\`, \`LEAD_TO_EMAIL=\`.

## Verify

- \`package.json\` lists \`"resend": "^4.x"\` in dependencies.
- \`.env.example\` exists in the template root.

## Pitfalls

- Don't put real API keys in \`.env.example\` — only blank values.
`,

  "st-010": `## Why this matters

The template must build before any client's clone can. Catches schema regressions, type errors, missing deps. Step 5 of onboard.js runs \`npm run build\` inside each cloned client; if the template doesn't build, neither will the clone.

## Steps

1. \`cd business-site-template/business-template\`.
2. \`npm install\` (one-time).
3. \`npm run build\` → expect clean exit + route table showing \`/\` and \`/api/contact\`.

## Verify

- Build completes in <30s.
- Zero TypeScript errors.
- All static pages generate.

## Pitfalls

- Tailwind 4 vs Tailwind 3 syntax differs. The template uses Tailwind 4 with \`@import "tailwindcss"\` in globals.css — don't accidentally downgrade.
- Next.js 16 turbopack is the default — if it errors, try \`next build\` without turbopack as a fallback.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-3 sub-tasks — JDD onboarding wiring
  // ════════════════════════════════════════════════════════════════════════

  "st-011": `## Why this matters

The JDD onboarding form posts raw form fields. The downstream consumers (Make → onboard.js) need a typed \`Intake\` envelope. Without this mapping layer, the wire format is just untyped JSON.

## Steps

1. Create \`app/lib/site-schema.ts\` with: \`SiteContent\` type (mirrors template), \`OnboardingSubmission\` type, \`AdditionalSiteEntry\` type, \`Intake\` envelope type.
2. \`mapPayloadToSchema(p: OnboardingSubmission): SiteContent\` — single-site mapping.
3. \`mapPayloadToIntake(p: OnboardingSubmission): Intake\` — wraps as \`{ plan, siteCount, sites }\`. Enterprise adds the \`additionalSites\` entries via \`buildAdditionalSite\`.

## Verify

- \`npm run build\` in juneau-digital-designs passes.
- A test submission produces an Intake JSON with the expected shape.

## Pitfalls

- Missing fields should be \`null\` + tracked in \`_meta.missing_fields\` — never invent values.
- Additional sites inherit from the primary site for fields they don't provide (typography, footer copy, etc.).
`,

  "st-012": `## Why this matters

The form has to actually deliver the intake somewhere. Make.com is the chosen sink because it can route, transform, and notify (and email it to you for review).

## Steps

1. In \`app/api/onboarding/route.ts\`: after Turnstile verify + sanitize, call \`mapPayloadToIntake(submissionData)\`.
2. \`postToMakeWebhook(intake)\` helper: \`fetch(MAKE_WEBHOOK_URL, { method: 'POST', body: JSON.stringify(intake) })\`. Fire-and-log; never throw.
3. On 2xx: return 200 to the form. On failure: still email owner via Resend as backup, return 200 (don't fail the form because Make is down).

## Verify

- Submit the form locally with \`MAKE_WEBHOOK_URL\` pointing at webhook.site → payload shows up.
- Resend email arrives as audit trail.

## Pitfalls

- Don't let a Make outage break form submissions. Always return 200 to the form if any path succeeded.
- Keep \`MAKE_WEBHOOK_URL\` server-side only — never expose it to the client.
`,

  "st-013": `## Why this matters

The form and pricing page sent \`enterprise\`; the API only accepted \`premium\`. Every Enterprise selection silently downgraded to Starter. The product was broken for the highest tier and you wouldn't have known until a customer complained.

## Steps

1. Find every \`premium\` reference in \`app/api/onboarding/route.ts\` and \`app/lib/site-schema.ts\` → rename to \`enterprise\`.
2. Update the \`PlanSlug\` type union, \`validPlans\` array, \`PLAN_LABELS\` (if present).
3. Check \`schema-example.json\` — update if it has \`"selectedPlan": "premium"\`.

## Verify

- \`grep -r "premium" app/\` returns no PlanSlug-related matches.
- Submit an Enterprise selection → wire format shows \`plan: "enterprise"\`, not \`plan: "starter"\`.

## Pitfalls

- The pricing page UI is the only thing that uses display names like "Enterprise" — those stay as user-facing copy. Don't accidentally rename UI strings.
`,

  "st-014": `## Why this matters

Enterprise clients buy 2 or 3 sites that share voice minutes. The form has to collect multiple site payloads in one submission. Without this UI, Enterprise becomes equivalent to Growth.

## Steps

1. In \`onboardingpageclient.tsx\`: add Section 15.5 visible only when \`selectedPlan === "enterprise"\`.
2. Maintain \`additionalSites: AdditionalSiteForm[]\` in form state (default \`[]\`, max 2 entries).
3. Each entry is an accordion with reduced fields: brand basics, palette, services, FAQs, hero seeds.
4. "+ Add another site" button gated to \`additionalSites.length < 2\`. Each accordion has "× Remove".

## Verify

- Select Enterprise → Section 15.5 appears.
- Click "+ Add another site" twice → button disappears after second click (cap reached).
- Submit → API receives \`additionalSites\` array of length 2.

## Pitfalls

- Switching from Enterprise to Starter/Growth shouldn't clear \`additionalSites\` — keep the state so user doesn't lose work if they accidentally change.
- The reduced field set means additional sites inherit footer/SEO/typography from the primary. Don't try to collect all 40 fields per additional site — UX would be brutal.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-4 sub-tasks — Lead capture
  // ════════════════════════════════════════════════════════════════════════

  "st-015": `## Why this matters

The original LeadForm was email-only and never POSTed anywhere. Retell can't call an email — phone is required. Without this rewrite, the entire voice product doesn't work.

## Steps

1. \`src/components/shared/LeadForm.tsx\`: state for name, phone, email, honeypot.
2. Phone validation: strip non-digits, accept 10 or 11 (with leading 1).
3. \`handleSubmit\` → POST \`/api/contact\` with \`{ name, phone, email, type, website }\`.
4. Success state: "✓ Got it. We'll call (XXX) XXX-XXXX within 60 seconds."
5. Optional \`type\` prop (\`"form" | "callback"\`) for the modal variant.

## Verify

- Submit with valid phone → success state appears, network tab shows POST to /api/contact with right body.
- Submit with invalid phone → inline error.
- Honeypot trick: fill the hidden \`website\` field → API accepts silently, no callback.

## Pitfalls

- Don't make email required. Many users won't give it; phone is the only field that matters for Retell.
- Don't validate phone too strictly — international formats vary. Stick to US/Canada 10/11-digit.
`,

  "st-016": `## Why this matters

\`/api/contact\` is the bridge. Starter clients need email delivery (no Retell). Growth/Enterprise need webhook delivery (triggers Retell). One route, two modes selected by env var.

## Steps

1. \`src/app/api/contact/route.ts\`: read \`process.env.LEAD_DELIVERY_MODE\` (\`"email"\` or \`"webhook"\`).
2. Honeypot check (silent 200 on \`website\` field filled).
3. Sanitize + validate name/phone/email.
4. If \`mode === "webhook"\`: POST to \`MAKE_WEBHOOK_URL\` with name+phone+brand.
5. If \`mode === "email"\`: send via Resend to \`LEAD_TO_EMAIL\` from \`RESEND_FROM_EMAIL\`.
6. Return 500 with friendly message if the required env vars for the chosen mode are missing.

## Verify

- Set \`LEAD_DELIVERY_MODE=webhook\` + webhook URL → submit → webhook fires.
- Set \`LEAD_DELIVERY_MODE=email\` + Resend vars → submit → email arrives.

## Pitfalls

- Never leak the Make webhook URL or Resend key client-side. Both must stay server-only.
- \`brand.short\` is included in the webhook payload as a defense-in-depth identifier in case Make scenarios are ever consolidated.
`,

  "st-017": `## Why this matters

The hero LeadForm is below the fold once a user scrolls past it. A floating "Get a callback now" button keeps lead capture accessible at all times. Higher conversion than relying on users scrolling back up.

## Steps

1. \`src/components/shared/CallbackModal.tsx\`: floating FAB pinned bottom-right.
2. Click opens a centered modal with the LeadForm in \`type="callback"\` mode.
3. Modal: backdrop click + ESC + close button all dismiss. Body scroll lock while open.
4. Heading/sub copy come from \`CONTENT.finalCta.headline\` / \`CONTENT.finalCta.sub\` so they match brand tone.

## Verify

- Floating button visible on page load.
- Click opens modal. ESC closes. Backdrop click closes.
- Submitting from modal posts with \`type: "callback"\` (visible in webhook payload).

## Pitfalls

- Mobile: the floating button needs to not overlap the keyboard or scroll-to-top buttons. Use \`bottom: env(safe-area-inset-bottom)\` if needed.
- Don't autofocus an input inside the modal — it triggers the keyboard on mobile unexpectedly.
`,

  "st-018": `## Why this matters

The modal needs CSS for the slide-in animation, dark backdrop, and the FAB's hover state. Without these, the modal looks unstyled.

## Steps

1. \`src/components/VariationD.tsx\`: import \`CallbackModal\`, mount once at the root of the component.
2. \`src/app/globals.css\`: add classes for \`.callback-fab\`, \`.callback-modal\`, \`.callback-modal__backdrop\`, plus keyframes for fade + slide.
3. Use palette CSS vars (\`var(--accent)\`, \`var(--ink)\`) so theming flows from the schema automatically.

## Verify

- The floating button uses the client's accent color.
- The modal backdrop is semi-transparent dark; the modal itself is the brand bg color.
- Mobile responsive: button shrinks to icon-only at narrow widths.

## Pitfalls

- z-index conflicts: the modal needs to layer above all other elements (z-50+). Test with sticky headers.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-5 sub-tasks — Vercel env auto-sync
  // ════════════════════════════════════════════════════════════════════════

  "st-019": `## Why this matters

Both \`onboard.js\` step 9 and the standalone \`sync-vercel-env.js\` script need to push env vars to Vercel. Extracting to a shared module avoids duplication and makes upserts (POST → PATCH on 409) consistent.

## Steps

1. \`jdd-ops/lib/vercel-sync.js\` exports \`syncEnvToVercel({ slug, clientDir, extraEnv })\`.
2. \`ensureProject(slug)\`: GET project; on 404 create via \`POST /v10/projects\` with \`gitRepository: { type: "github", repo: "\${GITHUB_ORG}/\${slug}" }\`.
3. \`listExistingEnv(slug)\`: GET existing env vars, return Map keyed by name.
4. \`upsertEnvVar(slug, existing, key, value)\`: POST; on 409, switch to PATCH using the existing env's id.

## Verify

- Call \`syncEnvToVercel({ slug: '_e2e-growth' })\` after onboard.js — Vercel dashboard shows the env vars.
- Re-running is idempotent: PATCHes existing values, doesn't duplicate.

## Pitfalls

- Vercel requires \`teamId\` query param when using a team token — make sure VERCEL_TEAM_ID is appended if set.
- 409 on POST can also mean another env var with a similar name exists — always refresh + check before retrying.
`,

  "st-020": `## Why this matters

Without step 9, the client's deployed site has no \`MAKE_WEBHOOK_URL\` or \`RESEND_API_KEY\` in production env. Form submissions return 500 because the route can't deliver anywhere.

## Steps

1. Bump \`TOTAL_STEPS\` from 8 to 9 in \`onboard.js\`.
2. After \`commitAndPush\`, call \`syncVercelEnv(slug, content, clientDir, intake.plan)\`.
3. Inside \`syncVercelEnv\`: skip with warning if VERCEL_TOKEN unset; otherwise call \`syncEnvToVercel\` with extras \`{ NEXT_PUBLIC_BRAND_NAME: content.brand.name, LEAD_DELIVERY_MODE: plan === 'starter' ? 'email' : 'webhook' }\`.
4. Catch errors and print retry hint.

## Verify

- Dry-run shows step 9 in the sequence.
- Live run: env vars appear in Vercel dashboard within seconds of completion.

## Pitfalls

- \`MAKE_WEBHOOK_URL\` is typically empty at first onboard (Make scenario not cloned yet). Step 9 logs a warning but doesn't fail — that's intentional. Re-run sync-env after pasting the URL.
`,

  "st-021": `## Why this matters

Checkpoint 3 happens AFTER onboarding completes — that's when you clone the Make scenario and get the webhook URL. Without a re-run helper, you'd have to manually edit Vercel env vars per client.

## Steps

1. \`scripts/sync-vercel-env.js\`: parses \`--slug\` arg, reads brand name from \`clients/{slug}/site.ts\`.
2. Calls \`syncEnvToVercel\` from the shared module with the same extras as step 9.
3. Logs created/updated/skipped counts and a "trigger a redeploy" reminder.

## Verify

- \`npm run sync-env -- --slug _e2e-growth\` succeeds after \`MAKE_WEBHOOK_URL\` is pasted.
- The Vercel project's env var is updated to the new value.

## Pitfalls

- Triggering a redeploy on Vercel is manual after env changes — env updates don't auto-deploy. Push a commit or use the dashboard.
- The script doesn't validate \`MAKE_WEBHOOK_URL\` format — paste carelessly and your Make scenario won't fire.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-6 sub-tasks — Plan-tier provisioning
  // ════════════════════════════════════════════════════════════════════════

  "st-022": `## Why this matters

The intake schema evolved: old fixtures export \`CONTENT\` (single SiteContent), new ones export \`INTAKE\` (envelope with plan + sites). Back-compat means existing smoke fixtures keep working without rewrites.

## Steps

1. \`loadIntake(schemaPath)\` in \`onboard.js\`.
2. Strip TS annotations, eval the file as JS to get the exports.
3. If \`mod.INTAKE\`: return as-is.
4. Else if \`mod.CONTENT\`: wrap as \`{ plan: CONTENT._meta?.selectedPlan ?? 'growth', siteCount: 1, sites: [CONTENT] }\`.
5. Else: fail with "Schema must export INTAKE or CONTENT".

## Verify

- The existing \`_smoketest/site.ts\` (legacy CONTENT shape) loads cleanly.
- \`_e2e-enterprise/site.ts\` (new INTAKE shape) loads with 2 sites.

## Pitfalls

- TS type stripping is regex-based and brittle. Don't add complex type expressions to schema files; keep them flat.
`,

  "st-023": `## Why this matters

Without validation, a typo'd plan name or wrong site count silently produces broken provisioning runs. Catch issues at step 1 before any GitHub repo is created.

## Steps

1. \`validateIntake\` checks: plan is in \`{starter, growth, enterprise}\`.
2. \`sites.length >= 1\` always; for enterprise: \`>= 2 && <= 3\`.
3. Per-site: \`brand.name\`, \`brand.short\`, \`brand.phone\`, \`brand.email\`, full palette must be present.
4. For enterprise: \`brand.short\` must be unique across sites.

## Verify

- 4-site enterprise fixture (\`_e2e-overflow\`) is rejected with exit code 1.
- 2-site enterprise fixture passes.

## Pitfalls

- If you add new required fields later, retroactively update old fixtures or they'll fail validation.
`,

  "st-024": `## Why this matters

The original orchestrator did one site. Enterprise needs N sites with shared resources (Airtable base). Refactoring to a loop keeps each site's state isolated while still allowing sharing where appropriate.

## Steps

1. \`for (let i = 0; i < intake.sites.length; i++)\` around steps 2–9.
2. \`siteSlugFor(baseSlug, intake, i)\`: returns \`baseSlug\` for single-site, \`\${baseSlug}-\${i+1}\` for multi-site.
3. \`siteDirFor\`: returns \`clients/{baseSlug}\` or \`clients/{baseSlug}/site-{i+1}\`.
4. Set \`CURRENT_SITE_LABEL = "site X/Y"\` for log prefix on each iteration.
5. Step 8b: create Airtable base only on \`i === 0\`; reuse \`sharedBaseId\` and patch \`AIRTABLE_BASE_ID\` + \`AIRTABLE_SITE_TAG\` on later iterations.

## Verify

- Dry-run enterprise fixture shows \`[step N/9 site 1/2]\` then \`[step N/9 site 2/2]\` markers.
- The shared base ID is reused on iteration 2.

## Pitfalls

- Don't accidentally create N Airtable bases — that defeats the "shared minute pool" Enterprise value prop.
- Each site needs its own \`.env.local\` since RETELL_AGENT_ID and TWILIO_NUMBER differ per site.
`,

  "st-025": `## Why this matters

Starter is "site only, no voice." Provisioning a Retell agent for a Starter client wastes Twilio inventory + Retell quota and confuses billing. Skipping these steps for Starter is correct product behavior.

## Steps

1. Inside the main loop, check \`if (intake.plan === 'starter')\`.
2. Skip steps 6 (Retell prompt gen), 7 (Retell agent), 8a (Twilio buy), 8b (Airtable base).
3. Log "Skipping voice provisioning (plan=starter)" so it's visible.
4. Still run step 4 (\`.env.local\` with Resend mode) and step 9 (Vercel sync).

## Verify

- Dry-run \`_e2e-starter\` shows steps 2-5 + 9 only, with the skip log.
- No Twilio/Retell/Airtable charges for Starter.

## Pitfalls

- Don't forget step 4 still has to write the Starter-mode env vars (\`LEAD_DELIVERY_MODE=email\`, \`LEAD_TO_EMAIL\`).
`,

  "st-026": `## Why this matters

Enterprise clients want one unified dashboard showing all their sites' calls. Per-site Airtable bases would mean N tabs to check. Shared base with a Site column means one tab, filter by Site.

## Steps

1. On iteration \`i === 0\` for Enterprise: create base named \`{primaryBrandName} — Calls ({siteCount} sites)\` with a \`Site\` singleSelect field whose choices = all sites' \`brand.short\` values.
2. Standard Call Log fields: Date, Caller name, Caller number, Summary, Duration, Call type, Outcome.
3. For \`i > 0\`: skip base creation, patch \`AIRTABLE_BASE_ID\` (shared) + \`AIRTABLE_SITE_TAG\` (this site's brand.short) into env.

## Verify

- Enterprise dry-run shows base creation on site 1, reuse on site 2 with \`AIRTABLE_SITE_TAG\` patch.
- Live: one Airtable base appears with the Site column containing both sites' choices.

## Pitfalls

- Airtable schema mods (adding choices to a singleSelect after base creation) require manual dashboard work. If a client adds a 3rd site later, manually add that Site choice OR rebuild the base.
`,

  "st-027": `## Why this matters

You don't want to burn Twilio inventory testing plan branching. Dry-run lets you validate the orchestration logic without spending real money or creating real resources.

## Steps

1. Add \`--dry-run\` to \`parseArgs\` in \`onboard.js\`.
2. Set global \`DRY_RUN = true\`.
3. In each step, check \`if (DRY_RUN) { dryLog('would do X'); return placeholder }\`.
4. Print clear \`=== DRY RUN MODE ===\` banner at start and end.

## Verify

- \`node onboard.js --schema clients/_e2e-growth/site.ts --dry-run\` exits cleanly with the full step sequence and placeholder IDs like \`<dry-run-agent-id>\`.
- No GitHub repo, Vercel project, or Twilio number is created.

## Pitfalls

- Dry-run still requires \`.env\` to exist (for env-var reads). It just doesn't make API calls.
- Don't accidentally write to \`clients/{slug}/.env.local\` in dry-run — the file write check is critical.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-7 sub-tasks — E2E testing infrastructure
  // ════════════════════════════════════════════════════════════════════════

  "st-028": `## Why this matters

Without a Starter fixture, you'd have to hand-craft a test schema every time you want to verify Starter behavior. Fixture makes it one-command.

## Steps

1. \`mkdir clients/_e2e-starter\`.
2. \`clients/_e2e-starter/site.ts\` exports \`INTAKE\` with \`plan: "starter"\`, \`siteCount: 1\`, one site with minimal brand + 2 services + 1 FAQ.
3. Use a real test phone area code (907 for Alaska) so Twilio search succeeds on live runs.

## Verify

- Dry-run passes with the expected step sequence (no voice steps).
- Live-run produces a deployed site.

## Pitfalls

- Use unique brand.short values across all e2e fixtures so they don't conflict if you forget to tear one down.
- Email field uses \`+e2estarter@\` suffix so all test mail funnels to one inbox.
`,

  "st-029": `## Why this matters

Growth is the most-used tier — most fixture exercising should target it. The Growth fixture needs to be realistic enough that the full pipeline (build, agent prompt, voice provisioning) is meaningful.

## Steps

1. \`clients/_e2e-growth/site.ts\` with \`plan: "growth"\`.
2. 4 services, 3 FAQs, 2 testimonials, established year, palette in the blue family.
3. Real phone area code (907) so Twilio search succeeds.

## Verify

- Dry-run shows all 9 steps execute.
- Live-run produces site + voice agent + Airtable base.

## Pitfalls

- Test data should not look like a real customer. Use "E2E Growth Co" as the brand name so accidentally-published copy can be identified later.
`,

  "st-030": `## Why this matters

Without an Enterprise fixture, you can't validate the multi-site loop or shared Airtable behavior. The fixture must have exactly 2 sites (minimum for Enterprise) to exercise the per-site iteration logic.

## Steps

1. \`clients/_e2e-enterprise/site.ts\` with \`plan: "enterprise"\`, \`siteCount: 2\`.
2. Two sites with distinct \`brand.short\` values (e.g., \`e2e-ent-anc\`, \`e2e-ent-jnu\`).
3. Shared palette/typography (since multi-site clients usually rebrand uniformly).
4. Each site has its own services, FAQs, and phone with a different area code.

## Verify

- Dry-run loops twice with \`site 1/2\` and \`site 2/2\` markers.
- Live: 2 deployments, 2 Twilio numbers, 1 shared Airtable base.

## Pitfalls

- Don't make the two sites' brand.short conflict — \`validateIntake\` will reject.
- Different area codes per site test the Twilio search logic more thoroughly.
`,

  "st-031": `## Why this matters

You need to prove the upper bound (max 3 sites) is enforced. A 4-site fixture confirms \`validateIntake\` rejects out-of-range Enterprise.

## Steps

1. \`clients/_e2e-overflow/site.ts\` with 4 sites.
2. Each site is minimal (1 service, 1 FAQ) — this is a negative test, not a deep test.
3. All have unique brand.short values so the cap is the only failure cause.

## Verify

- \`node onboard.js --schema clients/_e2e-overflow/site.ts --dry-run\` exits with code 1.
- Error message reads "enterprise plan requires 2 or 3 sites (got 4)".

## Pitfalls

- Don't ever live-run this fixture — it's designed to fail validation. If it didn't, you'd create 4 GitHub repos with no way to reach them as a unit.
`,

  "st-032": `## Why this matters

After a live test you have GitHub repos + Vercel projects + Twilio numbers + Retell agents + Airtable bases dangling. Without teardown, these accumulate and cost money. Manual cleanup across 5 services is tedious.

## Steps

1. \`scripts/teardown.js\`: parses \`--slug\` arg, refuses if it doesn't start with \`_e2e-\`.
2. Reads \`clients/{slug}/.env.local\` to discover resource IDs (RETELL_AGENT_ID, TWILIO_NUMBER, AIRTABLE_BASE_ID).
3. Deletes in order: GitHub repo (Octokit), Vercel project, Twilio number, Retell agent, Airtable base.
4. Walks each site folder for Enterprise teardown.
5. Confirms before deleting (skippable with \`--yes\`).
6. Removes \`clients/{slug}/\` local folder at the end.

## Verify

- \`npm run teardown -- --slug _e2e-growth\` confirms each resource type as it's deleted.
- All five service dashboards show the resources gone.
- The local folder is removed.

## Pitfalls

- The \`_e2e-\` guard is critical — accidentally tearing down a real client would be catastrophic. Never remove or weaken this check.
- Airtable base deletion is via meta API. If your PAT lacks \`schema.bases:write\` scope, the delete will 403.
- Make scenarios are NOT deleted by teardown — clean those up manually if needed.
`,

  "st-033": `## Why this matters

Without a written playbook, you'd forget which test to run when, and the team would re-derive the test plan ad hoc. The 3-layer model (dry-run → mock → live) is also the right escalation path: cheapest validation first.

## Steps

1. \`jdd-ops/TESTING.md\` with 3 sections:
   - Layer A: dry-run validation (no API calls)
   - Layer B: mock-API tests via webhook.site
   - Layer C: live end-to-end with teardown
2. Each layer lists fixtures, commands, expected output, and a checklist.
3. Troubleshooting table at the bottom for common failures.

## Verify

- Walk through TESTING.md top-to-bottom — every command should be copy-pasteable.
- The checklist items are unambiguous (pass/fail signals).

## Pitfalls

- Stale test docs are worse than no docs. Update TESTING.md whenever pipeline behavior changes.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-8 sub-tasks — Enterprise cap correction
  // ════════════════════════════════════════════════════════════════════════

  "st-034": `## Why this matters

The server-side cap is the only protection against a malicious or buggy client posting 100 additional sites. Front-end caps can be bypassed; server enforces.

## Steps

1. Edit \`app/api/onboarding/route.ts\` line 463.
2. Change \`body.additionalSites.slice(0, 9).map\` to \`body.additionalSites.slice(0, 2).map\`.
3. Update the inline comment to reflect "max 2 extra for 3-site cluster".

## Verify

- Submit a payload with 10 additional sites → \`mapPayloadToIntake\` returns Intake with only 3 sites (primary + first 2).

## Pitfalls

- \`slice\` is silent — it doesn't reject the request, just trims. The user sees success but only first 2 additional sites are processed. Acceptable for now since the UI also caps.
`,

  "st-035": `## Why this matters

The UI button text and gates need to match the actual cap. Mismatched UI ("Add up to 9 more") and reality (silently capped at 2) confuses users.

## Steps

1. \`app/components/onboarding/onboardingpageclient.tsx\`: 4 edits.
2. Line 126 comment: \`max 9\` → \`max 2; 3 sites total\`.
3. Line 2187 intro: \`bundles up to 10 sites\` / \`up to 9 more\` → \`bundles up to 3\` / \`up to 2 more\`.
4. Line 2334 gate: \`< 9\` → \`< 2\`.
5. Line 2351 button label: \`of 10\` → \`of 3\`.

## Verify

- Select Enterprise → intro text reads "up to 3 sites" / "up to 2 more".
- Add 2 additional sites → button disappears, counter reads "2 of 3" then "3 of 3".

## Pitfalls

- The intro paragraph + button + comment must all agree on the number. Mismatched copy = trust killer.
`,

  "st-036": `## Why this matters

Server validation enforces what the UI displays. If the API accepts 4-site Enterprise but the UI caps at 3, a different client (API consumer, mobile app, etc.) could still create 4-site clusters. Server is the source of truth.

## Steps

1. \`jdd-ops/onboard.js validateIntake\`: change the single lower-bound check to a range:
   \`if (intake.plan === 'enterprise' && (intake.sites.length < 2 || intake.sites.length > 3))\`.
2. Error message: \`enterprise plan requires 2 or 3 sites (got N)\`.

## Verify

- 4-site fixture rejected with exit 1 + clear error.
- 2-site and 3-site fixtures pass.

## Pitfalls

- The error message should include the actual count — it makes debugging fixtures much faster.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-9 sub-task — Operations runbook
  // ════════════════════════════════════════════════════════════════════════

  "st-037": `## Why this matters

Two one-time setups (Vercel GitHub App + master Make scenario) are required before \`onboard.js\` step 9 + Checkpoint 3 work. Without a runbook, you'd forget the steps under pressure or have to re-derive them every time you onboard a new operator.

## Steps

1. \`jdd-ops/RUNBOOK.md\` with 4 parts:
   - Part A: one-time setup (master \`.env\`, push template to GitHub, install Vercel GitHub App, build master Make scenario).
   - Part B: per-client setup at Checkpoint 3 (clone Make scenario, swap placeholders, activate, paste URL, run sync-env, redeploy, test).
   - Part C: rationale for per-client clones.
   - Part D: teardown of test resources.
2. Each step has concrete URLs, commands, and verification.

## Verify

- A new operator can follow RUNBOOK.md without asking you questions.
- Every URL referenced still works.
- Every command pastes cleanly.

## Pitfalls

- If Make.com or Vercel UI changes, screenshots in docs go stale fast. Stick to text-based steps that reference UI labels which change less often.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-10 sub-tasks — External service accounts
  // ════════════════════════════════════════════════════════════════════════

  "st-038": `## Why this matters

\`onboard.js\` step 6 uses Claude to generate per-client Retell agent prompts. Without a valid API key, step 6 throws and the entire pipeline halts.

## Steps

1. Visit \`console.anthropic.com\` and sign in.
2. Settings → API Keys → "Create Key".
3. Name it "jdd-ops" so you can identify it later.
4. Copy the key (starts with \`sk-ant-...\`) — it's only shown once.
5. Paste into \`jdd-ops/.env\` as \`ANTHROPIC_API_KEY=sk-ant-...\`.
6. Verify billing is enabled — even free credits require a payment method on file.

## Verify

- \`node -e "require('dotenv').config(); console.log(process.env.ANTHROPIC_API_KEY?.slice(0,10))"\` from jdd-ops prints \`sk-ant-api\`.
- A live \`onboard.js\` run hits step 6 without auth errors.

## Pitfalls

- Anthropic keys are powerful — don't paste them in Slack, Discord, or anywhere visible.
- The free tier allows ~$5 of credits. Sonnet calls cost ~$0.003 per onboard step 6 — you can do hundreds of test runs before billing hits.
- If you regenerate the key later, you must update \`.env\` AND tell the script to re-read (restart the script).
`,

  "st-039": `## Why this matters

Starter clients receive lead emails via Resend. Without a verified sender domain, emails either don't deliver or land in spam.

## Steps

1. Sign up at \`resend.com\`.
2. Dashboard → Domains → Add Domain → enter \`juneaudigitaldesigns.com\`.
3. Resend shows DNS records (SPF, DKIM, MX optionally). Add these to your domain's DNS at your registrar (Namecheap, Cloudflare, etc.).
4. Wait 5–60 minutes for DNS propagation.
5. Click "Verify" in Resend — status changes to green/Verified.
6. Settings → API Keys → "Create API Key". Copy the key (starts with \`re_...\`).
7. Paste into \`jdd-ops/.env\`: \`RESEND_API_KEY=re_...\` and \`RESEND_FROM_EMAIL=leads@juneaudigitaldesigns.com\`.

## Verify

- Dashboard shows the domain as Verified.
- A test email from \`/api/contact\` (in Starter mode) arrives in your inbox within 30 seconds.
- Email headers show \`spf=pass\` and \`dkim=pass\`.

## Pitfalls

- DNS propagation can take up to 24 hours but is usually <1 hour. Don't rage-click verify; wait 15 min between attempts.
- The free tier allows 3,000 emails/month — more than enough for early Starter clients.
- If you try to send from an unverified domain, Resend silently bounces.
`,

  "st-040": `## Why this matters

\`onboard.js\` step 8a buys Twilio phone numbers + configures voice webhooks. Without API credentials, no Twilio number → no client voice agent.

## Steps

1. Sign up at \`twilio.com\`. Verify your email + phone.
2. Console → top-right shows your Account SID and Auth Token. Reveal both.
3. Paste into \`jdd-ops/.env\`: \`TWILIO_ACCOUNT_SID=AC...\` and \`TWILIO_AUTH_TOKEN=...\`.
4. Console → Billing → add a payment method.
5. Pre-load \$20 of credit (covers ~10 phone numbers for testing).

## Verify

- \`node -e "const tw = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN); tw.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch().then(a => console.log(a.friendlyName))"\` from jdd-ops prints your account name.
- A live \`onboard.js\` step 8a succeeds and prints the purchased number.

## Pitfalls

- New Twilio accounts have spending limits — bump it in Billing → "Limits" if you plan to onboard multiple clients quickly.
- Local US numbers are $1.15/month + ~$0.0085 per minute of voice. Budget ~$5/month per client for typical usage.
- Trial accounts can only call verified caller IDs. Upgrade to a paid account before running live tests.
`,

  "st-041": `## Why this matters

Retell is the AI voice runtime. Without an account + LLM config + voice ID, step 7 fails and your clients have no voice agent.

## Steps

1. Sign up at \`dashboard.retellai.com\`. Add payment method.
2. Settings → API Keys → "Create Key". Copy.
3. \`jdd-ops/.env\`: \`RETELL_API_KEY=...\`.
4. LLM tab → "Create LLM" → choose model (gpt-4o-mini for cost, claude-sonnet for quality). Save and copy the LLM ID.
5. \`jdd-ops/.env\`: \`RETELL_LLM_ID=...\`.
6. Voices tab → preview voices. Pick one that matches the brand tone. Copy the voice_id.
7. \`jdd-ops/.env\`: \`RETELL_DEFAULT_VOICE_ID=...\`.

## Verify

- A live \`onboard.js\` step 7 creates an agent and prints its agent_id.
- Calling the agent's Twilio number connects and you hear the chosen voice.

## Pitfalls

- Retell's per-minute pricing depends on LLM choice. claude-sonnet-4 is ~$0.15/min. Calculate at expected call volume before scaling.
- Voice IDs change occasionally as Retell deprecates older voices. If a voice stops working, pick a new one + update \`.env\`.
- Test the voice with a sample script BEFORE wiring it to a client. Voices vary wildly in quality.
`,

  "st-042": `## Why this matters

\`onboard.js\` step 8b creates per-client Airtable bases for call logs. Without a PAT with the right scopes, base creation fails.

## Steps

1. Sign up at \`airtable.com\`.
2. Create a workspace (e.g., "JDD Client Bases"). Copy the workspace ID from the URL.
3. \`jdd-ops/.env\`: \`AIRTABLE_WORKSPACE_ID=wsp...\`.
4. Visit \`airtable.com/create/tokens\`.
5. Click "Create token". Name: "jdd-ops". Scopes: \`data.records:read\`, \`data.records:write\`, \`schema.bases:read\`, \`schema.bases:write\`.
6. Access: this workspace only.
7. Copy the token (starts with \`pat...\`) — only shown once.
8. \`jdd-ops/.env\`: \`AIRTABLE_API_KEY=pat...\`.

## Verify

- \`curl -H "Authorization: Bearer $AIRTABLE_API_KEY" https://api.airtable.com/v0/meta/whoami\` returns your user info.
- Live \`onboard.js\` step 8b creates a base in the right workspace.

## Pitfalls

- \`schema.bases:write\` is required for base creation — without it, you get 403.
- Free Airtable allows up to 10 bases per workspace. If you exceed, upgrade or use a separate workspace.
- Airtable PATs don't expire by default but you can set expiration in the dashboard.
`,

  "st-043": `## Why this matters

\`onboard.js\` step 2 uses Octokit to create per-client repos from the template. Without a PAT with \`repo\` scope, repo creation fails.

## Steps

1. Visit \`github.com/settings/personal-access-tokens/new\`.
2. Token type: **Fine-grained personal access token** (recommended over classic).
3. Token name: "jdd-ops".
4. Expiration: 1 year (or custom).
5. Resource owner: \`xjuneau1\` (your org/user that owns client repos).
6. Repository access: "All repositories" (so it can create new ones).
7. Permissions → Repository:
   - Administration: Read and write
   - Contents: Read and write
   - Metadata: Read-only (auto-required)
8. Generate token and copy.
9. \`jdd-ops/.env\`: \`GITHUB_TOKEN=github_pat_...\` and \`GITHUB_ORG=xjuneau1\`.

## Verify

- \`curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user\` returns your user info.
- Live \`onboard.js\` step 2 succeeds and the new repo appears in xjuneau1's repos.

## Pitfalls

- Classic tokens with broad scopes work too but are less secure. Fine-grained is the modern approach.
- "Administration: Read and write" includes deletion — needed by \`scripts/teardown.js\`.
- If you accidentally commit the token to git, revoke it immediately at github.com/settings/personal-access-tokens.
`,

  "st-044": `## Why this matters

\`onboard.js\` step 9 + \`scripts/sync-vercel-env.js\` push env vars to Vercel via API. Without a token + team ID, sync silently warns and skips.

## Steps

1. Sign in to \`vercel.com\`.
2. (Optional) Create a Team if you want client projects isolated from your personal account.
3. Settings → Tokens → "Create Token". Name: "jdd-ops". Scope: choose the team (or personal account) holding client projects.
4. Expiration: "No expiration" or 1 year.
5. Copy the token.
6. \`jdd-ops/.env\`: \`VERCEL_TOKEN=...\`.
7. If using a team: Settings → General → copy "Team ID" → \`VERCEL_TEAM_ID=team_...\`.

## Verify

- \`curl -H "Authorization: Bearer $VERCEL_TOKEN" https://api.vercel.com/v2/user\` returns your user info.
- Live \`npm run sync-env\` succeeds and env vars appear in the Vercel dashboard.

## Pitfalls

- Personal accounts don't have a Team ID — leave \`VERCEL_TEAM_ID\` blank for personal-scoped tokens.
- Tokens without "No expiration" auto-revoke; set a calendar reminder to rotate.
- Vercel charges $20/month for the Pro tier — required if you want >100 deployments/month, custom domains, etc.
`,

  "st-045": `## Why this matters

The previous 7 sub-tasks gather credentials individually. This step is the assembly — copy each value into the actual \`.env\` so the orchestrator can read them. Without this step, all the signups were wasted.

## Steps

1. \`cd C:\\Users\\Xander\\Desktop\\jdd-ops\`.
2. \`cp .env.example .env\` (creates the file with all the empty keys).
3. Open \`.env\` in your editor.
4. Paste each value from the per-service sub-tasks (st-038 through st-044) on the right side of each \`=\`.
5. Save.
6. Verify the file is gitignored: \`git status\` should NOT show \`.env\` as untracked.

## Verify

- Run \`node -e "require('dotenv').config(); const required = ['ANTHROPIC_API_KEY', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'RETELL_API_KEY', 'RETELL_LLM_ID', 'RETELL_DEFAULT_VOICE_ID', 'AIRTABLE_API_KEY', 'AIRTABLE_WORKSPACE_ID', 'GITHUB_TOKEN', 'GITHUB_ORG', 'VERCEL_TOKEN', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'TEMPLATE_REPO']; console.log(required.map(k => [k, !!process.env[k]]).filter(x => !x[1]))"\` from jdd-ops prints an empty array (all required keys present).
- A dry-run of \`_e2e-growth\` reaches step 9 with no "Missing required env" errors.

## Pitfalls

- Don't add quotes around values in \`.env\` unless they contain spaces or special chars. \`KEY=value\` not \`KEY="value"\`.
- Don't add a trailing space after \`=\` — dotenv parses literally and a space-prefixed value will fail auth.
- After editing \`.env\`, you have to restart any running scripts that already loaded the env.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-11 sub-tasks — Vercel x GitHub integration
  // ════════════════════════════════════════════════════════════════════════

  "st-046": `## Why this matters

This is the entry point to the integration. Without clicking through this, the Vercel app can't be installed on your GitHub org and \`onboard.js\` step 9 can't auto-create projects.

## Steps

1. Sign into vercel.com with the account holding client projects.
2. Visit \`https://vercel.com/integrations/github\` (or top nav → Integrations → search "GitHub").
3. Click **Add Integration**.
4. A modal asks which Vercel scope (team) the integration should be added to. Pick the team that owns your VERCEL_TOKEN.

## Verify

- Vercel redirects you to GitHub's install screen.

## Pitfalls

- If you're using a personal Vercel account (not a team), pick "personal account" in the scope modal.
- Make sure the Vercel team you pick matches the token in \`jdd-ops/.env\` — mismatched scope = 403 errors on every API call.
`,

  "st-047": `## Why this matters

"All repositories" access is what makes the magic work. With "Only select repositories", every new client repo \`onboard.js\` creates would need manual allowlisting before Vercel could see it.

## Steps

1. After clicking through st-046, GitHub asks "Install Vercel" and shows account/org options.
2. Pick **\`xjuneau1\`** (your \`GITHUB_ORG\`).
3. Repository access screen: choose **All repositories** (not "Only select repositories").
4. Click **Install**.
5. GitHub redirects back to Vercel's "Configure" page.

## Verify

- GitHub Settings → Applications → Installed GitHub Apps shows "Vercel" with "Access to all repositories".
- Vercel dashboard's "Add New Project" picker lists every repo under xjuneau1.

## Pitfalls

- "Only select repositories" is the default. Watch for it.
- If you accidentally pick "Only select repositories", you can edit later via GitHub Settings → Applications → Vercel → Configure → "All repositories".
`,

  "st-048": `## Why this matters

You need confirmation the integration works before you start charging clients. Without verifying, you might discover the issue mid-onboarding when step 9 fails.

## Steps

1. Open Vercel dashboard.
2. Click **Add New… → Project**.
3. Repository picker should list every repo under \`xjuneau1\` (including \`business-site-template\` if you've pushed it).
4. If you see the repos, you're done — cancel the project creation (we don't actually want to create one manually).

## Verify

- The picker lists at least 1 repo (more once you have client repos).
- No "Configure" or "Install" prompts appear (would mean integration isn't fully set up).

## Pitfalls

- If the picker is empty, GitHub's permissions didn't actually save. Re-do st-047 paying extra attention to the "All repositories" toggle.
- If you see a "Re-authorize" prompt, your token expired or scopes changed — click through to refresh.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-12 sub-tasks — Master Make.com scenario
  // ════════════════════════════════════════════════════════════════════════

  "st-049": `## Why this matters

Make.com is the orchestration layer between client sites' \`/api/contact\` and Retell's \`create-phone-call\`. Free tier handles up to 1000 operations/month — easily enough for early-stage onboardings.

## Steps

1. Visit \`make.com\` and sign up with your email.
2. Verify email.
3. Skip the onboarding tour or click through quickly.
4. You land in the Make dashboard.

## Verify

- You're logged in and see a "Create a new scenario" button.

## Pitfalls

- Make's free tier resets monthly. Each scenario run consumes 1+ operations (1 per module triggered). Plan for ~5–10 ops per client lead.
- Don't sign up with a personal email if this will become a real business tool — use a workspace email tied to JDD.
`,

  "st-050": `## Why this matters

The Custom Webhook is the entry point — its URL is what \`MAKE_WEBHOOK_URL\` points at on the deployed client site. Without it, there's nothing to trigger downstream actions.

## Steps

1. Make dashboard → Create a new scenario.
2. Click the big "+" → search "Webhooks" → pick "Webhooks" → "Custom webhook".
3. Click **Add** → name it "JDD Lead Master Webhook" → click Save.
4. Make generates a URL like \`https://hook.us1.make.com/abc123...\`.
5. Copy the URL — you'll use it in the next step (sample payload).

## Verify

- The webhook module is the first node in the scenario.
- The URL is visible and copyable in the module's settings.

## Pitfalls

- The master webhook URL is never used by a real client. Cloned scenarios get their own URLs. Don't confuse them.
- Webhook URLs are sensitive — anyone with the URL can trigger your scenario. Don't post in public docs.
`,

  "st-051": `## Why this matters

Make needs to learn the JSON structure of incoming requests so subsequent modules can reference fields like \`{{1.phone}}\`. Without a sample payload, the field-picker in the HTTP module won't show what to map.

## Steps

1. In the webhook module, click "Run once" (or in the bottom toolbar).
2. Open a separate terminal and run:
   \`\`\`
   curl -X POST <your-webhook-url> -H "Content-Type: application/json" -d '{"name":"Test Lead","phone":"9075550142","email":"","type":"form","brand":"test","receivedAt":"2026-05-16T00:00:00Z"}'
   \`\`\`
3. Make captures the payload and infers the schema.
4. The scenario stops running (it just needed one sample).

## Verify

- Make's "Run history" shows 1 run with status "success".
- Adding a subsequent module shows fields like \`1.name\`, \`1.phone\`, \`1.brand\` available in the field picker.

## Pitfalls

- Use a realistic payload structure matching what \`/api/contact\` actually sends. Send a junk payload and Make learns the wrong shape.
- "Run once" expires after a few minutes — re-click if you take too long to curl.
`,

  "st-052": `## Why this matters

This is the action that actually triggers the Retell call. Without it, the webhook fires but nothing reaches Retell.

## Steps

1. Add a second module: "HTTP" → "Make a request".
2. URL: \`https://api.retellai.com/v2/create-phone-call\`
3. Method: \`POST\`
4. Headers: add two —
   \`Authorization\`: \`Bearer YOUR_RETELL_API_KEY\` (use the real key in the master)
   \`Content-Type\`: \`application/json\`
5. Body type: \`Raw\` → \`JSON (application/json)\`.
6. Body:
   \`\`\`json
   {
     "from_number": "<<<TWILIO_NUMBER>>>",
     "to_number": "{{1.phone}}",
     "override_agent_id": "<<<RETELL_AGENT_ID>>>"
   }
   \`\`\`
7. Leave the \`<<<...>>>\` placeholders as literal text. Use the field picker to insert \`{{1.phone}}\` for to_number.
8. Save.

## Verify

- The HTTP module shows correct URL, headers, and body in the editor.
- The \`<<<TWILIO_NUMBER>>>\` and \`<<<RETELL_AGENT_ID>>>\` placeholders are visible as literal text (not resolved).

## Pitfalls

- Don't substitute real values in the master — only clones get real values. The placeholders are part of the template contract.
- If you accidentally use Retell v1 endpoint (\`/create-call\`), it works but is deprecated. Use v2.
- Test calls cost real money even from the master scenario if it's ever activated. Keep the master deactivated.
`,

  "st-053": `## Why this matters

The master scenario shouldn't actually run — it's a template only. Saving + deactivating preserves it for cloning without burning operations.

## Steps

1. Click "Save" at the bottom of the scenario editor.
2. Toggle the "Scheduling" switch at the bottom-left to "Off" (it should already be off after creation, but confirm).
3. Verify the scenario shows "Inactive" status in the dashboard list.

## Verify

- Dashboard list shows your master scenario with "Inactive" badge.
- Cloning it produces a copy with the same modules + placeholder values.

## Pitfalls

- If the master is active and someone curls its webhook URL, it'll fire and try to POST to Retell with the literal placeholder strings — which will 400 from Retell but uses operations.
- Don't share the master webhook URL anywhere.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-13 sub-tasks — Push template to GitHub
  // ════════════════════════════════════════════════════════════════════════

  "st-054": `## Why this matters

You need a way to push a local repo to GitHub. \`gh\` CLI is the fastest path — one command creates the repo, sets the remote, and pushes. The web UI alternative is slower but works without installing anything.

## Steps (gh CLI):

1. Visit \`cli.github.com\` and install gh for your OS.
2. \`gh auth login\` → follow the prompts to authenticate.
3. Verify with \`gh auth status\`.

## Steps (web UI alternative):

1. Visit \`github.com/new\`.
2. Owner: xjuneau1. Repository name: business-site-template. Private. Don't initialize with README.
3. Click "Create repository".

## Verify

- \`gh repo view xjuneau1/business-site-template\` (after st-055) shows the repo.
- Or: github.com/xjuneau1 lists business-site-template.

## Pitfalls

- gh CLI requires your GitHub PAT or browser auth. If you already have a fine-grained PAT (st-043), use \`gh auth login --with-token < token.txt\`.
- "Private" matters — public templates expose client site structure publicly before they're real customers.
`,

  "st-055": `## Why this matters

\`onboard.js\` step 2 uses \`octokit.repos.createUsingTemplate\` with \`TEMPLATE_REPO\` = \`xjuneau1/business-site-template\`. Until the template is on GitHub, every provisioning run fails at step 2.

## Steps (gh CLI):

1. \`cd C:\\Users\\Xander\\Desktop\\business-site-template\\business-template\`.
2. \`gh repo create xjuneau1/business-site-template --private --source=. --push\`.
3. Wait for push to complete.

## Steps (manual):

1. \`cd C:\\Users\\Xander\\Desktop\\business-site-template\\business-template\`.
2. \`git remote add origin https://github.com/xjuneau1/business-site-template.git\`.
3. \`git push -u origin master\` (or \`main\` if that's your default).

## Verify

- \`gh repo view xjuneau1/business-site-template --web\` opens the repo with CLAUDE.md, src/, package.json visible.
- The repo has the "Template repository" checkbox enabled (Settings → General → "Template repository").

## Pitfalls

- After pushing, **toggle "Template repository" ON** in Settings → General. Without it, \`createUsingTemplate\` API returns 422.
- Don't push your master branch if it includes uncommitted .env files or build artifacts. \`git status\` first.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-15 sub-tasks — Live E2E test (Starter)
  // ════════════════════════════════════════════════════════════════════════

  "st-056": `## Why this matters

The Starter live test proves the simplest pipeline works end-to-end with real APIs before charging a Starter customer. No voice, just site + email.

## Steps

1. \`cd C:\\Users\\Xander\\Desktop\\jdd-ops\`.
2. \`node onboard.js --schema clients/_e2e-starter/site.ts\`.
3. Wait ~2 minutes for the pipeline to complete (steps 2–5 + 9 only since starter skips voice).
4. Read the handoff summary — note the GitHub repo URL.

## Verify

- Handoff prints with no errors.
- GitHub repo \`xjuneau1/_e2e-starter\` exists.
- Vercel project \`_e2e-starter\` exists and shows a deployment building.

## Pitfalls

- Don't skip the dry-run first — if dry-run fails, live will too and you'll waste time.
- Vercel deployment can take 1–2 minutes. Don't panic if the URL 404s right after onboard finishes.
`,

  "st-057": `## Why this matters

The whole point of the Starter test is to verify Resend email delivery. If the email never arrives, Starter clients won't know they have a lead.

## Steps

1. Wait for the Vercel deployment to finish (check Vercel dashboard for "Ready" status).
2. Visit the deployment URL (Vercel dashboard → Visit).
3. Submit the lead form with your name + phone + email.
4. Check the inbox for \`owner+e2estarter@juneaudigitaldesigns.com\` (or whatever the fixture's brand.email is set to).
5. Email should arrive within 30 seconds with subject "New lead from e2e-starter — Your Name".

## Verify

- Email arrives.
- Email body contains your name, phone, email, and timestamp.
- Email is from \`leads@juneaudigitaldesigns.com\` (your verified sender).

## Pitfalls

- Check spam folder first if it doesn't arrive in 60s. New sender domains often land there for the first few weeks.
- If the email doesn't arrive at all, check Resend dashboard → Logs to see what happened.
- If the form 500s, check Vercel function logs for "RESEND_API_KEY is missing" — means sync-env didn't run.
`,

  "st-058": `## Why this matters

Test resources cost real money (Twilio numbers $1.15/mo even unused, Vercel hobby is free but projects accumulate, Airtable is free but cluttered). Always tear down after testing.

## Steps

1. \`cd C:\\Users\\Xander\\Desktop\\jdd-ops\`.
2. \`npm run teardown -- --slug _e2e-starter\`.
3. Confirm by typing \`yes\` at the prompt (or use \`--yes\` to skip).

## Verify

- GitHub repo \`xjuneau1/_e2e-starter\` is gone.
- Vercel project \`_e2e-starter\` is gone.
- Local \`clients/_e2e-starter/\` folder is removed.

## Pitfalls

- Starter teardown is the simplest (no Twilio/Retell/Airtable). Don't get cocky — always confirm the slug starts with \`_e2e-\` before running.
- If teardown fails partway through, run it again — it's idempotent.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-16 sub-tasks — Live E2E test (Growth)
  // ════════════════════════════════════════════════════════════════════════

  "st-059": `## Why this matters

Growth is the meat of the business — full pipeline test that exercises every external service. If Growth provisioning works, you're 95% ready for paying customers.

## Steps

1. \`cd C:\\Users\\Xander\\Desktop\\jdd-ops\`.
2. \`node onboard.js --schema clients/_e2e-growth/site.ts\`.
3. Pipeline runs all 9 steps. Expect 3–4 minutes total.
4. Handoff prints with GitHub URL, Retell agent ID, Twilio number, Airtable base ID.

## Verify

- All 9 steps complete with green checks in the log.
- All five resources exist (GitHub, Vercel, Retell agent, Twilio number, Airtable base).

## Pitfalls

- Step 8a (Twilio buy) is the most likely to fail if no numbers available in area code 907. If it fails, manually edit the fixture to use a more common area code (415, 212).
- Step 6 (Claude prompt gen) requires a working ANTHROPIC_API_KEY with credits — check console.anthropic.com if it 401s.
`,

  "st-060": `## Why this matters

This is Checkpoint 2 from the PDF — manually call the Twilio number to verify the Retell agent answers with the right brand greeting + qualifies properly. Catches agent prompt issues before any real lead encounters them.

## Steps

1. From your personal phone, dial the Twilio number printed in the handoff.
2. The Retell agent should answer with something like "Thank you for calling E2E Growth Co. How can I help you today?"
3. Try a simple qualification flow: "I'm looking for HVAC service." See if the agent asks the right follow-up questions.
4. Hang up.
5. Check Retell dashboard → Calls → the call should be logged.

## Verify

- Agent answers with the brand name (not a placeholder).
- Voice quality is clear (not robotic).
- The agent stays on-topic and doesn't hallucinate services.

## Pitfalls

- If the agent says nothing or you get dead air, the Twilio webhook to Retell isn't set right. Check Twilio Console → Phone Numbers → Voice Webhook URL — should be \`https://api.retellai.com/twilio-voice-webhook/{agentId}\`.
- If the greeting uses the placeholder ("Thank you for calling [brand]"), the agent_prompt.txt didn't render correctly. Re-run with \`npm run update-prompt\`.
- New Twilio accounts have spam-flag protections — if the number says "Spam Likely", that's normal for testing.
`,

  "st-061": `## Why this matters

The lead-capture flow requires the deployed site to know where to POST. Until you clone the Make scenario for this client and paste its webhook URL into their \`.env.local\`, lead forms 500.

## Steps

1. Open Make.com dashboard.
2. Find your master scenario → "…" menu → **Clone**.
3. Rename the clone: "Lead → Retell: e2e-growth".
4. Open the cloned scenario → click the Webhook trigger → copy the URL (different from master's).
5. Open the HTTP module → replace \`<<<TWILIO_NUMBER>>>\` with the e2e-growth Twilio number from handoff → replace \`<<<RETELL_AGENT_ID>>>\` with the e2e-growth agent_id.
6. Toggle the scenario to **Active** (bottom-left).
7. Paste the webhook URL into \`clients/_e2e-growth/.env.local\` as \`MAKE_WEBHOOK_URL=https://hook.us1.make.com/...\`.

## Verify

- The cloned scenario is active.
- \`clients/_e2e-growth/.env.local\` has \`MAKE_WEBHOOK_URL\` populated.

## Pitfalls

- The clone's webhook URL is different from the master's. Make sure you copy from the clone.
- Activating without replacing placeholders means clicks try to POST with literal "<<<TWILIO_NUMBER>>>" — Retell rejects with 400.
- Deactivate when done testing to save Make operations.
`,

  "st-062": `## Why this matters

Pasting \`MAKE_WEBHOOK_URL\` into local \`.env.local\` doesn't push it to the deployed site. Vercel only sees env vars that are set in the Vercel dashboard. \`sync-env\` bridges the gap.

## Steps

1. \`cd C:\\Users\\Xander\\Desktop\\jdd-ops\`.
2. \`npm run sync-env -- --slug _e2e-growth\`.
3. Output should show "created MAKE_WEBHOOK_URL" or "updated MAKE_WEBHOOK_URL".
4. Open Vercel dashboard → e2e-growth project → Settings → Environment Variables → confirm \`MAKE_WEBHOOK_URL\` is set.

## Verify

- Script prints success.
- Vercel dashboard shows the env var.
- Trigger a redeploy: push any commit, OR Vercel dashboard → Deployments → "…" → Redeploy.

## Pitfalls

- Env var changes don't auto-deploy. You must redeploy to pick them up.
- If sync-env warns "VERCEL_TOKEN not set", check \`jdd-ops/.env\`.
- Vercel sometimes caches deployments — force a fresh deploy if changes don't reflect.
`,

  "st-063": `## Why this matters

This is the moment of truth — the full happy path. Lead form on a deployed site → Make webhook → Retell call → your phone rings. If this works, JDD is real.

## Steps

1. Visit the deployed site URL (Vercel dashboard → Visit).
2. Submit the lead form: your name, your phone number, your email.
3. Hang up other calls and wait.
4. Within 60 seconds, your phone should ring from the Twilio number.
5. Answer. The Retell agent should greet you and ask qualification questions.
6. End the call.

## Verify

- Phone rings within 60s.
- Caller ID matches the Twilio number you bought.
- Agent uses the right brand name.
- The call is logged in Retell dashboard.

## Pitfalls

- If nothing rings, check (in order): Vercel function logs for /api/contact 500, Make scenario history (did webhook fire?), Retell dashboard outbound calls (did create-phone-call succeed?).
- Your carrier might filter spam-flagged numbers — try a friend's phone if your own doesn't ring.
- Don't submit the form 10 times in a row — Make will queue 10 outbound calls and you'll get a barrage.
`,

  "st-064": `## Why this matters

The whole point of logging is so the client can see who called and when. If the row doesn't land in Airtable, the client has no record. Retell sends a post-call webhook to Make, which forwards to Airtable.

## Steps

1. After the test call from st-063 ends, wait 30 seconds.
2. Open the Airtable base for e2e-growth (find it in your workspace).
3. The Call Log table should show a new row.
4. Verify the row has: Date (now), Caller name (your name from the form), Caller number (your phone), Summary (Retell's auto-generated call summary), Duration.

## Verify

- Row exists within 30s of call end.
- All fields are populated (or at least Date, Caller name, Caller number).
- Summary is coherent (not gibberish).

## Pitfalls

- This step assumes your master Make scenario has the Airtable POST configured. If you didn't add that module yet, the row won't appear — extend the master scenario (see EP-12 enhancements).
- If rows appear but with wrong data, check the field mapping in the Airtable module of your cloned Make scenario.
`,

  "st-065": `## Why this matters

Growth teardown is more comprehensive than Starter — there are Twilio numbers and Retell agents costing real money to keep around. Always clean up after testing.

## Steps

1. \`cd C:\\Users\\Xander\\Desktop\\jdd-ops\`.
2. \`npm run teardown -- --slug _e2e-growth\`.
3. Confirm at prompt.
4. Script deletes: GitHub repo, Vercel project, Twilio number, Retell agent, Airtable base.
5. Manually deactivate (or delete) the cloned Make scenario from the Make dashboard.

## Verify

- GitHub: repo gone.
- Vercel: project gone.
- Twilio: number released (Phone Numbers list).
- Retell: agent deleted.
- Airtable: base removed from workspace.
- Make: cloned scenario deactivated.

## Pitfalls

- Make scenario isn't auto-deleted — manual cleanup needed. Leaving it active just wastes ops on misrouted webhooks.
- Twilio releases the number for someone else to claim. You won't get the same number back if you re-onboard.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-17 sub-tasks — Live E2E test (Enterprise)
  // ════════════════════════════════════════════════════════════════════════

  "st-066": `## Why this matters

Enterprise is your highest-value tier and the most complex provisioning path. The 2-site fixture exercises the multi-site loop, shared Airtable base, and per-site env handling.

## Steps

1. \`cd C:\\Users\\Xander\\Desktop\\jdd-ops\`.
2. \`node onboard.js --schema clients/_e2e-enterprise/site.ts\`.
3. Pipeline loops the 9 steps for each of 2 sites. Expect 5–7 minutes total.
4. Handoff prints per-site: GitHub URL, Retell agent ID, Twilio number; plus 1 shared Airtable base ID.

## Verify

- All steps complete for both sites.
- 2 GitHub repos: \`_e2e-enterprise-1\` and \`_e2e-enterprise-2\`.
- 2 Twilio numbers, 2 Retell agents.
- 1 shared Airtable base with Site singleSelect column listing both sites' brand.short values.

## Pitfalls

- If site 1 succeeds but site 2 fails, you have a half-provisioned client. Teardown handles partial state correctly.
- Twilio number availability is per area code. The 2 fixture sites use different area codes — if one fails, edit the fixture.
`,

  "st-067": `## Why this matters

Verify the per-site provisioning actually produced distinct resources. A bug could make site 2 accidentally reuse site 1's agent or number, which would break call routing.

## Steps

1. Vercel dashboard → confirm \`_e2e-enterprise-1\` and \`_e2e-enterprise-2\` projects exist.
2. Twilio Console → Phone Numbers → confirm 2 numbers exist matching the handoff output.
3. Retell dashboard → Agents → confirm 2 agents exist with distinct names matching each site's brand.

## Verify

- 2 distinct Vercel project URLs.
- 2 distinct Twilio E.164 numbers.
- 2 distinct Retell agent IDs.

## Pitfalls

- If Twilio shows only 1 number, step 8a's loop broke. Re-check the per-site iteration logic in onboard.js.
- If Retell shows agents with the same name, the brand.short collision check failed.
`,

  "st-068": `## Why this matters

The shared base is the differentiator vs running 2 Growth setups. Site column distinguishes which site each call came from — without it, the call log is just one undifferentiated stream.

## Steps

1. Open the Airtable base from the handoff in your workspace.
2. Open the "Call Log" table.
3. Verify there's a "Site" field of type Single Select.
4. Click the Site field → "Customize field type" → confirm choices include both sites' brand.short values (e.g., \`e2e-ent-anc\` and \`e2e-ent-jnu\`).

## Verify

- Base name matches \`{primaryBrandName} — Calls (2 sites)\`.
- Site column exists with both choices.
- Other fields (Date, Caller, etc.) match the single-site schema.

## Pitfalls

- If only one choice appears, the loop's i=0 check for Airtable creation failed and only the first site's brand.short was added.
- Adding a 3rd site post-creation requires manually adding that choice — Airtable singleSelect choices aren't dynamically extensible.
`,

  "st-069": `## Why this matters

Each site needs its own Make scenario clone because Retell agent_id and Twilio from_number differ per site. One shared scenario routes all sites to whichever set was hardcoded — wrong behavior.

## Steps

1. Make dashboard → clone master → rename "Lead → Retell: e2e-enterprise-1".
2. Open clone 1 → copy webhook URL.
3. HTTP module: replace TWILIO_NUMBER + RETELL_AGENT_ID with site 1's values from \`clients/_e2e-enterprise/site-1/.env.local\`.
4. Activate clone 1.
5. Repeat for site 2: clone → rename → copy URL → set site 2's values → activate.
6. Paste each webhook URL into the matching \`.env.local\`:
   - \`clients/_e2e-enterprise/site-1/.env.local\` gets clone 1's URL.
   - \`clients/_e2e-enterprise/site-2/.env.local\` gets clone 2's URL.
7. Run sync-env for each: \`npm run sync-env -- --slug _e2e-enterprise/site-1\` and \`--slug _e2e-enterprise/site-2\`.

## Verify

- 2 cloned scenarios visible in Make, both active.
- Each clone has the correct site's values in the HTTP module.
- Each \`.env.local\` has the matching webhook URL.
- Vercel envs updated for both projects.

## Pitfalls

- Mixing up which clone goes with which site is the #1 mistake. Label them clearly with the site number/slug.
- If you only clone once and try to share, both sites will route to whichever values you hardcoded.
`,

  "st-070": `## Why this matters

Verifies the per-site routing works. Submit on site 1 → site 1's Twilio number calls you. Submit on site 2 → site 2's number calls you. If both sites call from the same number, routing is broken.

## Steps

1. Submit lead form on site 1's deployed URL with your phone.
2. Within 60s, phone rings from site 1's Twilio number.
3. Note the caller ID and agent greeting.
4. End call.
5. Submit lead form on site 2's deployed URL with your phone.
6. Within 60s, phone rings from site 2's Twilio number (different from site 1's).
7. Greeting uses site 2's brand name.
8. End call.

## Verify

- 2 distinct calls received from 2 distinct numbers.
- Each greeting uses the correct site's brand name.
- Airtable base shows 2 new rows, one per Site value.

## Pitfalls

- If both calls came from the same number, you cloned the Make scenario only once (or both clones point at the same agent). Re-do st-069.
- If only one call came through, one of the cloned scenarios isn't active or the webhook URL isn't pasted into the right \`.env.local\`.
`,

  "st-071": `## Why this matters

Enterprise teardown deletes more resources than Growth (2x repos, projects, numbers, agents). Without cleanup, you'd pay $2.30/month for unused Twilio numbers indefinitely.

## Steps

1. \`cd C:\\Users\\Xander\\Desktop\\jdd-ops\`.
2. \`npm run teardown -- --slug _e2e-enterprise\`.
3. Confirm at prompt.
4. Script deletes both sites' resources + the shared Airtable base + the parent folder.
5. Manually deactivate both Make scenario clones.

## Verify

- 2 GitHub repos gone, 2 Vercel projects gone.
- 2 Twilio numbers released.
- 2 Retell agents deleted.
- 1 Airtable base removed.
- \`clients/_e2e-enterprise/\` parent folder removed.
- Both Make clones deactivated (manual step).

## Pitfalls

- The teardown script walks each site folder. If you have an unexpected non-site folder under \`clients/_e2e-enterprise/\`, the script may skip it — manually inspect after.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-18 sub-tasks — Stripe billing pipeline
  // ════════════════════════════════════════════════════════════════════════

  "st-072": `## Why this matters

Without Stripe, you can't accept payment programmatically. You'd be invoicing manually — slow, error-prone, and signals "this isn't a real product."

## Steps

1. Visit \`stripe.com\` → "Start now".
2. Email + password → verify email.
3. Activate account: business name, address, EIN/SSN, bank account for payouts.
4. Verification takes 1–3 business days for full activation but you can test in dev mode immediately.
5. Dashboard → Developers → API Keys → note your publishable + secret keys (test mode for now).

## Verify

- Stripe dashboard shows your business name + bank account.
- You can create test products without errors.

## Pitfalls

- Use a real business name and address — Stripe verifies and freezes funds for unverified accounts.
- Test mode is fully functional but uses test cards (\`4242 4242 4242 4242\`). Switch to live mode only after the full webhook + access gating is working.
- Stripe takes 2.9% + $0.30 per transaction. Factor into pricing.
`,

  "st-073": `## Why this matters

Each plan tier needs its own Stripe product so customers can self-serve checkout. Without separate products, you'd hand-craft each invoice — defeating self-serve.

## Steps

1. Stripe dashboard → Products → "+ Add product".
2. Product 1: name "JDD Starter", price $147/month (recurring monthly subscription), no trial.
3. Product 2: name "JDD Growth", price $297/month.
4. Product 3: name "JDD Enterprise", price $697/month.
5. Save each → note the price IDs (start with \`price_...\`).
6. Add price IDs to JDD site's env as e.g. \`STRIPE_PRICE_STARTER\`, \`STRIPE_PRICE_GROWTH\`, \`STRIPE_PRICE_ENTERPRISE\`.

## Verify

- All 3 products visible in dashboard.
- Each has a Price ID.
- Price IDs are added to JDD site env.

## Pitfalls

- Recurring subscriptions vs one-time payments — pick recurring monthly.
- Don't add trial periods unless you've decided your trial policy. Default to no trial for B2B.
- Tax handling — enable Stripe Tax if you sell to states/countries with sales tax requirements.
`,

  "st-074": `## Why this matters

Customers need a way to actually click and pay. Without checkout links on \`/pricing\`, the page is informational only.

## Steps

1. In juneau-digital-designs \`app/components/pricing/pricingpageclient.tsx\`: each tier card gets a "Get started" button.
2. Button click → create a Stripe Checkout Session via a new API route \`/api/checkout\`.
3. API route: \`stripe.checkout.sessions.create({ mode: "subscription", line_items: [{ price: env[STRIPE_PRICE_*], quantity: 1 }], success_url, cancel_url, customer_email })\`.
4. Return the session URL → client redirects via \`window.location\`.

## Verify

- Click "Get started" on Starter → redirected to Stripe-hosted checkout page.
- Use test card 4242 4242 4242 4242 → checkout succeeds.
- Redirected to \`success_url\` with \`?session_id=...\` query param.

## Pitfalls

- Use the customer's email if known (e.g., from a quote form earlier) so they don't have to retype.
- success_url and cancel_url must be absolute URLs. Use \`https://juneaudigitaldesigns.com/onboarding?session_id={CHECKOUT_SESSION_ID}\`.
- Never put Stripe SECRET key in client-side code. Use it only in API routes.
`,

  "st-075": `## Why this matters

Without webhook handling, the onboarding form is unprotected — anyone could trigger a $30+ provisioning run by filling it. Wiring the webhook means only paying customers can access onboarding.

## Steps

1. Stripe dashboard → Developers → Webhooks → "+ Add endpoint".
2. URL: \`https://juneaudigitaldesigns.com/api/stripe-webhook\`.
3. Listen for event: \`checkout.session.completed\`.
4. Copy the signing secret (\`whsec_...\`) → add to JDD env as \`STRIPE_WEBHOOK_SECRET\`.
5. Create JDD route \`/api/stripe-webhook\`: verify signature, on \`checkout.session.completed\` event extract \`customer_email\`, store in a paid-customers list (Airtable, KV, or DB).
6. JDD \`/onboarding\` page: check if visitor's email is in the paid list (require email-magic-link auth or session-based identification). If not, redirect to /pricing.

## Verify

- Test webhook: Stripe dashboard → Webhooks → your endpoint → "Send test event" → confirm your route returns 200.
- Real test checkout: complete a Stripe test checkout → webhook fires → email is logged.
- Loading /onboarding without paying → redirects to /pricing.
- Loading /onboarding after paying → form shows.

## Pitfalls

- Webhook signature verification is critical — without it anyone can fake "paid" events to bypass gating.
- Use \`raw\` body parser for the webhook route (Stripe SDK requires unmodified body for signature check).
- Test mode webhook signing secret is different from live mode — update env when going live.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-19 sub-tasks — Looker Studio dashboard
  // ════════════════════════════════════════════════════════════════════════

  "st-076": `## Why this matters

Per the PDF section 13b, each client gets a monthly performance dashboard. Looker Studio is free and supports cloning, making per-client dashboards economical.

## Steps

1. Sign in to \`lookerstudio.google.com\` with a Google account.
2. Click "+ Create" → "Report" → choose a starter template or blank.
3. Add data sources:
   - **Airtable** via a connector like Coupler.io (Airtable isn't native to Looker).
   - **Google Analytics 4** (native connector).
   - **Vercel Core Web Vitals** via Vercel's API or manual entry.
4. Build pages:
   - Page 1: Call volume (table + bar chart from Airtable).
   - Page 2: Site traffic (GA4 widget).
   - Page 3: Performance scores (Vercel CWV).
5. Style with JDD brand colors. Add client name placeholder.
6. Save as "JDD Master Client Report — Template".
7. Sharing → Anyone with link can view → "Make a copy" enabled.

## Verify

- Template renders cleanly with sample data.
- Each page has data and visualization.
- "Make a copy" produces a functional copy.

## Pitfalls

- Coupler.io for Airtable→Looker has free + paid tiers. Free covers basic sync; paid for scheduled refreshes.
- GA4 data has 24–48hr delay. Don't expect real-time analytics.
- Looker has no auto-clone API. The clone-per-client step is manual.
`,

  "st-077": `## Why this matters

Manual Looker cloning is OK for the first few clients but doesn't scale. Either automate it via Looker Studio API (limited) or write clear manual instructions so anyone (you, a contractor) can do it consistently.

## Steps

### Option A: Manual (recommended for v1)

1. Add a section to \`jdd-ops/RUNBOOK.md\` "Part E: Looker Studio per-client clone":
   - Open master template
   - File → Make a copy
   - Name: "{client.brand.name} — Performance Report"
   - Replace data sources: swap Airtable base ID, GA4 property ID, Vercel project name
   - Update branding: client logo + colors
   - Share with client (view-only)

### Option B: Automated (v2)

1. Use Looker Studio's Linking API to programmatically create a copy with parameters.
2. From \`onboard.js\` step 9 (or new step 10): construct a URL like \`https://lookerstudio.google.com/reporting/create?c.reportId=TEMPLATE_ID&c.mode=edit&ds.config=...\`.
3. Print the URL in the handoff — operator opens it once to materialize the copy.

## Verify

- Option A: Walk through the manual steps for a test client. Time it (should be <10 minutes).
- Option B: The generated URL produces a working copy when opened.

## Pitfalls

- Looker Studio Linking API has changed several times. Test before relying on it in production.
- Manual cloning is fragile — any operator who skips a step ships a broken dashboard. Strong checklist required.
`,

  // ════════════════════════════════════════════════════════════════════════
  // EP-20 sub-tasks — First paying client
  // ════════════════════════════════════════════════════════════════════════

  "st-078": `## Why this matters

You need exactly one real customer to validate the entire business. Without a prospect, all the buildout work is theoretical.

## Steps

1. List 20–50 local Juneau businesses that match the ICP: home services (HVAC, plumbing, roofing), small law firms, dental practices, real estate agents. They have outdated websites + miss phone calls regularly.
2. Outreach channels:
   - **Cold email** to owner@business.com — 3-sentence pitch + 1 question.
   - **BNI / chamber of commerce** networking — face-to-face wins for first sale.
   - **Referrals** — friends/family who know small business owners.
3. Pitch in 1 sentence: "I build websites that include an AI receptionist that answers your phone 24/7 and books leads while you're out."
4. Ask for a 15-min discovery call.

## Verify

- 20+ prospects on your list.
- 5+ outreaches/week.
- 1 discovery call scheduled within 3 weeks.

## Pitfalls

- Don't pitch the AI before the website. Lead with the site (familiar), AI is the upsell ("oh and it also...").
- Cold email response rates are 1–5%. Plan to outreach to 50+ to get 1 paying customer.
- BNI dues are $400+/year — only join if you'll attend weekly.
`,

  "st-079": `## Why this matters

The discovery call is where you qualify the prospect for the right tier and decide if they're a fit. 15 minutes max — respect their time, prove you can be efficient.

## Steps

1. Schedule via Calendly or similar. Send a brief agenda.
2. On the call:
   - First 3 min: Their pain. "Tell me about how leads find you today. What's frustrating?"
   - Next 5 min: Their numbers. "Roughly how many calls a week? How many do you miss?"
   - Next 5 min: Pitch the right tier. Starter for brochure sites, Growth for service businesses missing calls, Enterprise for multi-location.
   - Last 2 min: Close or schedule next step. "Want to sign up today and have your site live in 24 hours?"

## Verify

- Call ends with a clear next step (sign up, follow up next week, no).
- You captured: business name, owner name, pain points, current website situation, phone volume.

## Pitfalls

- Don't demo software live during the call — it always breaks. Show screenshots/videos of an existing client's site.
- Don't over-explain the AI. "It answers and books leads" is enough. Details bore prospects.
- If they say "I need to think about it", set a specific follow-up date. Vague follow-ups die.
`,

  "st-080": `## Why this matters

Intake form + payment are gated together — they pay first, then fill out brand info. Charging before provisioning ensures you don't lose money on "test" clients who never deliver content.

## Steps

1. After discovery call, send checkout link: \`https://juneaudigitaldesigns.com/pricing\` → "Get started" for their tier.
2. They complete Stripe checkout (15 sec).
3. Stripe webhook fires → JDD records their email as paid → they're auto-redirected to /onboarding.
4. They fill the 15-min onboarding form: brand basics, palette, services, FAQs, optional logo/hero images.
5. Submission goes to Make → email to you with the Intake JSON.

## Verify

- Stripe charge succeeds + appears in your dashboard.
- Email arrives with their Intake JSON.
- You can save the JSON to \`jdd-ops/clients/{slug}/site.ts\` as the next step.

## Pitfalls

- Be on standby to receive the email — once they submit, you should be ready to provision within 24 hours per the SLA.
- If the form is too long, they bail mid-fill. Stripped-down for Starter, full for Growth/Enterprise.
- Refund policy: decide upfront. Standard is "if you cancel within 7 days of first onboard, full refund; after that, month-to-month no refunds."
`,

  "st-081": `## Why this matters

This is the real run of \`onboard.js\` for a paying customer. Differs from \`_e2e-*\` tests only in that you don't tear down at the end.

## Steps

1. Save the customer's Intake JSON as \`clients/{their-slug}/site.ts\` (the slug should be a URL-safe version of their brand short).
2. \`cd jdd-ops && node onboard.js --schema clients/{their-slug}/site.ts\`.
3. Pipeline runs all 9 steps. 3–7 minutes total depending on plan.
4. Handoff prints with all resource IDs.

## Verify

- All steps succeed without errors.
- Site deploys to Vercel preview URL.
- For Growth/Enterprise: Retell agent + Twilio number provisioned + Airtable base created.

## Pitfalls

- This is the moment when bugs become customer-facing. Watch logs closely.
- If a step fails partway, you have a partial state. Either fix and re-run (idempotent for step 2's GitHub) OR tear down (carefully — NOT using \`_e2e-\` prefix) and retry.
- For the first 3 clients, hand-verify everything before delivering. Don't trust automation blindly.
`,

  "st-082": `## Why this matters

The 3 checkpoints from the PDF section 12 are what makes JDD a high-quality product, not just an automated script. They're where you catch issues before the client sees them.

## Steps

1. **Checkpoint 1 — Site review (~15 min)**:
   - Open Vercel preview URL.
   - Verify palette, brand name, all sections render.
   - Confirm services + FAQs are correct.
2. **Checkpoint 2 — Agent test call (~20 min)**:
   - Call the Twilio number.
   - Have a realistic qualification conversation.
   - If the agent fumbles, tune \`clients/{slug}/agent-prompt.txt\` and \`npm run update-prompt -- {agentId} --slug {slug}\`.
   - Re-test until satisfied.
3. **Checkpoint 3 — End-to-end form test (~15 min)**:
   - Clone master Make scenario for this client.
   - Replace placeholders, activate.
   - Paste webhook URL into \`.env.local\`, run \`sync-env\`.
   - Submit the lead form with your phone.
   - Verify Retell calls within 60s + Airtable row appears.

## Verify

- All 3 checkpoints pass.
- Total time: ~1 hour.

## Pitfalls

- Don't skip checkpoints under time pressure. A bad first impression with a paying client is hard to recover from.
- The agent prompt is the most likely thing to need tuning. Allow time for 2-3 iterations.
- Document any per-client customizations you make so you can replicate for future clients.
`,

  "st-083": `## Why this matters

This is the moment the client goes live. Their domain points at the new site, their phone calls go through Retell, leads land in Airtable. You've delivered.

## Steps

1. In Vercel: project → Settings → Domains → add their custom domain.
2. Vercel shows DNS records they need to add (A record + optional CNAME).
3. Coordinate with client: they add the DNS records at their registrar.
4. Wait for DNS propagation (5 min – 1 hour).
5. Vercel auto-issues SSL via Let's Encrypt.
6. Optional: clone the Looker Studio dashboard for them, share view-only link.
7. Send a launch email: "Your new site is live at {domain}! Here's what to expect..."
8. Add their info to your "active clients" tracker.

## Verify

- \`https://{their-domain}\` loads the deployed site over HTTPS.
- Lead form submission still triggers the Retell call.
- Looker dashboard shared (if applicable).
- Client confirms they're happy.

## Pitfalls

- DNS issues are the #1 cause of delays. Walk the client through it on a call if needed.
- HTTPS takes Vercel ~30 seconds to issue after DNS resolves. Don't panic if you see a warning briefly.
- Send a personal "welcome" email — first impressions matter for retention.
- Schedule a 30-day check-in to ask "how's it going?" Catches churn early.
`,
};
