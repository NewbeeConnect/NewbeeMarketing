# Newbee Marketing Hub - AI Video Ad Platform

> Enterprise AI marketing platform using Google AI (Gemini, Veo, Imagen) for video/image ad generation.
> GitHub: `NewbeeConnect/newbeemarketing` | Hosting: Vercel | Language: Turkish

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| UI | React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui |
| State | TanStack React Query 5 (no Zustand/Redux) |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| AI | Google Gemini 2.5 Pro/Flash, Veo 3.1, Imagen 4, Cloud TTS |
| Forms | react-hook-form + zod |
| Hosting | Vercel |

## Critical Rules

1. **Never modify `components/ui/`** — shadcn/ui generated. Use `npx shadcn@latest add <component>`.
2. **Git commits:** Always use `newbeeconnect@gmail.com` as commit email. **Check before first commit:** `git config user.email` — if not `newbeeconnect@gmail.com`, run: `git config user.email newbeeconnect@gmail.com && git config user.name newbeeconnect`
3. **Always use `createServiceClient()`** for DB writes in API routes (bypasses RLS).
4. **Always check `if (!ai)`** before AI operations — client is null when GOOGLE_API_KEY missing.
5. **All tables use `mkt_` prefix** — never create tables without it.
6. **RLS enforced on all tables** — every table needs `auth.uid() = user_id` policy.
7. **Cost tracking:** Every AI API call must log to `mkt_usage_logs`.
8. **Veo is async:** Returns `operation_name` for polling (5s interval). Imagen is sync.
9. **`parseAiJson()`** must always be used to parse Gemini responses (strips markdown code blocks).
10. **Zod schemas:** Use `.optional()` NOT `.default()` to avoid zodResolver type mismatch.
11. **PersonGeneration:** `PersonGeneration.DONT_ALLOW` for images, `"allow_all"` for text-to-video (required for person content). Veo 3.1 also uses `generateAudio: true` by default.
12. **Resolution:** Veo supports `720p`, `1080p`, `4k`. Note: 1080p/4k only supports 8s duration per clip.

## Two Workflow Systems

**Project Workflow (6 steps):** Brief → Strategy → Scenes → Prompts → Generate → Post-Production
**Campaign Workflow (5 steps):** Fetch Context → AI Strategy → Media Production → Ad Distribution → Analytics

## Key Conventions

- **Supabase clients:** `createClient()` (browser), `createSupabaseServer()` (server), `createServiceClient()` (bypasses RLS), `createNewbeeClient()` (read-only Newbee data)
- **AI prompts:** Each feature has dedicated prompt builder in `lib/ai/prompts/`
- **Hook pattern:** React Query for all data fetching, mutations invalidate queries
- **API route pattern:** auth check → ai null check → process → save → log usage → return
- **A/B Testing:** Strategy generation supports emotional vs technical variants (`is_ab_variant`, `parent_project_id`)
- **Ad Distribution:** Dual-mode (stub when no API keys, real when keys provided)
- **Storage bucket:** `mkt-assets`, path: `{user_id}/{type}/{file_id}`
- **Budget:** $25,000 Google Cloud startup credit (`TOTAL_CREDIT_USD`)

## AI Models

| Model | Use | Cost |
|-------|-----|------|
| Gemini 2.5 Pro | Strategy, scenes, refinement | $1.25/$10 per 1M tokens |
| Gemini 2.5 Flash | Prompts, captions, context, insights | $0.075/$0.60 per 1M tokens |
| Veo 3.1 | Video generation (async) | $0.40/sec (standard), $0.15/sec (fast) |
| Imagen 4 | Image generation (sync) | $0.04/image (standard), $0.02 (fast) |

## API Routes (26 total)

| Path | Purpose |
|------|---------|
| `/api/ai/*` | AI generation (strategy, scenes, captions, insights, refine, optimize-prompt) |
| `/api/generate/*` | Media generation (image, video, video/extend, video/retry, video/status, mockup, voiceover) |
| `/api/process/*` | Post-production (caption-embed, export, stitch, watermark) |
| `/api/ads/*` | Ad distribution (publish, sync-performance, [deploymentId]/status) |
| `/api/campaigns/*` | Campaign analytics ([campaignId]/performance) |
| `/api/context/fetch` | Brand context fetching |
| `/api/code-context/*` | Code context (upload, github, [id]) |
| `/api/newbee/insights` | Newbee data insights (read-only cross-DB) |

## Build & Deploy

```bash
npm run dev     # Dev server (Turbopack)
npm run build   # Production build
npm run lint    # ESLint
```

Vercel auto-deploys from `main` branch. Required env vars: see `.env.example` or Vercel dashboard.

## Gotchas

- **Local build requires `.env.local`** — `npm run build` fails locally without Supabase env vars. This is expected; env vars are configured on Vercel. Copy `.env.example` to `.env.local` and fill values for local builds.
- **Security headers** — `lib/supabase/middleware.ts` sets X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy headers on all responses.

## Skills (Slash Commands)

| Skill | Usage | Description |
|-------|-------|-------------|
| `/deploy` | `/deploy` | Lint + build + Vercel production deploy |
| `/cost-report` | `/cost-report` | AI usage cost summary |
| `/monitor-budget` | `/monitor-budget` | Check remaining Google Cloud credit |
| `/audit-api` | `/audit-api` | Audit API routes for security/logging |
