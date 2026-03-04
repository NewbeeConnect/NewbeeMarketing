# Newbee Marketing Hub - AI Video Ad Platform

> **Last Updated:** March 04, 2026 | Hosting: Vercel (auto-deploy from `main`)

AI-powered marketing platform for Newbee. Generates video ads, image creatives, and campaign strategies using Google AI models (Gemini, Veo, Imagen).

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
- AI model reference (Gemini, Veo 3.1, Imagen 4) with pricing
- Two workflow systems (Project 6-step, Campaign 5-step)
- Supabase client patterns (`createServiceClient`, `createNewbeeClient`)
- Cost tracking conventions (`mkt_usage_logs`)
- Security headers and middleware
- Slash commands (/deploy, /cost-report, /monitor-budget, /audit-api)

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** React 19 + TypeScript 5 + Tailwind CSS 4 + shadcn/ui
- **Database:** Supabase (own instance, `mkt_` prefixed tables)
- **AI:** Gemini 2.5 Pro/Flash, Veo 3.1 (async video), Imagen 4 (sync image)
- **Hosting:** Vercel (auto-deploy)
- **Budget:** $25,000 Google Cloud startup credit

---

## Key Links

| Resource | Link |
|----------|------|
| Vercel Dashboard | https://vercel.com/newbeeconnect/newbeemarketing |
| Supabase Dashboard | https://supabase.com/dashboard/project/mkt_project |
| Google AI Studio | https://aistudio.google.com |

---

## License

This project is proprietary. All rights reserved.
