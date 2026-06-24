---
description: Integrate Vercel Web Analytics into any project (Next.js App Router)
argument-hint: "[project-dir]"
---
# Vercel Web Analytics Integration

Integrate @vercel/analytics into the project at ${1:-.}.

## Steps

### 1. Detect package manager and install

```bash
cd "${1:-.}"

# Detect package manager
if [ -f "pnpm-lock.yaml" ]; then
  PKG_MGR="pnpm add"
elif [ -f "yarn.lock" ]; then
  PKG_MGR="yarn add"
elif [ -f "bun.lock" ] || [ -f "bun.lockb" ]; then
  PKG_MGR="bun add"
else
  PKG_MGR="npm install"
fi

$PKG_MGR @vercel/analytics
```

### 2. Locate the root layout file

Find where to place `<Analytics />`. For Next.js App Router (most common):

```bash
# Look for layout files
ls app/layout.tsx app/layout.jsx 2>/dev/null || echo "No standard layout found"
```

If it's a Pages Router project (`pages/_app.tsx` or `pages/_document.tsx`), adjust accordingly.

### 3. Add the import and component

In the root layout file, add:

```tsx
import { Analytics } from "@vercel/analytics/next";
```

And place `<Analytics />` inside the `<body>` element — right after the opening `<body>` tag is recommended.

**Only make these two changes — do not modify anything else.**

### 4. Verify the build

```bash
cd "${1:-.}"
npx next build 2>&1 | tail -20
```

Confirm the build succeeds with no TypeScript or compilation errors.

### 5. Commit and push

Stage the changes, commit with a conventional commit message, and push to origin:

```bash
cd "${1:-.}"
git add -A
git commit -m "feat(analytics): add Vercel Web Analytics integration

Install @vercel/analytics and wire the Analytics component into the
root layout for page-view tracking."
git push origin HEAD
```

## Supported layouts

| Framework / Router     | File                          | Import from                      |
|------------------------|-------------------------------|----------------------------------|
| Next.js App Router     | `app/layout.tsx`              | `@vercel/analytics/next`         |
| Next.js Pages Router   | `pages/_app.tsx`              | `@vercel/analytics/react`        |
| Next.js Pages Router   | `pages/_document.tsx`         | `@vercel/analytics/react`        |

If the project doesn't use Next.js, stop and report what framework is being used — the template currently targets Next.js.
