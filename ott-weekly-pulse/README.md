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

- All sample titles, cast, and quotes in `mock-data.ts` are fictional placeholders standing in for real weekly releases.
- Poster/backdrop images use placeholder URLs (`picsum.photos`) — replace with TMDB image URLs (`image.tmdb.org`, already whitelisted in `next.config.js`) once wired to a real feed.
