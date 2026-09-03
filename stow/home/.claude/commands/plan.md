# PLAN Phase

## Purpose

Establish implementation strategy, task decomposition, file change planning, and testing approach.

## Required Input Files

- `docs/investigate/investigate_{TIMESTAMP}.md` - Investigation results

## Important Notes

- Read all related code thoroughly.
- Think carefully using ultrathink for all processes.

# User Input

# $ARGUMENTS

## Testing Strategy

- **Endpoint Testing**: Required (FastAPI: TestClient / httpx)
- **Integration Testing**: Implement as needed
- **E2E Testing**: Implement when UI changes are involved
- **Docker Environment Execution**: All tests must run in Docker environment

## TODOs to be included in this task

1. Understand user instructions
2. Load the latest `docs/investigate/investigate_{TIMESTAMP}.md` and review investigation results
3. Determine implementation strategy based on investigation results
4. Break down detailed implementation tasks and set priorities
5. Create file change plan (new creation, modification, deletion)
6. Establish testing strategy (unit, integration, E2E)
7. Consider risk analysis and countermeasures
8. Document implementation plan and save to `docs/plan/plan_{TIMESTAMP}.md`
9. Check `@ai-rules/ISSUE_GUIDELINES.md` if necessary and create GitHub Issue
10. Execute `afplay /System/Library/Sounds/Sosumi.aiff` to notify user about plan completion and file saving
11. Output plan file name and created Issue number (if any) to console

## GitHub Issue Creation (if necessary)

Follow `@ai-rules/ISSUE_GUIDELINES.md` and create an Issue including:

- Title
- Overview
- Acceptance criteria
- Task list
- Priority and labels

## Output Files

- `docs/plan/plan_{TIMESTAMP}.md`

## Final Output Format

- Always output in the following two formats

### When Plan Development is Complete

status: SUCCESS
next: IMPLEMENT
details: "Implementation plan development completed. Details recorded in plan_{TIMESTAMP}.md. Moving to implementation phase."

### When Investigation is Insufficient

status: NEED_MORE_INFO
next: INVESTIGATE
details: "Insufficient information. Details recorded in plan_{TIMESTAMP}.md. Additional investigation required."
