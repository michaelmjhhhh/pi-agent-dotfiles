---
description: Commit and push pi agent config updates
---
Commit and push new pi agent configuration changes from the repository at `~/.pi`.

Primary goal:
1. Inspect `git status` in `~/.pi`.
2. Stage all safe configuration changes that should be versioned.
3. Do not stage secrets, credentials, local sessions, history, logs, or temporary files.
4. Review the staged diff for obvious bugs, logic errors, security issues, and error-handling gaps.
5. Commit using an appropriate Conventional Commit message.
6. Push the current branch to its upstream remote.

Use the existing `.gitignore` as a safety boundary, and update it first if new private/local-only paths appear.
