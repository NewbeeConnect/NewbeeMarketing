# Newbee Marketing Hub — Continuous Story Video Generator

> **Last Updated:** April 19, 2026
> Single-feature admin tool: 4-scene / 5-keyframe continuous story video generator.
> Uses Imagen 4 for keyframes and Veo 3.1 with `lastFrame` interpolation for seamless cuts.
> GitHub: `NewbeeConnect/NewbeeMarketing` | Hosting: Vercel | Language: Turkish

## What this app does

User writes a story topic → Gemini 2.5 Flash produces 4 scene scripts + 5 frame
prompts + a shared `style_anchor`. Imagen generates the 5 keyframes. Veo 3.1
generates 4 clips, each with its first and last frames fixed to the adjacent
keyframes (frame_N = clip_N first frame, frame_N+1 = clip_N last frame), so cuts
are visually seamless. Optional final step: FFmpeg concat into a single mp4.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| UI | React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui |
| State | TanStack React Query 5 |
| Database | Supabase (PostgreSQL + Auth + Storage), project `dwwkcfunctykemwsrkkr` |
| AI | `@google/genai` 1.42 — Gemini 2.5 Flash, Imagen 4, Veo 3.1 |
| Video | `ffmpeg-static` (concat demuxer, Node runtime) |
| Auth | Admin-only (user_roles + get_my_roles RPC pattern) |
| Hosting | Vercel |

## Critical Rules

1. **Admin-only.** Non-admins signed out at middleware + auth callback. Add admins via `SELECT public.grant_admin('<uuid>');` in SQL editor (service_role only).
2. **Never modify `components/ui/`** — shadcn/ui generated.
3. **Git commits:** Always use `newbeeconnect@gmail.com` — `git config user.email` before first commit.
4. **Always use `createServiceClient()`** for DB writes in API routes (bypasses RLS).
5. **Always check `if (!ai)`** before AI operations — client is null when GOOGLE_API_KEY missing.
6. **All tables use `mkt_` prefix** except `user_roles`.
7. **RLS enforced on all tables.** `mkt_generations` has RLS enabled with zero policies → service-role-only access.
8. **Cost tracking:** Every AI API call must log to `mkt_usage_logs` BEFORE returning response (budget drift mitigation).
9. **Veo is async:** returns `operation_name`; client polls `/clips/[index]/status` (8s interval, 15-min timeout, 5-attempt download cap).
10. **`parseAiJson()`** always parses Gemini responses (strips fences, bracket-scans).
11. **Veo 3.1 keyframe interpolation:** first frame via `image: { imageBytes }`, last frame via `config.lastFrame: { imageBytes }`. Both base64 PNGs.
12. **Upsert on frame/clip regenerate:** unique index `uniq_mkt_gen_story_role_seq` on `(story_id, story_role, sequence_index)` enables race-free replacement.

## Data Model

- **`user_roles`** — admin gating; `get_my_roles()` RPC called from middleware.
- **`mkt_stories`** — one row per story; stores topic, aspect_ratio, duration, model_tier, style_anchor, scene_scripts (JSONB `{1..4}`), frame_prompts (JSONB `{1..5}`), status, stitched_generation_id.
- **`mkt_generations`** — rows for frames (`story_role='frame'`, `sequence_index 1..5`, `type='image'`), clips (`story_role='clip'`, `sequence_index 1..4`, `type='video'`), stitched final (`story_role='stitched'`, `sequence_index=0`, `type='stitched'`).
- **`mkt_usage_logs`** — per-call cost tracking. Budget guard queries this for monthly total ($500/user cap).
- **`mkt_rate_limits`** — DB-backed token bucket, categories: `ai-gemini`, `ai-media`, `api-general`, etc.
- **`mkt_api_keys`** — Settings page persists integration keys (currently unused now that projects/campaigns are gone; retained for future).
- **`mkt_notifications`** — ambient notification bell (kept, mostly unused post-cleanup).

Storage paths on `mkt-assets` bucket:
- Frames: `{user_id}/stories/{story_id}/frames/{1..5}.png`
- Clips: `{user_id}/stories/{story_id}/clips/{1..4}.mp4`
- Stitched: `{user_id}/stories/{story_id}/stitched.mp4`

## API Surface (6 routes)

All routes: auth → rate-limit → budget → validate → process → log → respond.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/stories` | Gemini script + initial story row |
| GET  | `/api/stories/[id]` | Full bundle (story + frames + clips + stitched) |
| PATCH | `/api/stories/[id]` | Edit scene_scripts, frame_prompts, style_anchor |
| POST | `/api/stories/[id]/frames/[1..5]` | Imagen call, upsert row |
| POST | `/api/stories/[id]/clips/[1..4]` | Veo call (firstFrame+lastFrame), upsert row |
| GET  | `/api/stories/[id]/clips/[i]/status` | Poll Veo operation, upload to storage |
| POST | `/api/stories/[id]/stitch` | FFmpeg concat demuxer, writes stitched mp4 |

## UI Surface (3 pages)

- **`/generate`** — 5 frame cards (row 1) + 4 clip cards (row 2) + stitch button (row 3). Topic + aspect ratio + duration + model tier inputs at top.
- **`/analytics`** — cost tracking, budget gauge, generation stats, story count.
- **`/settings`** — API keys (integration config).

Sidebar has exactly these 3 items. `/` redirects to `/generate`. `/login`, `/auth/callback`, `/download` are public.

## Cost Model

Per story at **Standard tier** (default): ~$13.05 = 4 × 8s × $0.40 (Veo) + 5 × $0.04 (Imagen) + ~$0.05 (Gemini).

Per story at **Fast tier**: ~$4.92 = 4 × 8s × $0.15 (Veo Fast) + 5 × $0.02 (Imagen Fast) + ~$0.02 (Gemini).

Budget cap: $500/user/month (enforced in `lib/budget-guard.ts`, queries `mkt_usage_logs`).

## AI Models

| Model ID | Use | Cost |
|----------|-----|------|
| `gemini-2.5-flash` | Story script | $0.075/$0.60 per 1M tokens |
| `veo-3.1-generate-001` | Video (standard) | $0.40/sec |
| `veo-3.1-fast-generate-001` | Video (fast) | $0.15/sec |
| `imagen-4.0-generate-001` | Keyframe (standard) | $0.04/image |
| `imagen-4.0-fast-generate-001` | Keyframe (fast) | $0.02/image |

Preview-env equivalents are used when `VEO_ENVIRONMENT !== "production"`.

## Key Conventions

- **Supabase clients:** `createClient()` (browser), `createSupabaseServer()` (server component), `createServiceClient()` (API route, bypasses RLS).
- **Hook pattern:** React Query for all data fetching; mutations invalidate `["story", storyId]`.
- **Polling:** `useStory` auto-polls every 8s while any frame/clip is processing, stops otherwise.
- **Rate-limit helper:** `rateLimitResponse()` returns 429 with `Retry-After` header.
- **Storage URLs:** public URLs from Supabase storage (no signed-URL expiry).

## Build & Deploy

```bash
npm run dev        # Dev server on :3000
npm run build      # Production build (verifies ffmpeg-static bundling via outputFileTracingIncludes)
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

Vercel auto-deploys from `main`. GitHub Actions CI (`.github/workflows/ci.yml`) runs lint + typecheck + build on PRs.

Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_API_KEY`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET` (32+ hex chars).

## Gotchas

- **Local build needs `.env.local`** — Supabase URL required at parse time.
- **FFmpeg bundle** — `ffmpeg-static` binary is ~50MB; `next.config.ts` uses `outputFileTracingIncludes` so it only ships with the stitch route's Lambda.
- **FFmpeg codec uniformity** — stitch relies on Veo producing identical codec/fps/resolution across clips (currently true). `lib/video/stitch.ts` detects common concat warnings and fails loudly + validates output size.
- **Image-to-video requires `personGeneration: "allow_adult"`** (not `"allow_all"` which is text-to-video only).
- **Veo URI retention:** 2 days. If a clip's status route runs after retention expiry the download fails; retry cap is 5.

## Scripts / Skills (active)

- `/deploy` — lint + build + Vercel prod deploy
- `/perf-check` — bundle + Core Web Vitals check

Legacy skills referencing removed features (`audit-api`, `test-api`, `new-feature`, `cost-report`, `monitor-budget`, `db-check`) were removed or refactored — they pointed at deleted tables/routes.

## Memory

A project-scoped memory file lives at
`/Users/caglarbiber/.claude/projects/-Volumes-APP-Newbee-NewbeeMarketing/memory/`.
Key invariant: **Marketing repo + Supabase are fully isolated** from Admin / Expert / Newbee App (which share the Newbee Supabase). Don't suggest cross-project DB patterns.
