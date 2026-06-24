---
description: Integrate Vercel Web Analytics into Next.js or React projects
argument-hint: "[project-dir]"
---
# Vercel Web Analytics Integration

Integrate @vercel/analytics into the project at ${1:-.}. Supports Next.js (App Router & Pages Router) and plain React (Vite, CRA, etc.).

## Steps

### 1. Detect framework and package manager

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

# Detect framework
if [ -f "next.config.js" ] || [ -f "next.config.ts" ] || [ -f "next.config.mjs" ]; then
  FRAMEWORK="nextjs"
elif grep -q '"vite"' package.json 2>/dev/null; then
  FRAMEWORK="vite-react"
elif [ -f "src/App.tsx" ] || [ -f "src/App.jsx" ] || [ -f "src/App.js" ]; then
  FRAMEWORK="react"
else
  FRAMEWORK="unknown"
fi
```

### 2. Install

```bash
cd "${1:-.}"
$PKG_MGR @vercel/analytics
```

### 3. Locate the root file and add the import + component

**If Next.js App Router** (`app/layout.tsx` or `app/layout.jsx`):
- Import from `@vercel/analytics/next`
- Place `<Analytics />` inside `<body>`, right after the opening tag

**If Next.js Pages Router** (`pages/_app.tsx`, `pages/_document.tsx`):
- Import from `@vercel/analytics/react`
- Place `<Analytics />` inside the root component

**If plain React** (look for `src/App.tsx`, `src/App.jsx`, `src/main.tsx`, `src/index.tsx`):
- Import from `@vercel/analytics/react`
- Place `<Analytics />` at the top of the app's root component (inside the JSX tree, typically near the top-level `<div>` or `<BrowserRouter>`)

**Only make these two changes** — add the import and place the `<Analytics />` component. Do not modify anything else.

```tsx
// Next.js App Router — import
import { Analytics } from "@vercel/analytics/next";

// Next.js Pages Router / plain React — import
import { Analytics } from "@vercel/analytics/react";
```

### 4. Verify the build

```bash
cd "${1:-.}"

if [ -f "next.config.js" ] || [ -f "next.config.ts" ] || [ -f "next.config.mjs" ]; then
  npx next build 2>&1 | tail -20
elif [ -f "vite.config.ts" ] || [ -f "vite.config.js" ]; then
  npx vite build 2>&1 | tail -20
else
  echo "Run the project's build command to verify."
fi
```

Confirm the build succeeds with no TypeScript or compilation errors.

### 5. Commit and push

```bash
cd "${1:-.}"
git add -A
git commit -m "feat(analytics): add Vercel Web Analytics integration"
git push origin HEAD
```

## Lookup table

| Framework / Router         | Root file(s)                     | Import from                      | Build command         |
|----------------------------|----------------------------------|----------------------------------|-----------------------|
| Next.js App Router         | `app/layout.tsx` / `.jsx`        | `@vercel/analytics/next`         | `next build`          |
| Next.js Pages Router       | `pages/_app.tsx` / `_document.tsx` | `@vercel/analytics/react`      | `next build`          |
| React (Vite)               | `src/App.tsx` / `src/main.tsx`   | `@vercel/analytics/react`        | `vite build`          |
| React (CRA)                | `src/App.js` / `src/index.js`    | `@vercel/analytics/react`        | `react-scripts build` |

If the framework is not detected as Next.js or React, stop and report what was found so the user can adjust manually.
