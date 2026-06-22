---
description: Create a verified presentation from analysis code with full data auditing
argument-hint: "<directory>"
---
You are creating a PowerPoint presentation from analysis code and results.

## First: Load the Skill and Explore

1. Read the pptx skill (`/Users/michael/.agents/skills/pptx/SKILL.md`) and its `pptxgenjs.md` guide.
2. Find all code, CSV, and image files under `${1:-code}`. Read every `.py`, `.md`, `.csv`, and any confusion matrix images.

## Second: Exhaustive Data Inventory

Before writing a single line of code, run these verifications:

- `wc -l` on every CSV to know row counts (header ± data)
- `python3 -c "import pandas as pd; df = pd.read_csv('...'); print(df.describe()); print(df['accuracy'].mean())"` for every metrics CSV
- For step 2 comparisons: compute `pd.crosstab(df['class'], df['pred_image_only_label'])` and `pd.crosstab(df['class'], df['pred_multimodal_label'])` directly from the prediction CSVs
- Query: `helped = df[(~df['image_only_correct']) & (df['multimodal_correct'])]` and count it
- Query: `hurt = df[(df['image_only_correct']) & (~df['multimodal_correct'])]` and count it
- Every helped/hurt example you put in a table MUST be checked: `df[df['image_path'].str.contains('XXX')]` to confirm true label, predictions, and redshift

Collect every number and store it in comments or a scratch block. This is your source of truth.

## Third: Mandatory Audit Rules

Every single claim in the presentation must be traceable to a source file.

Rules you MUST follow:
- **Never round a number without checking the raw value.** If you say "0.0170", compute it: `0.9844 - 0.9674 = 0.0170`. If the raw difference is 0.0170758, your displayed rounded values must produce the same result.
- **Never say "24 helped cases" unless you counted them.** Count them. `len(helped)`.
- **Never say "most are stars" without checking.** `helped['class'].value_counts()`.
- **Every example row in a table** (e.g. "305_QSO" on a "helped" slide) — verify it exists in the actual CSV and the predictions match.
- **Every code reference** — check that the file path actually exists with `ls` or `test -f`.
- **Architecture descriptions** — must match actual code. Copy the exact layer structure from the source.

## Fourth: Design

- All white (`#FFFFFF`) slide backgrounds. No colored fills, no dark slides.
- Font: Georgia (serif) — both headers and body.
- Thin dividers only — no decorative shapes, no card shadows, no accent bars.
- Tables: thin 0.3pt borders, subtle header background (`#F8FAFC`).
- Monospace (Consolas) for feature names, metrics, code references.
- Every slide has: title → divider → content → (optional) code reference at bottom.

## Fifth: Write the Script

Create `presentation/generate_ppt.js` using pptxgenjs. Then:

```bash
cd presentation && npm init -y && npm install pptxgenjs && node generate_ppt.js
```

## Sixth: Verification

1. **Content QA**: `python3 -m markitdown presentation/step1_step2_analysis.pptx`
2. **Placeholder check**: pipe through `grep -iE "xxxx|lorem|ipsum"`
3. **No-staged-changes check**: `git diff --stat -- code/step2/ code/step3/` must be empty
4. **Number re-verification**: Re-run the python3 audit commands from step 2 against the final text
5. **If anything is wrong**, fix the script and regenerate. Do not edit the .pptx directly.
