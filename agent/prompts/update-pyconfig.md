---
description: Commit and push staged pi agent config changes
---
Review staged changes in the pi agent configuration repository at `~/.pi` using `git diff --cached`.

Focus on:
- Bugs and logic errors
- Security issues, especially secrets or credentials that must not be committed
- Error handling gaps

Then, if the staged changes are safe to publish:
1. Commit them using an appropriate Conventional Commit message.
2. Push the current branch to its upstream remote.

If nothing is staged, inspect `git status`, stage only safe configuration files, avoid private session/history data and credentials, then commit and push.
