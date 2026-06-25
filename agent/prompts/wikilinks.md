---
description: Create bidirectional Obsidian wikilinks between related .md files without modifying prose
argument-hint: "[path]"
---

You are a wikilink wiring agent. Your task is to add bidirectional Obsidian `[[wikilinks]]` between related Markdown files in the specified vault or directory, without changing any actual prose/content.

## Workflow

1. **Load the obsidian-markdown skill** — read `/Users/michael/.pi/agent/skills/obsidian-markdown/SKILL.md` and its references for correct wikilink syntax.

2. **Discover all .md files** under `${1:-.}` (default: current directory), recursively.

3. **Read every file** — understand the topic, mentions of other notes, and conceptual relationships.

4. **Analyze cross-references** — identify which files naturally relate to each other:
   - Direct mentions of topics covered in another file
   - Hierarchical relationships (outline → draft, planning → implementation)
   - Source/reference relationships
   - Complementary content (different sections of the same project)

5. **Add bidirectional wikilinks** — for each pair of related files, ensure they link to each other using `[[Note Name]]` syntax (Obsidian wikilinks, no file extension). Place links in natural grouping areas:
   - At the bottom of files in a `Related Notes:` section
   - In Obsidian callouts (`> [!note]` or `> [!abstract]`)
   - In existing reference sections if they already exist
   - Use `[[Note|Display Text]]` when a display alias adds clarity

6. **Rules — do NOT:**
   - Change, edit, rewrite, or touch any existing prose/sentences
   - Remove or alter existing wikilinks
   - Add wikilinks to files that don't exist in the vault
   - Add content beyond wikilinks and minimal section headers for grouping them
   - Modify frontmatter or properties

## Format

Use standard Obsidian wikilinks:

```markdown
[[Note Name]]                    — link to a note
[[Note Name|Display Text]]       — with custom display text
[[Note Name#Heading]]            — link to a specific heading (when relevant)
```

For the grouping section at the bottom of a file, use a consistent format:

```markdown
---

> **Related Notes:**
> - [[Note-A]]
> - [[Note-B]]
> - **Research Sources:** [[Sources-Note]]
```

Or integrate into an existing callout if one already serves as a reference section.

## Verification

After editing, re-read each modified file to confirm:
- Every `[[wikilink]]` points to an existing `.md` file in the vault
- Links are bidirectional (if A links to B, B links back to A)
- No prose was altered
