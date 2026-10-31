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

### 5b. Copilot review first, human reviewer second (trabox-inc, app and infra repos alike)

The team's rule (2026-10-20): every PR gets a Copilot code review before a human is asked. Request Copilot right after `gh pr create`, handle its findings, and only then add the human reviewer. Re-request Copilot after every push that changes the diff; it does not re-review on its own.

```bash
# request (also used to re-request after a push)
printf '{"reviewers":["copilot-pull-request-reviewer[bot]"]}' | gh api -X POST repos/<owner>/<repo>/pulls/<n>/requested_reviewers --input -
# verify it started: a review_requested for Copilot followed by copilot_work_started within ~1 min
gh api repos/<owner>/<repo>/issues/<n>/timeline --paginate | jq -r '.[] | select(.event=="review_requested" or (.event|startswith("copilot_work"))) | "\(.created_at) \(.event) \(.requested_reviewer.login // "")"'
# the review itself lands as a COMMENTED review by copilot-pull-request-reviewer, usually within 3 min
gh api repos/<owner>/<repo>/pulls/<n>/reviews | jq -r '.[] | select(.user.login|test("copilot")) | "\(.submitted_at) \(.state) \(.commit_id[:7])"'
```

- The timeline is the only proof. A `201 Created` from the request endpoint is not: on 2026-10-20 the call returned 201 from `nikita-kamaev-trabox` and nothing happened, while the same request from a teammate's account worked. If no `copilot_work_started` appears within 2 minutes, the requesting account lacks Copilot access or the repo has Copilot code review off; stop and say so instead of retrying
- Check the `commit_id` of the latest Copilot review against the PR head. A review on an older commit means the re-request after the push was skipped
- Quota reached: the request still succeeds and lands in the timeline, but the review body says "the user who requested the review has reached their quota limit". Do not wait a day for Copilot. Add the human reviewer right away, and optionally ask them in one line to trigger Copilot from their own account because yours hit the quota (owner's rule 2026-10-23)
- Human reviewer goes on with `gh pr edit <n> --add-reviewer <login>` only after Copilot's open threads are fixed or answered (or Copilot is skipped for quota, above). In trabox-inc the first candidate is the one named in memory `trabox-people.md`, app and infra alike (owner's instruction 2026-10-21); none on environment-promotion PRs

### 5.5 Stacked PRs (GitHub native stacks, GA 2026-10-06)

Use a stack when this change needs another PR that is not merged yet, or when the two must ship together.

- Branch off the lower PR's branch and open this PR with `--base <lower branch>`. Then put the PRs into one stack: the stacks UI on the PR page, or `gh stack link <lower PR> <this PR>` (official extension `github/gh-stack`; arguments bottom to top, PR numbers or branch names; a branch argument is pushed and gets a PR if it has none; a stack number as the first argument appends to that stack). `gh stack submit` creates the PRs and the stack in one go from locally tracked branches.
- Do not write a merge order in the PR bodies ("Merge order: after #885"). The stack panel on each PR already shows the order, the line goes stale once another PR is stacked on top, and it reads as "merge #885 first", which throws the stack away. When an upper PR cannot pass on the default branch without the lower one, say that as a dependency with its reason ("needs #885: on main without its fix this check fails"), and say why the PRs must land together if they must.
- Bots that only review PRs against the default branch (e.g. Copilot auto-review) skip the upper PR: request the review by hand.
- Merge the whole stack from its top PR: the top PR's "Merge stack (N)" button, or `gh stack merge <top PR>`, lands every unmerged PR below it, in order, in one atomic operation. The same button on a middle PR merges only up to that PR (stack #887 on 2026-10-31: #886 offered "Merge stack (2)", the top PR #888 "Merge stack (3)"). A ready stack is reported by its top PR, never as "merge the bottom first". Merge only a lower part when an upper PR is not ready, and say which.
- Read every PR's checks with `gh` before merging. `gh stack merge` checks only that each PR is open and not a draft, branch protection is enforced only when the merge runs, and where the default branch requires no checks (kanyomi) GitHub merges while checks are still running. Merge-requirement bypass is not supported for stacks. Auto-merge for stacks is still rolling out.
- Squash makes one commit per PR, in order (observed 2026-10-27). The merge-commit method makes one merge commit, for the top PR, that carries the whole stack (kanyomi stack #881, 2026-10-30).
- A commit on a lower PR's branch (review suggestions applied in the GitHub UI, a fix pushed there) is missing from the branches above it, and GitHub shows the stack as not mergeable even when nothing conflicts. Catch up bottom to top by merging each lower branch into the branch above it, with plain pushes:

  ```bash
  git -C <upper worktree> fetch origin
  git -C <upper worktree> merge --ff-only origin/<upper>   # commits made on GitHub, e.g. its own suggestions
  git -C <upper worktree> merge --no-edit origin/<lower>
  git -C <upper worktree> push origin <upper>
  # repeat one level up, with the branch just pushed as <lower>
  ```

  The push re-runs CI on each upper PR; read the checks again before merging. Squash folds the merge commits away. Stack #881 was fixed this way on 2026-10-30, after suggestions were applied on #879 and #880: `issue/767` was merged into `issue/768`, then `issue/768` into `issue/782`.
- Do not rebase a stack. `gh stack sync` / `gh stack rebase` rewrite branches locally, and `sync` / `push` push with `--force-with-lease`, which is a force push and is denied in repos that block it. If the bottom was merged alone, the next PR needs the default branch: merge it in the same way, or use GitHub's server-side "Rebase stack" button.
- After merge, the upper PR still reports its old base branch. Confirm each PR landed with `git log --grep=<key> origin/<default>` before closing tickets.
- Head branches are not auto-deleted after a stack merge, even where ordinary merges auto-delete (observed 2026-10-28). Delete the local branches with `git branch -d` while the remotes still exist, then delete each remote (`gh api -X DELETE repos/<owner>/<repo>/git/refs/heads/<branch>` where `git push --delete` is blocked).
- With squash, the stack lands as N commits on the default branch within seconds, so push-triggered deploys run per commit and the superseded runs get cancelled. Judge the deploy by the run for the top commit.
- Each PR needs its own required review or approval. Branch protection still applies per PR inside a stack.
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
- [ ] Copilot review requested and `copilot_work_started` seen in the timeline before the human reviewer was added (or skipped because the quota was reached, and the human reviewer was told why)
- [ ] Continued into CI/review monitoring after create
