# Filmospere Technical Audit Report

## 1. Overall Verdict
**Verdict:** **DANGEROUS / HOBBYIST ONLY**.
This site is **NOT production-ready**. While the frontend is visually ambitious, the architecture is fundamentally flawed for SEO, and there is a **critical security vulnerability** in the development server configuration. The site relies on "hacks" (manual DOM injection, client-side caching) to compensate for the lack of Server-Side Rendering (SSR). If you deploy this today, Google will likely index blank pages or skeletons, and a malicious actor could theoretically exploit the local file writing if the development server is exposed.

**Biggest Risk:** **The "Skeleton Trap" (CSR vs SEO)**.
Googlebot often indexes the initial HTML state. Your initial state is a white screen or a skeleton. You are relying on Client-Side Rendering to inject meta tags. While Google *can* execute JS, it is unpredictable. Without SSR (Next.js/Remix), your "Instant Metadata" fix is a fragile band-aid that often fails in the real world.

---

## 2. Scoring (Strict & Honest)

| Category | Score | Reason |
| :--- | :--- | :--- |
| **Technical SEO** | **3/10** | CSR-only architecture. Meta tags are injected too late. Sitemaps exist but bots might see empty pages. |
| **Performance** | **5/10** | Heavy inline styles (re-render costs), waterfall fetching logic in Context, potential CLS from skeletons. |
| **JavaScript & Rendering** | **4/10** | Entire site dies without JS. Initial HTML is empty. Heavy reliance on client-side logic for basic content. |
| **Indexability** | **4/10** | Google might index the "Skeleton" state. History shows you are fighting "Crawled - currently not indexed". |
| **Error Handling** | **6/10** | Good `ErrorBoundary` usage. API failures handled gracefully (UI doesn't crash), but "Movie Not Found" UX is basic. |
| **Mobile Experience** | **7/10** | Mobile-specific layouts exist (`mobile-tags-section`), but inline styles make responsive design hard to maintain. |
| **Accessibility (WCAG)** | **5/10** | Low contrast text colors (`#888` on `#141414`). Missing `alt` attributes on some dynamic images. |
| **Security** | **2/10** | **CRITICAL:** `vite.config.ts` has a middleware that writes to the filesystem (`fs.writeFileSync`). If this `api-server` runs in prod, it's an RCE risk. |
| **UX & Content** | **8/10** | Visually distinct and rich. The "Why Watch" and "Gallery" features are excellent features. |

---

## 3. Critical Issues (Must Fix Immediately)

### 🚨 1. RCE Risk in `vite.config.ts` (Security - Critical)
*   **Cause**: The custom `api-server` plugin in `vite.config.ts` allows a `POST /api/save-movies` request to write arbitrary JSON to `src/data/manualMovies.ts`.
*   **Risk**: If this Vite server runs in production (or if the port is exposed during dev), an attacker can overwrite your source code.
*   **Fix**: Remove this middleware immediately from `vite.config.ts` or wrap it strictly continuously in `if (process.env.NODE_ENV === 'development')`. Ideally, move this logic to a secured Admin API, not the frontend build server.

### 🚨 2. No Server-Side Rendering (SEO - Critical)
*   **Cause**: You are using Vite (SPA/CSR). `dist/index.html` has generic meta tags. The actual movie title/description is injected by React *after* JS downloads and executes.
*   **Risk**: Bots (Facebook, WhatsApp, Twitter, and sometimes Google) check the initial HTML. They see "Filmospere - Discover Movies" for *every* page.
*   **Fix**: **Migrate to Next.js or Remix**. There is no other reliable way to get 10/10 SEO.
    *   *Band-aid Fix*: Use "Prerendering" (e.g., `vite-plugin-ssr` or a service like Prerender.io), but this is adding complexity to a sinking ship.

### 🚨 3. Inline Styles Everywhere (Performance/Maintainability - High)
*   **Cause**: `MoviePage.tsx` uses `style={{...}}` heavily.
*   **Risk**:
    *   **Performance**: React has to re-calculate these objects on every render/scroll.
    *   **Bundle Size**: Styles aren't compressed or reused (unlike CSS classes).
*   **Fix**: Move styles to `index.css` (using Tailwind or custom classes).

---

## 4. Performance Deep Dive

*   **Image Optimization**: Your `getOptimizedImageUrl` uses `wsrv.nl` (good for hobby, unreliable for scale) or TMDB.
    *   **Risk**: In `MovieHero.tsx`, you load *all* backdrop images at once and just fade them in/out (`images.map(...)`). This consumes huge bandwidth for images the user might never see.
    *   **Fix**: Lazy load images that are not currently index 0.
*   **Waterfall Fetching**: `MovieContext.tsx`
    *   It fetches `slugMap`, then checks cache, then fetches `p1, p2, p3` (Supabase). This is a waterfall. The user waits longer than necessary.
    *   The "Backup JSON" logic (`fetchLocalMovies`) downloads multi-megabyte JSON files if Supabase fails. This will kill mobile data plans.

---

## 5. JavaScript & Framework Risks

*   **Reliance on Context**: `MoviePage.tsx` relies on `useMovies`. If you land directly on `/movie/xyz`, the Context tries to "upgrade" partial data.
    *   **Race Condition**: There is logic to prevent infinite loops (`fetchError` state), but the complexity ("upgrade partial data") is a source of bugs.
*   **Code Bloat**: `MoviePage.tsx` is **1500 lines**. It handles UI, detailed SEO logic, data fetching, gallery logic, and event listeners. This is unmaintainable.

---

## 6. SEO & Indexing Risks

*   **The "Hack"**: You are using `document.createElement('meta')` inside a `useEffect` in `MoviePage`.
    *   **Why it's bad**: React Helmet is supposed to handle this. If you need manual DOM manipulation, it means Helmet isn't working correctly or you don't trust it. It creates race conditions between Helmet removing tags and you adding them.
*   **Canonical Tags**: You are settings `rel="canonical"` to `window.location.href`.
    *   **Risk**: If URL is `filmospere.com/movie/123?source=facebook`, the canonical becomes that. It *should* be the clean URL `filmospere.com/movie/123`.

---

## 7. Reliability & Failure Scenarios

*   **API Down**: If Supabase is unreachable, you fall back to `fetchLocalMovies`.
    *   **Scenario**: User is on 3G. Supabase times out. You try to download a 5MB `movies.json` backup file. Browser crashes or user leaves.
*   **Experimental Features**: Logic like `if (movie.title === 'Money Heist')` is hardcoded. If you change the title in DB, this breaks. This is "Spaghetti Code".

---

## 8. Security & Trust

*   **.env Usage**: `import.meta.env.VITE_SUPABASE_ANON_KEY`. This is standard and safe-ish (Anon keys are public), BUT you must ensure Row Level Security (RLS) is enabled on Supabase. I cannot check your DB, but if RLS is off, anyone can `DELETE FROM movies` using that key.
*   **Write Access**: The `save-movies` endpoint in `vite.config.ts` is the biggest hole.

---

## 9. What Google Might Dislike (Algorithm Risks)

*   **Soft 404s (The "200 OK" Trap)**:
    *   **Risk**: When a movie isn't found, you render a "Movie not found" UI (`MoviePage.tsx`), but the status code is likely still `200` (because it's an SPA).
    *   **Result**: Google crawls thousands of invalid URLs, sees "Movie not found", but thinks they are valid pages because of the 200 code. This burns your "Crawl Budget" and makes your site look low quality.
*   **Content "Cloaking" (Unintentional)**:
    *   **Risk**: Your initial HTML (what the bot sees first) says "Filmospere - Discover Movies". Then JS kicks in and changes the Title to "Breaking Bad".
    *   **Result**: If Google catches this discrepancy frequently, it might treat it as deceptive cloaking (showing bots one thing and users another), leading to a penalty.
*   **Hidden Links / Images**:
    *   **Risk**: `MovieHero` renders multiple high-res backdrop images with `opacity: 0`. Googlebot parses these. It might think you are "stuffing" images that users don't see immediately.
*   **Thin Content**:
    *   **Risk**: If `ArticleService` returns generated or scraped content that adds no unique value, or if "Related Articles" links to empty placeholders, the "Helpful Content Update" will downrank you.

---

## 10. Improvement Roadmap

### Day 1 (Urgent)
1.  **Delete `api-server`** from `vite.config.ts`.
2.  **Fix Canonical URL**: Set it to the clean slug/ID, not `window.location.href`.

### Week 1 (Important)
1.  **Migrate CSS**: Extract inline styles from `MoviePage` to `MoviePage.css` or Tailwind classes.
2.  **Image Loading**: Fix `MovieHero` to only render the *current* and *next* image, not all of them.

### Month 1 (Scaling)
1.  **Switch to Next.js**: This is the only way to get a 10/10 Score.
    *   Use `getServerSideProps` or `generateStaticParams` for SEO.
    *   Remove `react-helmet-async` and manual DOM hacks.
    *   Remove `MovieContext` complexities (let the server fetch data).
