---
description: Open a GitHub pull request for the current branch
argument-hint: "[base-branch]"
---
Open a GitHub pull request for the current development branch using GitHub CLI.

Use `${1:-main}` as the default base branch unless another base branch is provided.

Workflow:
1. Inspect the repository state with `git status --short --branch`.
2. Confirm the current branch is a development branch, not `main` or `master`.
3. If there are uncommitted changes, stop and explain what must be committed first.
4. Ensure the branch is pushed to its upstream remote; if no upstream exists, push with `git push -u origin HEAD`.
5. Summarize what changed using commands such as:
   - `git log --oneline ${1:-main}..HEAD`
   - `git diff --stat ${1:-main}...HEAD`
   - `git diff --name-status ${1:-main}...HEAD`
6. Create a clear Markdown PR body, preferably in a temporary file, with this structure:

```markdown
## Summary
- Concise bullet list of what changed

## Changes
- Notable implementation/configuration updates

## Verification
- Commands run and results, or `Not run` with a reason

## Risk / Notes
- Migration, compatibility, security, or follow-up notes
```

7. Use `gh pr create` to open the PR, for example:
   `gh pr create --base ${1:-main} --head <current-branch> --title "<clear title>" --body-file <temp-body-file>`
8. Return the PR URL and a short summary.

Do not include secrets or local-only files in the PR body. If `gh` is not authenticated or the repository remote is missing, report the exact blocker and command needed to fix it.
