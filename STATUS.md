# Current work

Goal: Replace the legacy Wix site on `newbeeapp.com` with a modern Next.js website inside `newbee-website` while preserving the `download.newbeeapp.com` / `/download` device-aware redirect.
Branch: `main`

## Completed

- Merged security PR #6 (Next.js 16.4.2, React 19.3.1, local `braces` recursion guard).
- Renamed GitHub repository (`NewbeeConnect/NewbeeMarketing` → `NewbeeConnect/newbee-website`), local folder (`newbee-website`), and Vercel project (`newbee-website`).
- Added `newbeeapp.com`, `www.newbeeapp.com`, and `newbee-website.vercel.app` domains to the Vercel project.
- Built the full `newbeeapp.com` website using the `beeyondapps.com` architectural design system (`/`, `/communities`, `/businesses`, `/about`, `/contact`, `/privacy`, `/termsandconditions`, `robots.ts`, `sitemap.ts`).
- Preserved `GET /download` and host-aware root rewrite in `proxy.ts` for `download.newbeeapp.com` and `marketing.newbeeapp.com`.
- Added permanent 308 redirects in `next.config.ts` for legacy Wix routes.

## Next Steps

- Point `newbeeapp.com` DNS in Wix to Vercel (`A @ -> 76.76.21.21`, `CNAME www -> cname.vercel-dns.com`) so SSL certificates issue automatically.
