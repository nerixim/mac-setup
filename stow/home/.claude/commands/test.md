# TEST Phase

# User Input

# $ARGUMENTS

## Purpose

Execute validation of **endpoint functionality** for added and modified code in Docker environment.

## Test Execution Policy

- **Docker environment execution required**: All tests must run within Docker containers
- **Environment consistency**: Minimize differences from production environment
- **Reproducibility assurance**: Eliminate environment-dependent issues

## Required Input Files

- `docs/plan/plan_{TIMESTAMP}.md` - Test requirements verification
- `docs/implement/implement_{TIMESTAMP}.md` - Implementation details
- Implemented code (current branch)

## Test Types

- **Endpoint Testing (Required)**
  - Execution in Docker Compose environment
  - FastAPI: `TestClient` / `httpx`
  - Each endpoint status_code == 200
  - Response JSON matches expected schema
- **Integration Testing (Optional)**
  - Database integration testing within Docker containers
  - External API integration testing within Docker containers
- **E2E Testing (Optional)**
  - Browser testing using Playwright in Docker environment

## TODOs to be included in this task

1. Understand user instructions and notify test start in console
2. Check test requirements from latest `docs/plan/plan_{TIMESTAMP}.md`
3. Check implementation details from latest `docs/implement/implement_{TIMESTAMP}.md`
4. Notify user of Docker Compose environment setup and startup
5. Create test cases for added and modified endpoints
6. Execute endpoint testing within Docker environment
7. Execute integration and E2E testing within Docker environment as needed
8. Notify user of test execution status in real-time
9. Report details to user if any tests fail
10. Comprehensively evaluate and document test results
11. Notify user of Docker environment shutdown and cleanup
12. Save test results in `docs/test/test_{TIMESTAMP}.md`
13. Notify user of test completion and file saving
14. Output next phase transition decision to console

## Output Files

- `docs/test/test_{TIMESTAMP}.md`

## Final Output Format

- Always output in the following three formats

### When Tests Pass

status: SUCCESS
next: DONE
details: "All tests passed. Details recorded in test_{TIMESTAMP}.md."

### When Tests Fail and Fixes Are Required

status: FAILURE
next: IMPLEMENT
details: "Failure: /users GET returned 500 error. Check test_{TIMESTAMP}.md for details. Fixes required."

### When Fundamental Issues Are Discovered

status: CRITICAL_FAILURE
next: INVESTIGATE
details: "Critical issues discovered. test_{TIMESTAMP}.md. Re-investigation of root causes required."
