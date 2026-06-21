---
description: Find installed skills matching a query and upgrade them with npx skills
argument-hint: "[query]"
---
Find and upgrade installed agent skills using the Skills CLI.

Scope/query: `${ARGUMENTS:-all globally installed skills}`

Workflow:
1. Identify matching installed skills:
   - If a query is provided, list globally installed skills and filter by the query.
   - If no query is provided, consider all globally installed skills.
   - Use `npx skills ls -g --json` for a reliable inventory.
2. Upgrade directly where possible:
   - If no query was provided, run `npx skills update -g -y`.
   - If a query was provided, run `npx skills update <matching-skill-names> -g -y`.
3. If `npx skills update` says any matching skills cannot be checked automatically because they came from a Git URL, follow the CLI's suggested `npx skills add <source> -g -y` command to refresh them.
4. Do not delete skills just because the CLI says they appear deleted upstream unless I explicitly ask you to remove them.
5. Verify the result with `npx skills ls -g --json` and report:
   - Which skills matched
   - Which skills were upgraded/refreshed
   - Any warnings or skipped deletions
   - Any skills that could not be upgraded

Keep the summary concise.
