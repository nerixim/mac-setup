# INVESTIGATE Phase

# User Input

# $ARGUMENTS

## Purpose

Understand the background, requirements, and constraints to determine the implementation direction.

## Important Notes

- Read all related code thoroughly.
- Think carefully using ultrathink for all processes.
- Do not use emojis when writing to files.

## TODOs to be included in this task

2. Clarify investigation targets and scope
3. Check current branch status and create `feature/<topic>` branch
4. Collect related files, logs, and documentation for systematic analysis
5. Investigate technical constraints and possibilities
6. Verify compatibility with existing systems
7. Identify root causes of problems and solution approaches
8. Document investigation results and save to `docs/investigate/investigate_{TIMESTAMP}.md`
9. Present recommendations for the next phase (Plan)
10. Execute `afplay /System/Library/Sounds/Sosumi.aiff` to notify user about investigation completion and file saving
11. Output the created branch name and investigation result file name to console

## Branch Creation Rules

- Branch naming: `feature/<topic>` or `fix/<issue>`
- Always create from `main` branch
- Continue all work on the created branch after creation

## Output Files

- `docs/investigate/investigate_{TIMESTAMP}.md`

## Final Output Format

- Always output in the following two formats

### When Investigation is Complete (Implementation Recommended)

status: COMPLETED
next: PLAN
details: "Investigation completed. feature/<topic> branch created. Details documented in docs/investigate/investigate_{TIMESTAMP}.md. Implementation planning recommended."

### When Investigation is Complete (Implementation Not Required)

status: COMPLETED
next: NONE
details: "Investigation completed. Details documented in docs/investigate/investigate_{TIMESTAMP}.md. Can be handled with existing functionality. No implementation or changes required."
