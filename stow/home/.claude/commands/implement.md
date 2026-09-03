# IMPLEMENT Phase

# User Input

# $ARGUMENTS

## Purpose

Perform implementation in task units based on plan.md. Continuously update Draft PR.

## Important Notes

- Always think carefully using ultrathink for all work
- Emojis should not be used in code.

## Required Input Files

- `docs/plan/plan_{TIMESTAMP}.md` - Implementation plan document
- GitHub Issues (if any)
- Related existing files and code

## TODOs to be included in this task

1. Understand user instructions and notify implementation start in console
2. Load the latest `docs/plan/plan_{TIMESTAMP}.md` file and review implementation plan
3. Check current branch and verify being on the appropriate branch
4. Execute implementation step by step according to the plan
5. Commit and push following `@ai-rules/COMMIT_AND_PR_GUIDELINES.md`
6. Create or update Draft PR (create on initial implementation, update on continuation)
7. Record implementation details in `docs/implement/implement_{TIMESTAMP}.md`
8. Execute `afplay /System/Library/Sounds/Sosumi.aiff` to notify user about implementation completion and file saving
9. Output related plan file, implementation detail file, and PR number to console

## Branch and Commit Rules

- Branch naming: Follow `@ai-rules/COMMIT_AND_PR_GUIDELINES.md`
- Commit messages: Follow the same guidelines
- Small commits: Split appropriately by task units
- Draft PR: Create on initial implementation, update on continuation

## Output Files

- `docs/implement/implement_{TIMESTAMP}.md` - Implementation detail record

## Final Output Format

- Always output in the following three formats

### When Implementation is Complete

status: SUCCESS
next: TEST
details: "Implementation completed. Details recorded in implement_{TIMESTAMP}.md. Moving to test phase."

### When Additional Work is Required

status: NEED_MORE
next: IMPLEMENT
details: "Dependency implementation required. Details recorded in implement_{TIMESTAMP}.md. Continuing tasks."

### When Plan Review is Required

status: NEED_REPLAN
next: PLAN
details: "Design changes required. Details recorded in implement_{TIMESTAMP}.md. Returning to plan phase."
