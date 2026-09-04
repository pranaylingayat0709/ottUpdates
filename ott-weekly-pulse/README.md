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
3. Caches the underlying API responses via Next.js's `fetch(..., { next: { revalidate } })` — Vercel's persistent Data Cache. **Watchmode refreshes every 12 hours by default, TMDB every 6** (see "Refresh timing & API quota" below for why these differ and how to tune them).
4. Silently falls back to the next source in the priority list (Watchmode → TMDB → mock) if unreachable or returns nothing.

### Refresh timing & API quota — read this if you're on Watchmode

Watchmode's free tier caps at **2,500 requests/month**. Each full catalog refresh costs roughly `1 + candidates×2` requests (one list call, then a sources + details lookup per candidate title). With the defaults (18 candidates, 12-hour refresh):

```
(1 + 18×2) calls × 2 refreshes/day × 30 days ≈ 2,220 requests/month
```

— safely under budget with some margin. An earlier version of this project used 60 candidates on a 6-hour refresh, which worked out to **~14,500 requests/month — nearly 6x over the free quota.** That wouldn't have crashed anything (the app catches API failures and falls back to the curated snapshot gracefully), but it could have silently exhausted the month's quota partway through, reverting to non-live data without any visible warning.

**Practical effect on freshness:** a newly-released title typically appears within the refresh window (~12 hours for Watchmode, ~6 for TMDB), not instantly. Both knobs are configurable via env vars if you want to trade quota headroom for fresher data:

```
WATCHMODE_REVALIDATE_SECONDS=43200   # default 12h
WATCHMODE_CANDIDATE_LIMIT=18         # default 18
TMDB_REVALIDATE_SECONDS=21600        # default 6h
TMDB_CANDIDATE_LIMIT=40              # default 40
```

Note that the app's own internal cache (`LIVE_CACHE_TTL_MS` in `data-source.ts`, 10 minutes) is a *separate, smaller* layer that only affects how fast admin-panel overrides and community-rating changes become visible — it does not control how often new titles get discovered; that's governed entirely by the revalidate windows above.

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

## View, display & discovery features

- **My Platforms** (`src/hooks/useMyPlatformsStore.ts`) — multi-select which OTT subscriptions you actually have (header button, also gently prompted once on first visit). Turn on "My Platforms Only" in the display toolbar to filter the whole catalog down to what you can actually watch.
- **Grid ↔ List view toggle** and **sort control** (newest/rating/popular/A–Z) in the display toolbar above the catalog.
- **Mobile bottom navigation bar** (Home/Compare/Watchlist) and a **back-to-top** button once you've scrolled past the hero.
- **Swipe between weeks** on mobile (or click-drag on desktop) as an alternative to tapping the week-selector chips.
- **Hover quick-preview** on title cards (desktop only — pure CSS `max-height` transition, no scroll-observer involved, so it can't get stuck the way `whileInView` once did).
- **Genre and person pages** (`/genre/[genre]`, `/person/[name]`) — click any genre chip or cast/director name in the detail view to browse everything tagged with it, aggregated across every currently-tracked week rather than just the current one.

## SEO

- The homepage is a Server Component that fetches the current week's real catalog and embeds it in the initial HTML (with `revalidate = 600` so it refreshes every ~10 minutes rather than freezing at build-time data) — search engines see actual title listings, not an empty client-side shell.
- JSON-LD structured data (`ItemList`) on the homepage.
- Auto-generated `sitemap.xml` and `robots.txt`, covering every title across every tracked week.
- Dynamic Open Graph images per title (`/title/[id]/opengraph-image`) — sharing a title link on WhatsApp/X/Facebook shows real poster art and details instead of a generic site-wide card.

## Admin curation panel

A password-protected page at `/admin` — not a general CMS, just a narrow set of fixes so you don't need a code deploy every time live data has an issue:
- Hide a bad/wrong entry from the current week's catalog
- Override a poster URL directly
- (Storage supports manually pinning a custom title too, via the same `AdminOverrides` shape used for hidden/poster overrides)

**To turn this on:** set `ADMIN_PASSWORD` to any password in your environment variables. Leave it blank and `/admin` shows a "not configured" message instead of a login form — it doesn't silently accept an empty password. Session is a signed cookie (HMAC of the password, not the password itself), valid 7 days. Changes take effect immediately for all visitors, no deploy needed.

## API hardening

Public POST endpoints (reviews, newsletter signup, watchlist sync, push subscribe, admin login) are now rate-limited per IP (`src/lib/rate-limit.ts`) — e.g. 5 reviews/minute, 5 admin login attempts per 5 minutes. Uses Vercel KV if configured for cross-instance consistency, otherwise in-memory (rate-limits per serverless instance only — better than nothing, same honest limitation as other optional-KV stores here). Reviews also get a basic spam/profanity pattern check before being accepted.

## Recommendations, editorial depth & community signals

- **Top 10 charts** (`/top-10`) — a Netflix-style numbered chart, overall plus per-language cuts (Hindi/Marathi/English) so regional charts get their own spotlight instead of being buried under whatever's globally most popular. Ranked by a popularity score blending community rating and vote volume.
- **More Like This** — every title detail page now has a per-title "More Like This" row (genre + cast overlap against the current week's catalog), distinct from the homepage's watchlist-driven Recommended For You.
- **Mark as Watched** (`src/hooks/useWatchedStore.ts`) — a real personal viewing diary, separate from the watchlist ("want to watch" vs. "watched"). This closes an honesty gap from earlier: `/wrapped` now uses your actual Watched diary when you have entries (falling back to watchlist-based stats otherwise), with the page's own framing text changing to match which one it's showing.
- **RSS feed** (`/feed.xml`) — standard RSS 2.0 of the current week's catalog, for RSS readers or other aggregators.
- **Approximate platform pricing** (`src/lib/platform-pricing.ts`) — shown on the Compare page and in "Where to Watch." Explicitly labeled as approximate with a footnote to check the platform directly — this is a static reference table, not fetched from any live pricing source, and will go stale; update the file periodically.

- **Smarter recommendations** (`src/components/RecommendedForYou.tsx`) — builds a full taste profile from every watchlisted title (genre + cast frequency), not just the most recently saved one. Cast overlap is weighted 3x over genre overlap since sharing an actor/director is a rarer, stronger signal. Falls back to your onboarding genre picks (see below) if the watchlist is empty. Each recommendation shows a short "why" reason (e.g. "Also stars Bobby Deol, from Bandar").
- **AI Critic's Take** (`src/components/CriticsTakeCard.tsx`, `src/lib/nvidia.ts`'s `generateCriticsTake`) — a longer editorial paragraph (60-90 words: what generally works, an honest caveat, who it's worth it for), distinct from the existing 2-line Quick AI Verdict. **Explicitly labeled as AI-generated, not real critic reviews** — there's no critic-review data source integrated, and the UI is careful never to imply otherwise.
- **Taste onboarding** (`src/hooks/useTasteStore.ts`, `TasteOnboardingModal.tsx`) — a skippable first-visit prompt for favorite genres, chained right after the My Platforms prompt (platforms first, then taste, never both at once). Biases the Hero carousel ordering (editorial `heroRank` stays primary; taste only nudges ordering within that curated set) and feeds Recommended For You before any watchlist history exists.
- **Real community ratings** (`src/lib/community-ratings.ts`) — previously `communityScore`/`communityVotes` existed as fields but nothing populated them from real activity; they just sat at 0. Now every review's star rating feeds a real running average, keyed by title name (stable across the week-scoped `titleId` boundary) rather than id. Also added **review helpfulness voting** (thumbs-up per review, rate-limited, one vote per session client-side).
- **Best of the Month** (`/best-of-month`) — aggregates across every currently-tracked week (not just the current one), deduplicated by title, sorted by rating.
- **Your Watchlist Wrapped** (`/wrapped`) — a personal recap (top genre, top platform, average rating, language breakdown) built from your saved watchlist. Honestly scoped: this app has no real playback tracking (it links out to external platforms), so this is "wrapped from what you bookmarked," not a verified watch history — the page says so directly.


## Reliability hardening

A few rounds of real-world testing surfaced bugs that are now fixed, worth knowing about if you're extending this code:

- **Title cards had a full-card invisible click target bug.** The hover play-trailer button was styled `absolute inset-0` (covering the entire poster), not just the visible icon — so ANY click on a card with a trailer would play the trailer instead of opening the info view, regardless of where on the card you clicked. Fixed: the button now only covers the actual visible icon's footprint (`pointer-events-none` on the full-size wrapper, `pointer-events-auto` only on the icon itself), so clicking the card opens info and only clicking the specific play icon plays the trailer.
- **Watchmode does support trailers** — an earlier version of this README incorrectly claimed it didn't. Fixed both the code (now reads Watchmode's `trailer` field) and the documentation.
- **Every title now gets a trailer action, never a dead end** (`src/lib/youtube.ts`'s `getTrailerAction`): plays in-app if there's a confirmed YouTube link, opens externally if the link is a real URL on a different host, or offers a YouTube search for titles no data source has trailer info for yet — labeled "Search Trailer" so it's clear it's not a confirmed direct link.
- Every title card is wrapped in a React Error Boundary — a render error in one card no longer blanks the entire section.
- Poster/backdrop images have fallback URLs everywhere they're rendered.
- Avoid `framer-motion`'s `whileInView` for content that loads asynchronously via client-side fetch — mount-triggered `animate` is used instead throughout.
- Episode counts and runtimes render "unavailable"/"Series" fallback text instead of literal `null`.
- **"All titles covered":** the catalog no longer picks one live source and falls back to another only on total failure — Watchmode and TMDB (if both configured) are queried in parallel and merged, deduplicated by title. The curated snapshot in `mock-data.ts` is now always merged on top as well (not just as an emergency fallback), so a title missing from a live API for any reason still shows up if it's one that's been hand-verified. See `mergeCuratedTitles()` in `data-source.ts`.
- **"View All" instead of incremental pagination:** each catalog section shows the first 12 titles, then a single "View All (N)" button reveals everything at once — no more clicking "Load More" repeatedly.

## Other features

- **Debounced search** (`src/hooks/useDebounce.ts`) — the search box waits ~350ms after you stop typing before triggering a refetch, instead of firing on every keystroke.
- **In-app trailer player** — "Watch Trailer" no longer redirects to YouTube; it opens an embedded YouTube player right in the app (`src/components/TrailerPlayer.tsx`), reachable from the hero, the detail view, and a hover play-button on every title card. It can be minimized into a small draggable floating mini player (bottom-right corner) that keeps playing while you keep browsing — click it again to restore to the full view. Both live sources populate real trailer links: TMDB via its `/videos` endpoint, Watchmode via the `trailer` field on its title-details endpoint. If a trailer link isn't a recognized YouTube URL, the button falls back to opening it in a new tab instead of the in-app player.
- **"Notify Me" for upcoming titles** (`src/hooks/useReminderStore.ts`) — a reminder for titles in the "Coming Up" preview week. Always shows a dismissible in-app banner once the title appears in the current week's catalog. Also attempts to register a real browser push notification (see "Push notifications" below) — falls back gracefully to the in-app-only banner if push isn't supported/configured/permitted.
- **"Because you watched X" recommendations** (`src/components/RecommendedForYou.tsx`) — fully client-side genre-overlap matching against your watchlist, no ML model or server round-trip. Only considers titles from the currently-loaded week.
- **Optional Vercel KV caching** (`src/lib/kv-cache.ts`) — if `KV_REST_API_URL`/`KV_REST_API_TOKEN` are set, the live catalog cache persists in Redis across serverless cold starts instead of resetting per-instance. Completely optional — everything works identically without it, just with slightly less warm-cache benefit. Note: `@vercel/kv` currently shows a deprecation notice pointing at Upstash Redis via Vercel Marketplace integrations — check Vercel's current setup docs when you actually configure this, since the exact provisioning flow may have moved on by the time you read this.
- **Share button** — native share sheet on mobile (`navigator.share`), a small WhatsApp/X/copy-link menu on desktop. On the detail view.
- **Continue Browsing** (`src/components/ContinueWatching.tsx`) — honestly scoped: this app links out to external platforms for actual playback rather than hosting video, so there's no real resume-position to track. This surfaces your recently-viewed titles as a quick-access row instead of pretending to track literal playback progress.
- **Platform comparison** (`/compare`) — pick any two platforms and see side-by-side title counts, genre breakdowns, and full title grids for the current week.
- **PWA support** — a real `manifest.json`, generated app icons, and a service worker (`public/sw.js`) that caches the app shell for faster repeat visits and installability on phone home screens. Deliberately does NOT cache `/api/*` routes — catalog data always comes from the network.

## Push notifications (real, self-hosted — no third-party service)

Unlike a typical "we'll integrate Firebase/OneSignal later" placeholder, this is a complete, working implementation using the open **Web Push standard (VAPID)** — supported natively by every major browser, no account with any push provider needed.

**How it works:** clicking "Notify Me" on an upcoming title both (a) saves a local reminder as before, and (b) best-effort subscribes your browser to push and registers that subscription + title with the server (`src/lib/push-subscriptions.ts`). A daily Vercel Cron job (`/api/cron/check-reminders`, see `vercel.json`) checks every stored subscription's watched titles against the live current-week catalog, and sends a real push notification via `web-push` (`src/lib/push.ts`) for any match — then stops tracking that title so it doesn't notify twice.

**To turn this on:**
1. Generate a key pair once: `npx web-push generate-vapid-keys`
2. Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` (a `mailto:` address) in Vercel's environment variables
3. Set `CRON_SECRET` to any random string (Vercel sends this automatically as a Bearer token on scheduled cron runs, protecting the endpoint from being triggered by anyone who finds the URL)
4. Redeploy

**Honest limitation:** subscription storage uses the same optional-KV-or-in-memory pattern as everything else in this project — durable if you've configured Vercel KV, otherwise resets on cold start. I also could not test actual push delivery end-to-end from my development environment (no way to receive a real push notification there) — this is built correctly against the documented Web Push API, but you'll be the first real-world test of delivery.

## Weekly digest email (Resend)

A Friday-morning cron job (`/api/cron/weekly-digest`) emails the week's top 10 picks to everyone who's subscribed via the footer signup form, using [Resend](https://resend.com) (free tier: 3,000 emails/month).

**To turn this on:**
1. Sign up at resend.com, get an API key
2. Set `RESEND_API_KEY` in Vercel's environment variables (and optionally `RESEND_FROM_EMAIL` if you've verified your own sending domain — otherwise it uses Resend's shared `onboarding@resend.dev` address, fine for testing)
3. Set `CRON_SECRET` (shared with the push-notification cron above) if not already set
4. Redeploy

Subscriber emails are stored the same optional-KV-or-in-memory way as push subscriptions — same durability caveat applies. Same honest note: I couldn't verify actual email delivery from my environment; the integration is built correctly against Resend's documented API, but untested end-to-end.

**A note on Vercel Cron limits:** both cron jobs are scheduled for at most once per day (`vercel.json`), which should work on Vercel's free Hobby tier — Hobby plans generally restrict cron jobs to a daily cadence. If you're on Pro and want the reminder check to run more often than once a day, you can tighten the schedule in `vercel.json`.

## Known limitations to keep in mind

- **Poster art:** most titles in `mock-data.ts` now use real TMDB poster images (`image.tmdb.org` URLs, verified during research), not AI-generated or placeholder photos. A handful of English-language titles (Dark Matter, Michael, The Whisper Man, Adults) and the Marathi title (Aata Hou De Dhingana) don't have a verified TMDB image path captured yet, so those specific five still fall back to placeholder art — wire up a live TMDB or Watchmode key to get real posters automatically for every title, including these.

- All sample titles, cast, and ratings in `mock-data.ts` are real (sourced from trade-press coverage as of when this was written) but will go stale — a title that was "new this week" when written won't be by the time you read this. Wire up Watchmode or TMDB for auto-refreshing live data (see above) rather than relying on the static file long-term.
- Poster/backdrop images in mock/fallback mode use placeholder URLs (`picsum.photos`) — live mode uses real TMDB poster art automatically once a TMDB key is configured.
