# Newbee Marketing Hub — AI Image & Video Asset Generator

> **Last Updated:** September 24, 2026 | Hosting: Vercel (auto-deploy from `main`)

Admin-only tool for producing Newbee ad creatives: one image, one video, or an image → video pipeline per run, stored in a team-shared asset library. Uses Google AI models — Gemini 3 Pro for briefs and structured prompts, Nano Banana 2 (Gemini 3 Pro Image) for stills, Veo 3.1 for video.

---

## Quick Start

```bash
# Install dependencies
npm install

# Copy env template and fill values
cp .env.example .env.local

# Start development server (Turbopack)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note:** `npm run build` fails locally without `.env.local`. This is expected — env vars are configured on Vercel.

---

## Documentation

**For comprehensive project documentation, see [CLAUDE.md](CLAUDE.md)**

This includes:
- Intent-first `/generate` flow (image, video, or image → video pipeline; brief suggestion, prompt blueprints, video extension)
- AI model reference (Gemini 3 Pro, Nano Banana 2, Veo 3.1) and pricing
- Single-tenant media library (`/library`) and cost tracking (`/analytics`)
- Device-aware download redirect (`/download`) powering `download.newbeeapp.com`
- Service client patterns (`createServiceClient`) and budget guard ($500/user/mo cap)
---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** React 19 + TypeScript 5 + Tailwind CSS 4 + shadcn/ui
- **Database:** Supabase (own instance, `mkt_` prefixed tables)
- **AI:** Gemini 3 Pro (briefs, prompt blueprints), Nano Banana 2 (images), Veo 3.1 (async video)
- **Hosting:** Vercel (auto-deploy)
- **Budget:** $25,000 Google Cloud startup credit

---

## Key Links

| Resource | Link |
|----------|------|
| Vercel Dashboard | https://vercel.com/newbeeconnect/newbeemarketing |
| Supabase Dashboard | https://supabase.com/dashboard/project/dwwkcfunctykemwsrkkr |
| Google AI Studio | https://aistudio.google.com |

---

## License

This project is proprietary. All rights reserved.
