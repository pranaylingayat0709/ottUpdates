# OTT Weekly Pulse

Curated weekly movie & web series recommendations across Indian OTT platforms — Netflix, Prime Video, Disney+ Hotstar, JioCinema, SonyLIV, ZEE5, Apple TV+ and more. Release weeks run strictly **Friday → next Thursday**, covering English, Hindi, and Marathi (including Hindi-dubbed titles).

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI primitives (shadcn-style), Lucide Icons, Embla Carousel
- **State/Data:** TanStack Query (server data), Zustand (watchlist, persisted to localStorage)
- **Backend:** Next.js Route Handlers (`src/app/api/**`)
- **Database:** PostgreSQL via Prisma (`prisma/schema.prisma`) — designed for Supabase, but works with any Postgres instance
- **AI:** NVIDIA NIM (OpenAI-compatible `/v1/chat/completions`) for the "Quick AI Verdict" feature — same integration pattern as SatiCast / SanghaStatus

## Two ways to run this

### 1. Instant demo mode (no database needed)

The app ships with an in-memory data source (`src/lib/data-source.ts`) built from `src/data/mock-data.ts`, so it runs fully out of the box:

```bash
npm install
npm run dev
```

Open http://localhost:3000. Weeks, filters, the release calendar, watchlist, and reviews all work — reviews/watchlist just live in server memory and reset on restart.

### 2. Full persistence with Postgres/Supabase

```bash
cp .env.example .env
# fill in DATABASE_URL / DIRECT_URL from your Supabase project (or any Postgres)

npm install
npm run db:push     # create tables from prisma/schema.prisma
npm run db:seed     # seed 2 past weeks + current week + next week's preview
npm run dev
```

To wire the app to Postgres instead of the in-memory store, swap the function bodies in `src/lib/data-source.ts` for `prisma.title.findMany(...)` / `prisma.week.findMany(...)` calls — the returned shapes already match the Prisma models field-for-field, so this is a drop-in change. `src/lib/db.ts` already exports a ready-to-use Prisma client singleton.

## Environment variables

See `.env.example`. Key ones:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Postgres connection (Supabase pooled + direct URLs) |
| `NVIDIA_API_KEY` | NVIDIA NIM API key — powers the "Quick AI Verdict" (falls back to a heuristic summary if unset, so the UI never breaks) |
| `NVIDIA_NIM_BASE_URL` | Defaults to `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_NIM_MODEL` | Defaults to `meta/llama-3.1-70b-instruct` |
| `TMDB_API_KEY` | Optional — wire into `src/lib/data-source.ts` to pull real weekly releases instead of mock data |

## Project structure

```
prisma/
  schema.prisma          # Week, Title, Review, WatchlistItem models
  seed.ts                 # seeds current + adjacent weeks from mock-data.ts
src/
  app/
    page.tsx               # dashboard: hero, filters, calendar
    title/[id]/page.tsx     # standalone detail page (SEO-friendly, shareable link)
    api/
      weeks/                # GET list of Fri–Thu weeks (archive + current + preview)
      titles/                # GET filtered catalog for a week
      titles/[id]/            # GET one title
      titles/[id]/reviews/    # GET/POST user reviews
      titles/resolve/         # batch-resolve ids (used by watchlist drawer)
      verdict/                # POST -> NVIDIA NIM "Quick AI Verdict"
      watchlist/               # GET/POST anonymous-token watchlist
  components/             # Hero carousel, filter bar, cards, modal, reviews, etc.
  lib/
    week.ts                 # Friday->Thursday week-cycle math
    data-source.ts          # in-memory data layer (swap for Prisma in prod)
    nvidia.ts                # NVIDIA NIM client + heuristic fallback
    db.ts                    # Prisma client singleton
  data/mock-data.ts        # realistic fictional sample catalog (EN/HI/MR)
```

## Automatic weekly updates (live data)

The app supports three data modes, controlled by environment variables, tried in this order:

**1. Watchmode (`WATCHMODE_API_KEY`) — recommended:** [Watchmode](https://api.watchmode.com/) is a dedicated streaming-availability API — its entire purpose is "which platform carries which title, in which country." Free tier: 2,500 requests/month, no credit card, and (unlike TMDB) no reports of being blocked in India. Sign up at https://api.watchmode.com/requestApiKey, copy the key, set `WATCHMODE_API_KEY` in Vercel's Environment Variables, redeploy.

**2. TMDB (`TMDB_API_KEY`) — fallback live option:** kept as a second live source in case Watchmode's free tier runs thin, or you'd rather use TMDB's richer metadata (it has proper cast/director data that Watchmode's free tier doesn't expose). ⚠️ **Known issue for India-based developers:** TMDB has been intermittently blocked by several Indian ISPs (Jio, sometimes Airtel) for years due to an old court order — you may not be able to reach themoviedb.org to even sign up without a VPN or switching DNS to Cloudflare (1.1.1.1). This doesn't affect the *deployed app* (Vercel's servers aren't in India), only your ability to create the account.

**3. Mock data (no key set):** falls back to the manually-curated snapshot in `src/data/mock-data.ts` — static until someone edits that file.

Either live source works the same way once configured:
1. Queries for whatever is currently popular and actively streaming on a subscription platform in India.
2. Maps results into Netflix/Prime Video/JioHotstar/SonyLIV/ZEE5/Apple TV+/etc.
3. Caches via Next.js's `fetch(..., { next: { revalidate: 21600 } })` — Vercel's persistent Data Cache — refreshing roughly every 6 hours.
4. Silently falls back to the next source in the priority list (Watchmode → TMDB → mock) if unreachable or returns nothing.

**Known limitation shared by both live sources:** neither exposes an exact "digital premiere date per platform" — that precision is JustWatch's specialty, and JustWatch's public API requires a partner agreement this project doesn't have. So the live feed shows "currently popular + actively streaming + released in the last ~3 weeks" rather than a strict Friday-cutoff — in practice this converges on the same weekly slate, but a handful of results may be a week or two older than a strict cutoff would show. Cast/director/dub-language precision also varies by source (Watchmode's free tier omits cast/crew entirely; TMDB includes it). If you later get JustWatch partner API access, swap in a JustWatch-backed fetcher for exact per-platform premiere dates.

## Hindi/Marathi-first content weighting

The app is built to surface Hindi and Marathi content prominently rather than defaulting to whatever is globally popular (which skews Hollywood):

- **Live mode:** `tmdb.ts` runs separate `with_original_language=hi` and `with_original_language=mr` discover queries alongside a general query, merging results so regional titles aren't drowned out by global vote counts.
- **Hard guarantee, not just a hope:** `data-source.ts`'s `prioritizeIndianLanguages()` doesn't just reorder — if the live source comes back with too few (or zero) Hindi/Marathi titles, it blends in real, curated titles from `mock-data.ts` to make up the gap. This means the "majorly Hindi and Marathi" requirement holds unconditionally, regardless of what any particular live API happens to rank highly on a given day. The curated guarantee pool currently has 15 real Hindi/Marathi titles to draw from.
- **Important fix:** an earlier version of this function had a hardcoded `maxCount = 16` that silently truncated the *entire week's catalog* to 16 titles total — meant only as a language-balancing target, it accidentally became a hard cap on real results (e.g., showing only 5 movies when more were actually available). This has been removed: the app now shows every real title the live source returns, just reordered with Hindi/Marathi first. The underlying TMDB/Watchmode fetch limits were also raised (from ~24 to 60 raw candidates per query) so the candidate pool itself isn't artificially small.
- **Mock/fallback mode:** `src/data/mock-data.ts` is weighted ~70% Hindi/Marathi, sourced from real trade-press coverage of actual releases (see comments in the file for sourcing).

## UI: Movies vs. Web Series, theming, and motion

- **Separate sections:** the release calendar and filtered search results both render "Movies," "Web Series," and (when present) "Documentaries" as distinct titled sections rather than one mixed grid — see `CatalogSection` in `src/components/ReleaseCalendar.tsx`, reused on both the default and filtered views. Each section paginates with a "Load More" button rather than dumping everything at once.
- **Light/dark theme:** a full theme system lives in `src/components/ThemeProvider.tsx` + `ThemeToggle.tsx` (the sun/moon button in the header). Both themes are defined as CSS custom properties in `globals.css` (`:root` for light, `.dark` for dark) — glassmorphic panels, chips, and borders all reference these variables rather than hardcoded colors. An inline script in `layout.tsx` sets the correct theme class before hydration to avoid a flash of the wrong theme on load.
- **Hindi/Marathi/English UI language toggle:** a separate globe/language selector in the header (not to be confused with content language) translates the interface itself — buttons, headings, filter labels — via `src/lib/translations.ts` + `LanguageProvider.tsx`. This is genuinely a different feature from the content-language filter in the FilterBar.
- **Motion:** Framer Motion powers mount-triggered stagger animations on catalog sections, spring-physics hover/tap on title cards, a Ken Burns zoom + cross-fade on the hero carousel, and a smooth icon-swap on the theme toggle. `prefers-reduced-motion` is respected site-wide.

## Reliability hardening

A few rounds of real-world testing surfaced bugs that are now fixed, worth knowing about if you're extending this code:

- **Every title card is wrapped in a React Error Boundary** (`src/components/ErrorBoundary.tsx`) — a render error in one card (a malformed field from a live API, an unexpected null) no longer blanks the entire section, just that one card.
- **Poster/backdrop images have fallback URLs everywhere** they're rendered, so a broken image URL from a live source degrades gracefully instead of crashing.
- Avoid `framer-motion`'s `whileInView` for content that loads asynchronously via client-side fetch — it can get stuck at `opacity: 0` if the element is already inside the viewport the instant it mounts (a real bug this project hit once). Mount-triggered `animate` is used instead throughout.
- Episode counts and runtimes render "unavailable"/"Series" fallback text instead of literal `null` when a live API doesn't supply that field.

## Other features

- **Debounced search** (`src/hooks/useDebounce.ts`) — the search box waits ~350ms after you stop typing before triggering a refetch, instead of firing on every keystroke.
- **Trailer previews** — a "Watch Trailer" button appears wherever `trailerUrl` is populated (in the hero and the detail view). The TMDB live path fetches this from TMDB's `/videos` endpoint automatically; Watchmode's free tier doesn't expose trailer data, so it stays empty there.
- **"Notify Me" for upcoming titles** (`src/hooks/useReminderStore.ts`) — a local-only reminder for titles in the "Coming Up" preview week. Honest scope: there's no email/push backend, so this surfaces a dismissible in-app banner once the title appears in the current week's catalog, on the same device/browser — it does not send an actual notification.
- **"Because you watched X" recommendations** (`src/components/RecommendedForYou.tsx`) — fully client-side genre-overlap matching against your watchlist, no ML model or server round-trip. Only considers titles from the currently-loaded week.
- **Optional Vercel KV caching** (`src/lib/kv-cache.ts`) — if `KV_REST_API_URL`/`KV_REST_API_TOKEN` are set, the live catalog cache persists in Redis across serverless cold starts instead of resetting per-instance. Completely optional — everything works identically without it, just with slightly less warm-cache benefit. Note: `@vercel/kv` currently shows a deprecation notice pointing at Upstash Redis via Vercel Marketplace integrations — check Vercel's current setup docs when you actually configure this, since the exact provisioning flow may have moved on by the time you read this.

## Known limitations to keep in mind

- **Poster art:** most titles in `mock-data.ts` now use real TMDB poster images (`image.tmdb.org` URLs, verified during research), not AI-generated or placeholder photos. A handful of English-language titles (Dark Matter, Michael, The Whisper Man, Adults) and the Marathi title (Aata Hou De Dhingana) don't have a verified TMDB image path captured yet, so those specific five still fall back to placeholder art — wire up a live TMDB or Watchmode key to get real posters automatically for every title, including these.

- All sample titles, cast, and ratings in `mock-data.ts` are real (sourced from trade-press coverage as of when this was written) but will go stale — a title that was "new this week" when written won't be by the time you read this. Wire up Watchmode or TMDB for auto-refreshing live data (see above) rather than relying on the static file long-term.
- Poster/backdrop images in mock/fallback mode use placeholder URLs (`picsum.photos`) — live mode uses real TMDB poster art automatically once a TMDB key is configured.
