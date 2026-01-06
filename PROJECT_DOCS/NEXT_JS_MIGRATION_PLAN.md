# Strategic Implementation Plan: Security Patch & Next.js Migration

## Strategic Pivot
The user has correctly identified that **Next.js is the priority** for a 10/10 SEO score. Fixing the current React (SPA) codebase is "polishing a sinking ship" for SEO purposes.

**New Strategy**:
1.  **Patch Critical Security** on the current site (ensure it's safe while it remains live).
2.  **Skip "Band-aid" SEO Fixes** (Canonical, Meta tags hacks).
3.  **Immediately Start Next.js Migration** as the core project.

---

## Phase 1: Security Triage (Current Codebase) - < 1 Hour
*Goal: Ensure the live site is not hackable while we build the new one.*

### 1. Secure `vite.config.ts`
- **Action**: Delete the `api-server` middleware.
- **Why**: Eliminates the Remote Code Execution (RCE) vulnerability immediately.

### 2. Prevent Crashes (Optional but Recommended)
- **Action**: Quick fix for `MoviePage` infinite loops.
- **Why**: Keeps the current site usable for visitors until the restart.

---

## Phase 2: The Next.js Migration (New Project) - High Priority
*Goal: Rebuild for 10/10 SEO, Performance, and Stability.*

### 1. Initialization
- **Action**: Initialize `create-next-app` (v15 App Router).
- **Setup**: Tailwind CSS, TypeScript, ESLint.

### 2. Porting & Architecture (SSR)
- **Action**: Port `MovieHero`, `MovieGrid` components.
- **Change**: Replace client-side `MovieContext` fetching with Server Components (`async function Page({ params })`).
- **SEO**: Implement Metadata API (`generateMetadata`) for dynamic titles/images.

### 3. Routing & Logic
- **Action**: Re-implement routing (`/movie/[id]`, `/browse/[genre]`).
- **Optimization**: Use `next/image` for automatic image optimization (replacing the manual `wsrv.nl` logic).

---

## How Agents Can Access This Plan
I will move this plan and the audit report into your repository at:
`c:\WEB DEV\Filmospere\Filmospere Repo\PROJECT_DOCS\`

Any agent you open in this workspace will see this folder and can read the context.
