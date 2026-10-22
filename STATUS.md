# Newbee Website (`newbeeapp.com`) — Status

## Goal
Minimal, 100% English slide-by-slide scroll-snapping website (`neoklinik.io` style) for Newbee (`newbeeapp.com` & `www.newbeeapp.com`).

## Core Slogan
> **"One-stop app to navigate all challenges of moving and living abroad."**

## Completed (2026-10-23)
- **Minimal Slide-Deck Architecture (`neoklinik.io` style):**
  - Ported `components/scroll-controller.ts` for full-viewport slide snapping (`section[data-snap]`), keyboard navigation, left slide dots (`.nk-slide-dots`), top scroll progress bar (`.nk-scroll-progress`), and floating bottom-right `"Next · [Slide] ↓"` pill (`.nk-next-pill`).
  - **Slide 00 (`#start`):** Hero with slogan `"One-stop app to navigate all challenges of moving and living abroad."`, primary CTAs (**Download Newbee** `/download` + **Continue on Web** `https://app.newbeeapp.com`), iPhone mockup (`/screens/home.png`), and out-of-phone pop-out cards.
  - **Slide 01 (`#ask` — Ask Questions):** `Ask anything. Get real answers.` with `/screens/feed.png`, `/screens/feed-ask.png`, `/illustrations/ask-illustration.jpg`, and verified answer bubbles.
  - **Slide 02 (`#events` — Organize Events):** `Host or join events in your city.` with `/screens/events.png`, real event photos (`/events/wine-tasting-group.jpg`, `/events/summer-picnic.jpg`), and `/illustrations/events-illustration.jpg`.
  - **Slide 03 (`#meet` — Meet New People):** `Turn a new city into home.` with `/screens/people.png`, `/screens/communities.png`, `/events/sunday-brunch.jpg`, and `/illustrations/meet-illustration.jpg`.
  - **Slide 04 (`#get-started`):** Closing slide with side-by-side **Download Newbee (iOS & Android)** and **Continue on Newbee Web (`app.newbeeapp.com`)** cards.
- **Language & Copy Rules:**
  - 100% English across the entire site (`lang="en"`), including `/privacy`, `/termsandconditions`, and `/contact`.
  - Zero occurrences of `"diaspora"` anywhere in the repository.

## Next Steps
- Monitor live production deployment on `https://newbeeapp.com` and `https://www.newbeeapp.com`.
