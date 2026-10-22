# Newbee Website & Download Redirect (`newbee-website`)

> **Last Updated:** October 22, 2026
> GitHub: `NewbeeConnect/newbee-website` | Hosting: Vercel project `newbee-website`

## Overview

This repository serves two roles on the same Next.js 16 application:

1. **Official Newbee Website (`newbeeapp.com`, `www.newbeeapp.com`, `newbee-website.vercel.app`)**
   - Built with the architectural design system shared with `beeyondapps.com` (warm paper background `#faf7f0`, radial dot grid, Newbee Yellow `#ffb72a`, crisp black ink `#111111`, local Geist / Geist Mono fonts).
   - Routes:
     - `/` — Platform showcase, App Store / Google Play / Web App CTAs, four core pillars, institutional backing
     - `/communities` — German city hubs & Newbee City Lead program
     - `/businesses` — Verified Experts (`expert.newbeeapp.com`), Event Organizers & Brand Partnerships
     - `/about` — Story ("From 'Help?!' to 'Heeey!'"), awards, and Co-Founders Çağlar Biber & Hande Turan
     - `/contact` — Support, City Lead / Expert applications, and GDPR/KVKK account & data deletion requests
     - `/privacy` — Privacy Policy & KVKK Clarification (EN / TR / DE)
     - `/termsandconditions` — Terms & Conditions (EN / TR / DE)
   - Permanent 308 redirects in `next.config.ts` map all legacy Wix URLs (`/home`, `/new-about`, `/blog`, `/groups`, `/forum`, `/terms`, etc.) to their modern equivalents.

2. **Device-Aware App Download Redirect (`/download` and `download.newbeeapp.com`)**
   - `GET /download` (`app/download/route.ts`) redirects by User-Agent:
     - iPhone / iPad / iPod → App Store (`https://apps.apple.com/app/newbee/id6474511885`)
     - Android → Google Play (`https://play.google.com/store/apps/details?id=com.beeyondapps.newbee`)
     - Desktop / other → `https://app.newbeeapp.com`
   - `proxy.ts` rewrites the root path (`/`) of `download.newbeeapp.com` and `marketing.newbeeapp.com` to `/download`. This bare link is printed on Instagram story footers and store materials, so **it must always keep working**.

## Rules

1. **GitHub identity — verify, never switch.** Commits and PRs must be authored by **NewbeeConnect** (`newbeeconnect@gmail.com`). Never run `gh auth switch`; use `GH_CONFIG_DIR=~/.config/gh-newbee`.
2. **Product domain rules:**
   - Do not promote a job board or career module (parked in Sep 2026).
   - Never refer to City Leads as "volunteers" / "gönüllü".

## Build & Verify

```bash
npm run lint
npm run typecheck
npm run build
```

Verify the download redirect across all three device classes:

```bash
for ua in iPhone Android Macintosh; do
  curl -s -o /dev/null -w "$ua %{http_code} %{redirect_url}\n" -A "$ua" https://download.newbeeapp.com
done
```
