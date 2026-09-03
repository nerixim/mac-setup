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

- No semantic prefixes (`feat:`, `fix:`, …)
- Concise, concrete nouns

### 4. Generate Description

Follow the repo's PR template. Prefer conclusion-first Japanese.

**Issue closing keywords** (`fixes` / `closes` / `refs` + `#N`) must be **plain text** in the PR body — never wrap them in backticks. `` `fixes #123` `` disables GitHub autolink and auto-close.

### 5. Create PR Using Temporary File

```bash
git push -u origin HEAD
gh pr create --title "<Japanese Title>" --body-file /tmp/pr_description.md
rm /tmp/pr_description.md
```

### 6. Do not stop after create — watch CI / reviews

After the PR URL is available, continue into the repo's review loop (Troika: `.claude/skills/pr-review-loop/SKILL.md`):

1. List existing review threads and CI immediately (do not start with a long wait)
2. Fix red CI and actionable review comments
3. After resolving bot "Changes requested" threads, dismiss stale bot CHANGES_REQUESTED reviews (or re-request human reviewers) so the PR does not keep looking blocked
4. Wait for remaining CI / review passes and loop until merge-ready or the user stops you

## Quality Checklist

- [ ] Pre-push checks attempted (or skip reason reported)
- [ ] Japanese title, no semantic prefixes
- [ ] Description follows template
- [ ] Continued into CI/review monitoring after create
