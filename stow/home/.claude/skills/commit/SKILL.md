---
name: commit
description: Create commits with Japanese descriptions using Conventional Commits format, with comprehensive quality validation (compile, lint, test). Use when the user asks to commit changes, create a commit, or save work. Supports three modes via $ARGUMENTS - current (recently modified files), staged (git staged files), or custom (user-specified files).
---

# Commit Changes with Quality Checks

Create commits with Japanese descriptions following Conventional Commits format, with mandatory quality validation.

## Usage

Invoke with one of three modes:

- `current` - Commit recently modified files from the conversation
- `staged` - Commit currently staged changes
- `custom` - Ask user which files to commit

Example: `/commit current` or `/commit staged`

## Workflow

### 1. Validate Branch

Check the current branch and fail immediately if on main:

```bash
git branch --show-current
```

**Stop if on main branch** - commits must be on feature branches.

### 2. Determine Target Files

Based on $ARGUMENTS:

- **current**: Identify files modified in this conversation
- **staged**: Get staged files with `git diff --cached --name-only`
- **custom**: Ask user to specify files, then stage them with `git add`

### 3. Run Quality Checks

Execute all checks and stop if any fail:

```bash
bun compile  # Type checking
bun lint     # Linting and formatting
bun test:claude     # Test suite
```

**Critical**: Display errors and stop if any check fails. Do not proceed to commit.

### 4. Analyze Changes

Review the diff output to understand:

- What changed and why
- Impact on users or system
- Appropriate commit type

Get the diff:

```bash
git diff --cached  # For staged files
```

### 5. Generate Commit Message

Use Conventional Commits format with Japanese description:

```
<type>: <Japanese description>

<Optional longer Japanese description if needed>
```

**Commit types**:

- `feat:` - 新機能追加 (new features)
- `fix:` - バグ修正 (bug fixes)
- `chore:` - 設定変更やメンテナンス (configuration, maintenance)
- `refactor:` - リファクタリング (code refactoring)
- `docs:` - ドキュメント更新 (documentation)
- `test:` - テスト追加・修正 (tests)
- `style:` - コードスタイル修正 (formatting, styling)

**Examples**:

- `feat: ユーザー認証機能を追加する`
- `fix: 日付入力フィールドのバリデーションエラーを修正する`
- `refactor: データベースクエリのパフォーマンスを改善する`
- `style: コンポーネントのスタイリングを整理する`

**Guidelines**:

- Keep it simple and clear - explain what changed
- Focus on user impact, not technical details
- Usually one line; use body only if necessary
- Write in natural Japanese

### 6. Execute Commit

Stage files if needed (for `current` or `custom` mode):

```bash
git add <files>
```

Create the commit:

```bash
git commit -m "<commit message>"
```

### 7. Display Summary

Show the commit details:

```bash
git log -1 --oneline
```

Remind user of next steps:

- Push to remote: `git push`
- Create PR when ready: `/project:create-pr`

## Error Handling

- **On main branch**: Stop immediately, inform user to create feature branch
- **Quality checks fail**: Display errors, stop process, ask user to fix issues
- **No changes detected**: Inform user and exit gracefully
- **Git errors**: Show git error message and suggest solutions

## Quality Checklist

Ensure these conditions before committing:

- [ ] Not on main branch
- [ ] All quality checks pass (compile, lint, test)
- [ ] Appropriate commit type selected
- [ ] Japanese description is clear and concise
- [ ] Files properly staged
- [ ] Commit created successfully
