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
2. **Always use `createServiceClient()`** for DB writes in API routes (bypasses RLS).
3. **Always check `if (!ai)`** before AI operations — client is null when GOOGLE_API_KEY missing.
4. **All tables use `mkt_` prefix** — never create tables without it.
5. **RLS enforced on all tables** — every table needs `auth.uid() = user_id` policy.
6. **Cost tracking:** Every AI API call must log to `mkt_usage_logs`.
7. **Veo is async:** Returns `operation_name` for polling (5s interval). Imagen is sync.
8. **`parseAiJson()`** must always be used to parse Gemini responses (strips markdown code blocks).
9. **Zod schemas:** Use `.optional()` NOT `.default()` to avoid zodResolver type mismatch.
10. **PersonGeneration:** `PersonGeneration.DONT_ALLOW` for images, `"dont_allow"` string for video.

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

## Build & Deploy

```bash
npm run dev     # Dev server (Turbopack)
npm run build   # Production build
npm run lint    # ESLint
```

Vercel auto-deploys from `main` branch. Required env vars: see `.env.example` or Vercel dashboard.
