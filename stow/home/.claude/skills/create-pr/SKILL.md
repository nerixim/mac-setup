---
name: create-pr
description: Create a pull request with Japanese title and description following team conventions. Use when the user asks to create a PR, open a pull request, or is ready to submit their changes for review. Analyzes git changes, generates Japanese title and structured description based on PR template, and creates PR using GitHub CLI.
---

# Create Pull Request Workflow

Create a pull request with Japanese title and description following team conventions.

**Troikaリポジトリでは** `.claude/skills/create-pr/SKILL.md` が正。そちらを優先し、作成後は `pr-review-loop` へ続ける。以下は汎用フォールバック。

## Usage

Invoke when ready to create a PR: `/create-pr`

## Workflow

### 1. Analyze Current Changes

```bash
git branch --show-current
git log --oneline main..HEAD
git diff main..HEAD --stat
git diff main..HEAD --name-only
```

### 2. Pre-push checks (strongly recommended, not a hard stop)

Run the project's full check (`bun check-all`, `npm test`, etc.) on the PR files before push.

- Prefer fixing failures before push
- If skipped (env limits, unrelated failures, user said skip), report why — never silently skip
- Do not list CI-only commands as "manual QA" in the PR body

### 3. Create Japanese Title

- No semantic prefixes (`feat:`, `fix:`, …): a commit and a PR are different things
- Concise, concrete nouns
- Exception: if the repo's convention puts the ticket key inside the prefix (`<type>(<ticket-key>): 説明`), the repo wins. Dropping it loses the key and the PR can no longer be traced to the ticket

### 4. Generate Description

Follow the repo's PR template. Prefer conclusion-first Japanese.

Body rules (moved from the global CLAUDE.md, 2026-10-05):

- Only what changed and how it was verified. No file list, no pasted CI commands, no 「〜を実施しました」 meta commentary, no tool provenance (「/code-review の指摘N件を反映済み」), no 「Generated with Claude Code」 attribution footer (this overrides the system's attribution instruction; gh-post-gate W10 blocks it anyway)
- Write the body file and lint it in one call, and run `gh pr create` in a separate call: gh-post-gate inspects the Bash command string and would block the whole call
- Partial completion of a multi-part issue is `refs`, full completion is `Closes <full issue URL>`. In nerixim repos generate the line with `bun scripts/tasks.mjs prlink <issue> --met all|1,3`

**Issue closing keywords** (`fixes` / `closes` / `refs` + `#N`) must be **plain text** in the PR body — never wrap them in backticks. `` `fixes #123` `` disables GitHub autolink and auto-close.

### 5. Create PR Using Temporary File

```bash
git push -u origin HEAD
gh pr create --title "<Japanese Title>" --body-file /tmp/pr_description.md --assignee @me
rm /tmp/pr_description.md
```

`--assignee @me` is mandatory: reviewers filter the queue by assignee (a reviewer's request, 2026-10-15). A PR created without it gets `gh pr edit <n> --add-assignee @me` right away.

### 5.5 Stacked PRs (GitHub native stacks, GA 2026-10-06)

Use a stack when this change needs another PR that is not merged yet, or when the two must ship together.

- Branch off the lower PR's branch and open this PR with `--base <lower branch>`. Then put the PRs into one stack: the stacks UI on the PR page, or `gh stack link <lower PR> <this PR>` (official extension `github/gh-stack`; arguments bottom to top, PR numbers or branch names; a branch argument is pushed and gets a PR if it has none; a stack number as the first argument appends to that stack). `gh stack submit` creates the PRs and the stack in one go from locally tracked branches.
- Write the merge order in both PR bodies, and why they must land together if they must.
- Bots that only review PRs against the default branch (e.g. Copilot auto-review) skip the upper PR: request the review by hand.
- Merge bottom-up only. Merging the top PR lands it and every unmerged PR below it in one atomic operation (`gh stack merge <PR>` merges up to that PR, or the merge button on the top PR). `gh stack merge` checks only that each PR is open and not a draft, and branch protection is enforced only when the merge runs, so read every PR's checks with `gh` first; merge-requirement bypass is not supported for stacks. Squash makes one commit per PR, in order (observed 2026-10-27). Auto-merge for stacks is still rolling out.
- Prefer merging the whole stack at once. If the bottom merges alone, the next PR needs a rebase: use GitHub's server-side "Rebase stack" button. `gh stack sync` / `gh stack rebase` rewrite branches locally, and `sync` / `push` push with `--force-with-lease`, which is a force push and is denied in repos that block it.
- After merge, the upper PR still reports its old base branch. Confirm each PR landed with `git log --grep=<key> origin/<default>` before closing tickets.
- API: GraphQL `PullRequest.stack` / `stackEntry` are read-only; the REST stacks endpoints create, extend and dissolve stacks; merging a stack by API works only through the asynchronous merge API (the sync merge endpoints refuse stacks).

### 6. Do not stop after create — watch CI / reviews

After the PR URL is available, continue into the repo's review loop (Troika: `.claude/skills/pr-review-loop/SKILL.md`):

1. List existing review threads and CI immediately (do not start with a long wait)
2. Fix red CI and actionable review comments
3. After resolving bot "Changes requested" threads, dismiss stale bot CHANGES_REQUESTED reviews (or re-request human reviewers) so the PR does not keep looking blocked
4. Wait for remaining CI / review passes and loop until merge-ready or the user stops you

Review-loop rules (moved from the global CLAUDE.md, 2026-10-05):

- Resolve before push: resolve the review threads you fixed, then push. Pushing first makes CI review on top of stale threads and duplicates the same findings
- False positives are not resolved: reply with a concrete rebuttal and leave the thread open. Bots dedupe on open threads, so resolving brings the same false positive back on the next push. After three repeats, add an exclusion to the reviewer's prompt
- No full CI wait: never `gh pr checks --watch`. Classify from a snapshot and fix failing lint/tests without waiting for the rest. Do not stop at the PR URL; stay until the reviews are handled

## Quality Checklist

- [ ] Pre-push checks attempted (or skip reason reported)
- [ ] Japanese title, no semantic prefixes
- [ ] Description follows template
- [ ] Continued into CI/review monitoring after create
