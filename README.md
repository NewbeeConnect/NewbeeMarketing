# Newbee Marketing Hub — AI Video & Story Generator

> **Last Updated:** September 22, 2026 | Hosting: Vercel (auto-deploy from `main`)

AI-powered continuous story video generator and asset platform for Newbee. Uses Google AI models (Gemini 2.5 Flash, Imagen 4, Veo 3.1) with keyframe interpolation for seamless video ad generation.

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
- 4-scene / 5-keyframe continuous story generation with seamless cuts
- AI model reference (Gemini 2.5 Flash, Imagen 4, Veo 3.1) and pricing
- Single-tenant media library (`/library`) and cost tracking (`/analytics`)
- Device-aware download redirect (`/download`) powering `download.newbeeapp.com`
- Service client patterns (`createServiceClient`) and budget guard ($500/user/mo cap)
---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** React 19 + TypeScript 5 + Tailwind CSS 4 + shadcn/ui
- **Database:** Supabase (own instance, `mkt_` prefixed tables)
- **AI:** Gemini 2.5 Flash, Veo 3.1 (async video), Imagen 4 (keyframe images)
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
