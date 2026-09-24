# Newbee Marketing Hub — AI Image & Video Asset Generator

> **Last Updated:** September 24, 2026
> Admin-only tool for Newbee ad creatives: one image, one video, or an image → video pipeline per run, saved to a team-shared library.
> Uses Nano Banana 2 (`gemini-3-pro-image-preview`) for stills and Veo 3.1 for video; Gemini 3 Pro writes briefs and prompt blueprints.
> GitHub: `NewbeeConnect/NewbeeMarketing` | Hosting: Vercel | Language: Turkish

## What this app does

On `/generate` the user picks an intent — **image**, **video**, or **pipeline**
(generate an image, then animate it) — and an aspect ratio. The project is fixed
to `newbee` (`lib/projects.ts` keeps the slug array so storage paths and the
`project_slug` column stay stable). Gemini 3 Pro can "roll the dice" for an
on-brand brief built from `lib/generate/brand-profiles.ts`
(`/api/generate/suggest-brief`), then turns the brief into structured prompt
fields (`/api/generate/prompt`: subject/style/composition/lighting/mood/technical
for images; subject/camera/action/lighting/mood/audio + `negativePrompt` for
video). The user edits the fields, the client assembles one prompt string
(`assembleImagePrompt` / `assembleVideoPrompt` in `hooks/useGeneration.ts`), and
generates. Images are synchronous; video is an async Veo operation polled to
completion. Every output — and every manual upload — becomes a `mkt_generations`
row plus a file in the `mkt-assets` bucket, browsable in `/library`. A finished
video can be **extended** from its last frame while Veo still holds its source
URI (~2 days).

The earlier 4-scene / 5-keyframe "continuous story" generator (`mkt_stories`,
`/api/stories/*`, FFmpeg stitching, `useStory`) has been removed from the code;
migration `015_library_pivot.sql` drops its table and columns. What is left of
it is marked **legacy** below.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| UI | React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui |
| State | TanStack React Query 5 |
| Database | Supabase (PostgreSQL + Auth + Storage), project `dwwkcfunctykemwsrkkr` |
| AI | `@google/genai` 1.42 — Gemini 3 Pro (preview), Nano Banana 2 (Gemini 3 Pro Image preview), Veo 3.1 |
| Image post-processing | `sharp` — logo compositing in `lib/image/composite.ts` |
| Legacy dep | `ffmpeg-static` — still in `package.json`, imported nowhere (served the removed stitch route) |
| Auth | Admin-only (user_roles + get_my_roles RPC pattern) |
| Hosting | Vercel |

## Critical Rules

1. **Admin-only.** `proxy.ts` (Next 16's replacement for `middleware.ts`) calls `updateSession()` in `lib/supabase/middleware.ts`, which redirects signed-out users to `/login` and signs non-admins out (`get_my_roles` RPC, result cached 10 min in the `x-mkt-role-v1` cookie); `/auth/callback` repeats the admin check. If the RPC itself errors, the proxy lets the request through (deliberate fail-open, see the code comment). Add admins via `SELECT public.grant_admin('<uuid>');` in SQL editor (service_role only).
2. **Never modify `components/ui/`** — shadcn/ui generated.
3. **GitHub identity — verify, never switch.** PRs must be authored by **NewbeeConnect**: GitHub's squash merge rewrites the commit author to the PR author, and on 2026-05-21 Newbee App PR #268 came out as `cglrbbr@gmail.com` → Vercel deploy `BLOCKED`, because the team's SAML SSO rejects caglarbiber90.
   - **Never run `gh auth switch`.** It rewrites one global gh config and flips the account under every other session. Identity is pinned per project via `GH_CONFIG_DIR`, set in the machine-local, untracked `.claude/settings.local.json`. Setup (including the Windows `%AppData%\GitHub CLI` layout) and the reasoning are in the Newbee app repo's `docs/github-identity.md`. This checkout has no `.claude/settings.local.json` yet — pin it before the first `gh` write, or prefix one-offs: `GH_CONFIG_DIR=<pinned dir> gh pr create …`.
   - **Commit author:** `git config user.email` must print `newbeeconnect@gmail.com` (it comes from the global config today). Verify only; don't add a repo-local `user.email`.
   - **Vercel deploy canary:** After a merge, if Vercel dashboard → Deployments shows the deploy as `BLOCKED`/`ERROR`, check `meta.githubCommitAuthorLogin` — if it's `caglarbiber90`, the wrong account authored the PR. Fix: open a follow-up commit from NewbeeConnect to re-trigger Vercel. A PR's author can't be changed after the fact, so catch it before merge.
4. **Always use `createServiceClient()`** for DB writes in API routes (bypasses RLS).
5. **Always check `if (!ai)`** before AI operations — client is null when GOOGLE_API_KEY missing.
6. **All tables use `mkt_` prefix** except `user_roles`.
7. **RLS enabled on all tables.** `mkt_generations` ran with RLS and zero policies until migration 015 added an owner policy (`auth.uid() = user_id`). The API routes still read and write it through the service client, because the library is team-shared: `/api/library`, the status route and DELETE deliberately skip any `user_id` filter.
8. **Cost tracking:** Every AI API call must log to `mkt_usage_logs` BEFORE returning its response (budget drift mitigation). Veo is logged by the status route when it finalizes the video, not at kick-off. Nano Banana images are logged with `api_service: "gemini"`.
9. **Veo is async:** `POST /api/generate/video` pre-inserts the row, stores `operation_name` and returns `generationId`; the client polls `GET /api/generate/video/[generationId]/status` via `useVideoStatus` (8s interval). The status route enforces a 15-min timeout and a 10-attempt download/upload retry cap (`MAX_DOWNLOAD_RETRIES`).
10. **Gemini JSON parsing:** there is no shared `parseAiJson()` helper. `/api/generate/prompt` requests `responseMimeType: "application/json"`, strips code fences inline, then validates with a Zod schema and returns 502 on malformed output. (The `rules` list in `.claude/settings.json` still names `parseAiJson()`.)
11. **Veo input modes are mutually exclusive** (Zod `refine` in the video route): at most one of `firstFrameUrl` (image-to-video — the pipeline hands over its stage-2 image), `referenceImages` (≤3 `ASSET` references), or `sourceGenerationId` (extend from the source video's `output_metadata.veo_video_uri`). No `lastFrame` interpolation is used.
12. **Canonical storage layout:** `buildFilename()` + `buildStoragePath()` in `lib/filename.ts` → `mkt-assets/{project}/{image|video}/{ratio, ":"→"-"}/{ISO-timestamp}_{prompt-slug}_{6-hex}.{png|mp4}`. The DELETE and status routes re-derive paths from `project_slug`/`type`/`ratio`/`filename`, so don't change the layout without migrating the stored objects.

## Data Model

- **`user_roles`** — admin gating; `get_my_roles()` RPC called from `updateSession()` (via `proxy.ts`) and `/auth/callback`.
- **`mkt_generations`** — one row per library asset (AI output or upload). Key columns: `type` (`image`|`video`), `project_slug` (`newbee`), `ratio`, `filename`, `prompt`, `model` (`"user-upload"` marks manual uploads — the Library's Generated/Source split), `status` (`pending`→`processing`→`completed`|`failed`), `output_url`, `operation_name` (Veo), `config` (video: `duration_seconds`, `storage_path`), `output_metadata` (`file_size_mb`, `veo_video_uri` for extension), `retry_count`, cost columns, `user_id`.
- **`mkt_usage_logs`** — per-call cost tracking. Budget guard queries this for monthly total ($500/user cap).
- **`mkt_rate_limits`** — DB-backed token bucket via the `mkt_check_rate_limit` RPC. Live categories: `ai-gemini`, `ai-media`, `api-general`; the `social-*` and `autopilot` presets in `lib/rate-limit.ts` are legacy.
- **`mkt_api_keys`** — the Settings page reads/writes Google Ads, Meta Ads and GitHub keys here from the browser client (own-row RLS). Nothing server-side consumes them, and they are stored as plain JSON despite the column name `keys_encrypted` (`lib/encryption.ts` exists but is imported nowhere).
- **`mkt_notifications`** — legacy: only `hooks/useNotifications.ts` → `NotificationBell` → `AppHeader` touch it, and `AppHeader` is rendered nowhere.
- **`mkt_stories`** — **legacy**: created by migration 012 for the removed story generator and dropped by migration 015 (together with `mkt_generations.story_id/story_role/sequence_index` and the `uniq_mkt_gen_story_role_seq` index that depended on them). No code references it. The `mkt_generations.type` CHECK still allows the legacy values `voiceover` and `stitched` (last rewritten in migration 012); the app only writes `image` and `video`.

Storage paths on `mkt-assets` bucket (public URLs, see rule 12):
- Images: `{project}/image/{4-5|9-16|1-1|16-9}/{filename}.png`
- Videos: `{project}/video/{9-16|16-9}/{filename}.mp4`
- Uploads use the same layout (`/api/library/upload`, max 15 MB image / 200 MB video).

## API Surface

AI routes: auth → `if (!ai)` → rate-limit → budget → validate → process → log → respond (the video route validates before the budget check, because the cost depends on `durationSeconds`). Library and analytics routes: auth → service client, with no rate limit or budget.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/generate/prompt` | Gemini 3 Pro: brief → structured prompt fields for image or video; partial regenerate via `existingFields` + `regenerateFields` |
| POST | `/api/generate/suggest-brief` | Gemini 3 Pro: one on-brand ad brief from the brand profile (`avoidHighlight` for variety, `extendFromBrief` for a video extension) |
| POST | `/api/generate/image` | Nano Banana 2 still (2K), ≤3 reference images + ≤3 locked assets; logos composited bottom-right with `sharp`; synchronous |
| POST | `/api/generate/video` | Veo 3.1 kick-off (1080p, native audio, 4/6/8 s, baseline `negativePrompt`); one input mode per rule 11 |
| GET  | `/api/generate/video/[generationId]/status` | Poll Veo operation; on success download the mp4, upload to storage, log cost, keep `veo_video_uri` |
| GET  | `/api/library` | List up to 500 team-wide generations, newest first; optional `project` / `type` / `ratio` filters (search is client-side) |
| POST | `/api/library/upload` | Multipart upload of a user's own image or video into the library layout |
| DELETE | `/api/library/[generationId]` | Delete the storage object and the row (any admin, permanent) |
| GET  | `/api/analytics` | Team-wide 12-month rollup: total spend, spend by service, monthly spend, generation counts |
| GET  | `/auth/callback` | OAuth code exchange + admin check |
| GET  | `/download` | Smart device-aware redirect (iOS → App Store, Android → Play Store, Desktop → web app); target of `download.newbeeapp.com` (rewritten in `proxy.ts`) |

## UI Surface (4 pages)

- **`/generate`** — Intent-first timeline (`lib/generate/machine.ts` + `timeline.ts`): Goal (intent + ratio) → Brief & blueprint (suggest brief, edit fields, reference images, locked assets) → Prompt (assembled, editable) → Image and/or Video (generate, upload, or pick an image from the library) → Done (create a variant, or extend the video). Pipeline adds a "Continue?" gate between image and video.
- **`/library`** — Image / Video folders with Generated / Source / All tabs, client-side search, preview, download, delete.
- **`/analytics`** — Spend gauge against the $25,000 credit (`TOTAL_CREDIT_USD` in `lib/constants.ts`), stat cards, monthly trend, spend by service.
- **`/settings`** — Account status, change password, and the Google Ads / Meta Ads / GitHub key forms backed by `mkt_api_keys` (see Data Model).

`/` redirects to `/generate`. Public routes: `/login`, `/auth/callback`, `/download`.

## Cost Model

*Rates are the estimates in `COST_ESTIMATES` (`lib/google-ai.ts`) — verify against [Google AI Studio pricing](https://ai.google.dev/pricing) before billing decisions; Google's rates have changed more than once in 2026.*

There is no model-tier toggle; every call uses the models below.

- **Image:** ~$0.04 flat per Nano Banana 2 image.
- **Video:** duration × $0.40/s → $1.60 (4 s), $2.40 (6 s), $3.20 (8 s, default).
- **Pipeline (image → 8 s video):** ~$3.24.
- **Gemini text** (brief suggestion, prompt blueprint): estimated from prompt length at $1.25 / $10 per 1M input/output tokens — well under $0.01 per call.

Budget cap: $500/user/month (enforced in `lib/budget-guard.ts`, which sums the caller's `mkt_usage_logs` rows for the current month and fails closed on a query error).

## AI Models

| Model ID | Use | Cost |
|----------|-----|------|
| `gemini-3-pro-preview` (`MODELS.GEMINI_PRO`) | Brief suggestion, prompt blueprint | $1.25/$10 per 1M tokens (estimate) |
| `gemini-3-pro-image-preview` (`MODELS.IMAGE`, "Nano Banana 2") | Still images | $0.04/image (estimate) |
| `veo-3.1-generate-001` (`MODELS.VEO`) | Video | $0.40/sec |

When `VEO_ENVIRONMENT !== "production"` the video model is `veo-3.1-generate-preview` and the `ai-media` rate limit drops from 50 to 10 requests/min. Legacy: `/api/analytics` and `useAnalytics` still carry `imagen` and `tts` buckets in `costByService`; nothing logs to them any more.

## Key Conventions

- **Supabase clients:** `createClient()` (browser), `createSupabaseServer()` (server component), `createServiceClient()` (API route, bypasses RLS). `createNewbeeClient()` (read-only Newbee DB) is legacy — defined, never called.
- **Hook pattern:** React Query for all data fetching (`hooks/useGeneration.ts`, `useLibrary.ts`, `useAnalytics.ts`); generate, upload and delete mutations invalidate `["library"]`.
- **Polling:** `useVideoStatus(generationId)` polls the status route every 8s until `completed`/`failed`; `useLibrary` refetches every 8s while any row is `pending`/`processing`.
- **Rate-limit helper:** `rateLimitResponse()` returns 429 with `Retry-After` header.
- **Storage URLs:** public URLs from Supabase storage (no signed-URL expiry).

## Build & Deploy

```bash
npm run dev        # Dev server on :3000
npm run build      # Production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

Vercel auto-deploys from `main`. GitHub Actions CI (`.github/workflows/ci.yml`) runs lint + typecheck + build on PRs to `main` and pushes to `main`.

Env vars read by live code: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_API_KEY`; optional `VEO_ENVIRONMENT` (`production` switches to the GA Veo model and the higher media rate limit). Legacy — still in `.env.example` and/or the CI placeholders but read only by unused modules or not at all: `CRON_SECRET` (`lib/cron-auth.ts`, imported nowhere), `NEWBEE_SUPABASE_URL` / `NEWBEE_SUPABASE_ANON_KEY` (`createNewbeeClient`, never called), `NEXT_PUBLIC_APP_URL`, `GOOGLE_CLOUD_PROJECT`.

## Gotchas

- **Local build needs `.env.local`** — Supabase URL required at parse time.
- **Legacy FFmpeg tracing** — `next.config.ts` `outputFileTracingIncludes` still maps `/api/stories/[storyId]/stitch` → `./node_modules/ffmpeg-static/ffmpeg`. That route (and `lib/video/stitch.ts`) no longer exists, so the entry is dead config and `ffmpeg-static` an unused dependency; remove both together if cleaning up.
- **Logos drift in video** — the image route composites user logos pixel-perfect with `sharp`, but Veo re-renders every frame, so brand text inside a logo can drift during a clip. The prompt-level lock text is the only guard; an FFmpeg overlay pass on the finished clip is an unbuilt follow-up (comment in `app/api/generate/video/route.ts`).
- **Image/video input requires `personGeneration: "allow_adult"`** — the video route sets it whenever a first frame, references or a source video is passed, and `"allow_all"` only for pure text-to-video.
- **Veo URI retention:** ~2 days. A status poll after expiry fails the download (retry cap 10), and extending a video needs `output_metadata.veo_video_uri` inside that window — otherwise the video route returns 410.
- **Stale `/dashboard` redirect** — `updateSession()` sends a signed-in admin who opens `/login` to `/dashboard`, and `/auth/callback` falls back to `/dashboard`; no such page exists (`/` redirects to `/generate`).

## Scripts / Skills (active)

This repo has no project skills or commands — there is no `.claude/skills` or `.claude/commands` directory. `.claude/` holds only:

- `settings.json` — permissions, a `rules` list, and hooks (block edits to `components/ui/`, API-route and SQL checklists, a pre-commit lint + typecheck, post-edit `eslint --fix` + `tsc`).
- `launch.json` — `marketing-dev` preview config (`npm run dev` on :3000).

Config drift to know about: the pre-commit hook `cd`s into the old Mac path `/Volumes/SSD 2TB/APP/Newbee/NewbeeMarketing`, and the AI-file hook points at a `/monitor-budget` skill that no longer exists. Earlier skills (`/deploy`, `/perf-check`, `audit-api`, `test-api`, `new-feature`, `cost-report`, `monitor-budget`, `db-check`) are all gone.

## Memory

**Shared memory vault (read first):** `../../_Memory/Newbee/MEMORY.md`, relative to this repo — per this repo's `AGENTS.md` and the workspace `AGENTS.md` one level up (which points at `../_Memory/Newbee/MEMORY.md` from there). On Windows that resolves to `C:\Users\c.biber\Documents\APP\_Memory\Newbee\MEMORY.md`. It is an Obsidian vault shared by Claude Code, Codex and omp and synced between Windows and Mac via git. Marketing-specific notes: `marketing-hub-isolation`, `marketing-hub-supabase`. Durable learnings go there (one topic per file, one-line pointer in `MEMORY.md`), not into this file.

The repo is active on both machines:

| Machine | Repo path |
|---|---|
| Windows | `C:\Users\c.biber\Documents\APP\Newbee\MarketingNewbee` |
| Mac | `~/Developer/newbee/newbeemarketing/` |

Claude Code's per-project auto-memory lives under `~/.claude/projects/<encoded-cwd>/memory/`, keyed by the directory the session was started in: a session opened in this repo loads Marketing's own store (on Windows `C--Users-c-biber-Documents-APP-Newbee-MarketingNewbee`), one opened a level up loads the ecosystem store (`C--Users-c-biber-Documents-APP-Newbee`). The old `/Volumes/SSD 2TB/...` path is dead.

Key invariant: **Marketing repo + Supabase are fully isolated** from Admin / Expert / Newbee App (which share the Newbee Supabase `ccuiumdacqwsfhfxsjdm`). Don't suggest cross-project DB patterns. Marketing Supabase project: `dwwkcfunctykemwsrkkr` with `mkt_`-prefixed tables.
