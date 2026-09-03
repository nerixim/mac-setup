---
name: pr-review
description: Handle GitHub PR review comments comprehensively
usage: /pr-review <pr-number> [owner/repo]
---

# GitHub PR Review Handler

Process GitHub PR review comments systematically and respond appropriately.

## Arguments

- `$1`: PR number (required)
- `$2`: Repository in format owner/repo (optional, defaults to current repo)

## Workflow

Handle GitHub PR review comments systematically. Here's what I'll do:

1. **Fetch PR Information**: Get the PR details and all associated comments
2. **Read All Comments**: Collect both PR comments and review comments
3. **Analyze Comments**: Understand each comment and categorize them
4. **Decision Making**: Determine which comments need to be addressed
5. **Code Fixes**: Implement fixes for comments we decide to address
6. **Commit & Push**: Create commits with appropriate messages
7. **Response**: Post responses in the same language as reviewers
8. **Post Follow-up for special cases**: If addressed comments from `gemini-code-assist`, post a separate follow-up comment `/gemini review` for another review.

Start by fetching the PR information for PR #$1.

```bash
!gh pr view $1 ${2:+--repo $2} --json number,title,headRefName,headRepository,baseRefName
```

Get comments for the particular PR review if specified:

```bash
gh api repos/{owner}/{repo}/pulls/{pull_number}/reviews | jq '.[] | select(.id == {review_id})'
```

If not specified, get all comments for the PR:

```bash
!gh pr view $1 ${2:+--repo $2} --comments
!gh api repos/${2:-$(gh repo view --json owner,name --jq '.owner.login + "/" + .name')}/pulls/$1/reviews
```

Analyze each comment to understand:

- What specific issue or suggestion is being raised
- Whether it's a blocking issue or suggestion
- The technical complexity of addressing it
- The reviewer's language preference for responses

Make decisions on which comments to address based on:

**Comments to Address:**

- Implement the requested changes
- Create focused commits with clear messages
- Reference the original comment in commit messages
- Post a response with the commit hash in the reviewer's language

**Comments Not to Address:**

- Provide clear reasoning for why we're not implementing the suggestion
- Be respectful and explain technical constraints or project decisions
- Use the same language as the reviewer

Proceed with analyzing the PR comments and implementing this workflow.
