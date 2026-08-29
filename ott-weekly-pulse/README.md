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

The app now supports two data modes, controlled by a single environment variable:

**Without `TMDB_API_KEY`:** uses the last manually-curated snapshot in `src/data/mock-data.ts` — static until someone edits that file.

**With `TMDB_API_KEY` set:** the app queries [TMDB](https://www.themoviedb.org/) (a free, public movie/TV database) live, every time the cache window expires — **no manual updates, no re-uploading files, no asking me to refresh it.** Specifically:

1. `src/lib/tmdb.ts` calls TMDB's `/discover/movie` and `/discover/tv` endpoints filtered to `watch_region=IN` + `with_watch_monetization_types=flatrate` (i.e., "actually streaming on a subscription platform in India right now"), sorted by popularity, biased toward the last ~3 weeks.
2. For each result, it calls TMDB's `/watch/providers` endpoint to find which of Netflix/Prime Video/JioHotstar/SonyLIV/ZEE5/Apple TV+/etc. actually carry it in India, and drops anything not on a platform this app tracks.
3. Results are cached via Next.js's `fetch(..., { next: { revalidate: 21600 } })` — Vercel's persistent Data Cache — so the catalog refreshes itself roughly every 6 hours without hitting TMDB on every page load.
4. If TMDB is unreachable or returns nothing, the app **silently falls back** to the mock catalog rather than showing an error.

**To turn this on:**
1. Get a free TMDB API key: https://www.themoviedb.org/settings/api (instant approval, no waiting).
2. Add `TMDB_API_KEY=<your key>` to Vercel's Environment Variables (or your local `.env`).
3. Redeploy. That's it — the dashboard now reflects whatever's actually popular and streaming in India, and keeps itself current automatically.

**Known limitation (be aware of this):** TMDB doesn't expose an exact "digital premiere date per platform" — that level of precision is JustWatch's specialty, and JustWatch's public API requires a partner agreement Anthropic/this project doesn't have. So instead of a strict "released exactly this Friday" filter, the live feed shows "currently popular + actively streaming + released in the last ~3 weeks" — in practice this converges on the same weekly slate, but a handful of results may be a week or two older than a strict Friday-to-Thursday cutoff would show. `isHindiDubbed` and per-title cast/rating precision are also approximated from what TMDB exposes (no IMDb/Rotten Tomatoes scores — the UI shows TMDB's own vote average as the "internal critic rating" instead, and marks review counts as "New" until real users vote). If you later get JustWatch partner API access, swap `fetchLiveTitlesForWeek()` in `tmdb.ts` for a JustWatch-backed version for exact per-platform premiere dates.



## Notes

- All sample titles, cast, and quotes in `mock-data.ts` are fictional placeholders standing in for real weekly releases.
- Poster/backdrop images use placeholder URLs (`picsum.photos`) — replace with TMDB image URLs (`image.tmdb.org`, already whitelisted in `next.config.js`) once wired to a real feed.
