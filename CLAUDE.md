# Newbee Download Redirect (formerly the Marketing Hub)

> **Last Updated:** September 24, 2026
> GitHub: `NewbeeConnect/NewbeeMarketing` | Hosting: Vercel project `newbee-marketing` | Language: Turkish

## What this repo is now

One route: `GET /download` (`app/download/route.ts`) sends the visitor to the
right place by user agent — iPhone/iPad → App Store, Android → Google Play,
anything else → `https://app.newbeeapp.com`. `proxy.ts` rewrites every host's
root (`/`) to it, so `download.newbeeapp.com` works as a bare link. That link is
printed on Instagram story footers and store material, so **it must keep
working** — test all three user agents after any change.

## Retired: the Marketing Hub generator

Until 2026-09-24 this repo was an admin-only AI image/video generator (Gemini,
Nano Banana, Veo) with its own Supabase project `dwwkcfunctykemwsrkkr`. That
Supabase project no longer exists (the host returned NXDOMAIN on 2026-09-24 and
it is not in the Newbee Supabase account), so login was dead. The owner retired
it the same day. All generator code, migrations and dependencies were removed.

To see or restore it, check out the annotated tag
`retired/marketing-hub-2026-09-24` — the last commit before removal. A revival
would also need a new Supabase project (the schema is in that tag's
`supabase/migrations/`) and fresh `GOOGLE_API_KEY` / Supabase env vars in Vercel.

## Rules

1. **GitHub identity — verify, never switch.** PRs must be authored by
   **NewbeeConnect**: GitHub's squash merge rewrites the commit author to the PR
   author, and the Newbee Vercel team's SAML SSO blocks deploys authored by
   `caglarbiber90`. Never run `gh auth switch`; prefix one-offs with the pinned
   config (`GH_CONFIG_DIR=<pinned dir> gh pr create …`, see the Newbee app repo's
   `docs/github-identity.md`). `git config user.email` must print
   `newbeeconnect@gmail.com`; don't add a repo-local override.
2. **Vercel deploy canary:** after a merge, if the deployment is
   `BLOCKED`/`ERROR`, check `meta.githubCommitAuthorLogin`; a wrong author needs
   a follow-up commit from NewbeeConnect.

## Build & Deploy

```bash
npm run dev        # Dev server on :3000
npm run build      # Production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

No env vars are needed. Vercel auto-deploys from `main`. GitHub Actions CI
(`.github/workflows/ci.yml`) runs lint + typecheck + build on PRs to `main` and
pushes to `main`.

Quick check of a deployment (expect 302 to the App Store, Play, and the web app):

```bash
for ua in iPhone Android Macintosh; do curl -s -o /dev/null -w "$ua %{http_code} %{redirect_url}\n" -A "$ua" https://download.newbeeapp.com; done
```

## Domains

`download.newbeeapp.com` (keep), `marketing.newbeeapp.com` (the old panel
address; now lands on the same redirect), `newbee-marketing.vercel.app`.
