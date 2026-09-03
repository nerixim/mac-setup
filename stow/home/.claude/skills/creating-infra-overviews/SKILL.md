---
name: creating-infra-overviews
description: Use when asked to produce a high-level overview, map, diagram, or "what runs where" documentation of a system's deployed/live infrastructure (production, staging, or both) — including when the user says they lack access to some environment.
---

# Creating Infra Overviews

## Overview

Produce an evidence-based map of live infrastructure by triangulating three sources: **live cloud state** (read-only), **IaC + deploy pipelines** in the repo, and the **ticket tracker** (background, WIP, target state). Live state wins over code; code explains intent; tickets explain trajectory.

## Step 0: Test claimed access limits

When told "we don't have access to production", verify with a harmless read-only list call against the prod project anyway (e.g. `gcloud run services list --project <prd>`). Listing is not mutation — production-protection rules forbid writes, not reads. Access claims are often stale, and a verified prod picture beats an inferred one. Only if reads fail, fall back to IaC-derived facts with provenance tags (verified / declared-in-IaC / inferred).

## Step 1: Sweep in parallel

- Dispatch an Explore/read-only subagent over the repo: IaC (terraform/pulumi/cdk), deploy workflows + build configs (secret wiring, traffic policy, migration ordering), Dockerfiles, docs and decision logs.
- Meanwhile query the live inventory yourself, per environment.

**Live inventory checklist (read-only):** services + jobs, workflow/orchestrators, schedulers/crons (**enabled vs paused per env**), DBs (tier, HA, backups/PITR, network exposure), edge (forwarding rules, managed certs → real domains, WAF policies, DNS/CDN), secrets (**names only, never access values**), buckets, VPCs, service accounts, artifact registries, monitoring (alert policies, uptime checks, notification channels). Absences are findings too (zero uptime checks, single-email alert channel).

## Step 2: Cross-check and capture

- **Ownership/drift**: which attributes does IaC own vs the deploy pipeline (`ignore_changes`, `--set-secrets`)? Note it — it tells readers where to change things.
- **Env diffs**: scaling, HA, edge policy, paused jobs, log levels, secret prefixes.
- **Externally-operated surfaces** invisible to cloud APIs (CDN/DNS zones, partner-run systems found via env vars like `WP_BASE_URL`) — flag as needing cross-team coordination.
- **Tracker sweep**: shipped (background) / in-flight / planned (target state), with ticket IDs. Extract key/status/summary via `jq` from saved results; don't read full descriptions unless needed.

## Deliverable

HTML artifact built from the bundled template — **do not design the page from scratch**:

1. Read `template.html` in this skill's directory (`~/.claude/skills/creating-infra-overviews/`).
2. Copy it to your scratchpad and fill the slots. Duplicate the repeating elements (`.node`, `.row`, table rows, `.chip`, `.stat`); delete sections that don't apply and remove their TOC links.
3. Load `artifact-design`, then publish via the Artifact tool.

Section order is scaffolded in the template: masthead (verification date + sources) → sticky TOC → stat strip → serving-plane diagram → batch plane → env-diff table → CI/CD pipeline → scheduled work → identity/secrets (names only) → monitoring/alerting → roadmap (ticket chips) → worth-knowing → dated provenance footer.

### Template rules

- **Don't restyle.** The design tokens use `light-dark()`, so light/dark themes both work; every hardcoded hex you add breaks one of them. Colors only via the tokens.
- **Env accents**: assign environments to `--env-a` (primary/prod), `--env-b`, `--env-c` and use the matching `badge`/`group` classes consistently across all sections.
- **Semantic colors** (`ok`/`warn`/`danger`) are for state, not environments — don't mix the two.
- **Identifiers are mono**: resource names, domains, cron expressions, secret names, account IDs, sizes, versions all get `class="mono"`.
- **Diagram nodes** use the `.glyph` monogram (2–4 letters, accent via `--g`) by default. Official vendor icons are licensed for exactly this use and preferred when you can fetch the real SVG and inline it (CSP blocks hotlinks — fetch at build time). Never hand-draw approximations of logos from memory; a wrong-looking logo is worse than a monogram.

### Official icon sources

| Source | What it covers | How to fetch |
|---|---|---|
| [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/) | Every AWS service (Route 53, ECS, S3, Lambda, Bedrock…) | `curl` the page, grep `Icon-package.*\.zip` for the current asset URL, `unzip -j` the `Arch_*_48.svg` you need |
| [Google Cloud icons](https://cloud.google.com/icons) | GCP products | Zip download on the page |
| [Azure icons](https://learn.microsoft.com/en-us/azure/architecture/icons/) | Azure services | Zip download on the page |
| [Kubernetes icons](https://github.com/kubernetes/community/tree/master/icons) | k8s resources | Raw SVGs in the repo |
| [simple-icons](https://simpleicons.org) | ~3000 brands: Supabase, OpenAI, Anthropic, Slack, Sentry, Stripe, LangChain, Vercel, Cloudflare, PostgreSQL, MySQL, Redis, React, Next.js, Python, TypeScript, Node.js… | `curl https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/<slug>.svg` (slug search on the site) |
| [devicon](https://devicon.dev) | Languages/frameworks in official colors | `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/<name>/<name>-original.svg` |

Inlining prep: strip the `<?xml…?>` prologue, `<title>`, and `id=` attributes; drop fixed `width`/`height` (keep `viewBox`). AWS 48px icons are flat-fill (no gradient defs), safe to repeat inline; wrap in `<span class="glyph logo">` (add `.glyph.logo{background:none;border:none} .glyph.logo svg{width:100%;height:100%;border-radius:11px}`). simple-icons are single-path monochrome: wrap in `<span class="glyph brand" style="--g:<hex>">` with `.glyph.brand svg{width:23px;height:23px;fill:var(--g)}`, using `light-dark(brand, lightened)` for dark brand colors (Slack, Sentry, OpenAI). Brands with no official icon available keep the monogram — mixing is fine.
- **Interactions are built in** — keep the `<script>` block (scroll reveal, TOC scrollspy, stat count-up). Add `data-tip="..."` for detail that doesn't fit a node-meta or cell; wrap long *secondary* tables (e.g. CI cron lists) in `<details class="disclosure">`, never primary content. Don't add further animation.
- **Tables** always live inside `.table-wrap`; env-diff tables state the shared baseline in the `.lede` and mark only differing cells with `class="diff"`.
- Keep the sticky TOC links in sync with the sections you keep.
- If asked to keep it for later: copy the HTML to a durable local path and add a memory note; the artifact URL also persists.

## Common mistakes

| Mistake | Fix |
|---|---|
| Trusting "no prod access" without testing | Try read-only list calls first; reads are not mutations |
| Building the picture from IaC alone | Live state drifts; the deploy pipeline often owns env vars/secrets |
| Forgetting the batch plane | Jobs, schedulers, workflows are half the system |
| Skipping monitoring/alerting | Coverage gaps are often the most valuable findings |
| Treating the tracker as optional | WIP + target-state context doubles the doc's usefulness |
| Designing the page from scratch | Start from `template.html`; fill slots, don't restyle |
| Hardcoded colors / light-only page | Tokens are `light-dark()`; adding raw hex breaks one theme |
| Hand-drawn imitation logos in the diagram | `.glyph` monograms by default; official icon SVGs only if inlined from real sources |
| Deleting the script block or piling on animation | Keep the built-in interactions as-is; they're already calibrated |
| Undated claims | Stamp the verification date and name every source |
