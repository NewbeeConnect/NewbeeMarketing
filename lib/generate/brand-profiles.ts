/**
 * Rich structured brand profiles the AI brief generator uses. Every brand has
 * a product line-up, audience descriptors, voice, and a catalog of
 * "highlights" — specific features / pillars Gemini can pick one of and
 * build a concrete brief around. The more precise the data here, the more
 * on-brand and actionable the suggestions.
 *
 * Edit freely when the product evolves. Gemini reads this verbatim.
 */

import type { ProjectSlug } from "@/lib/projects";

export type Highlight = {
  /** Short name, e.g. "Local events" or "Bespoke commissions". */
  name: string;
  /** One-sentence description of what this is. */
  description: string;
  /** Why users/customers care — the emotional or practical payoff. */
  userBenefit: string;
  /** Concrete visual cues this highlight lends itself to in an ad. */
  visualCues: string[];
  /** A seed scene/story angle to spark the ad concept. */
  sampleScene: string;
};

export type BrandProfile = {
  slug: ProjectSlug;
  /** Product + category in one phrase, as used in the opening of a brief. */
  product: string;
  /** Who it's for, described in vivid persona terms. */
  audiences: string[];
  /** One-sentence positioning statement. */
  valueProp: string;
  /** Voice and tonal adjectives. */
  tone: string;
  /** Hex or descriptive palette cues. */
  palette: string;
  /** Photography/cinematography reference aesthetic. */
  referenceLook: string;
  /** The feature/pillar catalog — each becomes a candidate ad angle. */
  highlights: Highlight[];
};

// ─── Newbee ──────────────────────────────────────────────────────────
// Source of truth: Newbee/README.md + Newbee/CLAUDE.md. Newbee is a
// mobile + web community app for immigrants and expats — community
// matching, events, and expert Q&A. Live on App Store, Play Store, and
// app.newbeeapp.com. Three languages: EN / DE / TR.

export const NEWBEE_PROFILE: BrandProfile = {
  slug: "newbee",
  product: "Newbee — all-in-one mobile community app for immigrants and expats",
  audiences: [
    "Adults aged 25–45 who have recently moved abroad (first 6–24 months).",
    "Long-term expats looking to build local friendships beyond work circles.",
    "Digital nomads landing in a new city for weeks/months at a time.",
    "Students who just moved for university or an exchange program.",
    "Event organizers and paid experts building a side income inside the app.",
  ],
  valueProp:
    "A soft landing in a new country — meet people, join real-life events, and get answers from experts who've been in your shoes.",
  tone: "Warm, confident, modern, a little playful. Welcoming without being naive. Never corporate.",
  palette:
    "Honey yellow / amber primary, cream and soft white backgrounds, deep charcoal for copy, accent of leaf-green. Gentle, inviting, never neon.",
  referenceLook:
    "Editorial documentary photography, warm natural light (morning or golden hour), candid human moments, crisp iPhone mockups on real surfaces (café tables, city benches, apartment counters). Think NYT Metro column crossed with Apple product photography.",
  highlights: [
    {
      name: "Community connection",
      description:
        "Discover and chat with other expats nearby through interest-based communities (language, hobby, nationality, parenthood, LGBTQ+, etc.).",
      userBenefit:
        "The lonely first months abroad become the beginning of a real friend group — not just LinkedIn networking.",
      visualCues: [
        "Two strangers smiling over coffee after their first in-person meet-up",
        "A chat thread glowing on a phone screen in a quiet apartment, with someone smiling at the reply",
        "A group photo at a picnic, phones still half-visible in hands",
      ],
      sampleScene:
        "A woman sits at a kitchen table in a half-unpacked apartment, phone in hand. She smiles as a message from her new community lights up: 'Coffee this Saturday?'",
    },
    {
      name: "Local events",
      description:
        "Browse, buy tickets for, and RSVP to real-life expat events (language exchange nights, hikes, dinners, workshops) organized by community members.",
      userBenefit:
        "A weekend is no longer 'home alone scrolling' — it's a language café, a Sunday hike, a rooftop dinner with people just like them.",
      visualCues: [
        "Ticket confirmation screen with a warm photo of the host",
        "Hands raising glasses at a rooftop dinner",
        "Hiking boots on a forest trail seen through a phone's camera viewfinder",
      ],
      sampleScene:
        "A phone's lock screen shows a Saturday reminder — 'Tonight: Expat dinner at Elif's.' Cut to a rooftop table already set for ten people, string lights warming the scene.",
    },
    {
      name: "Expert Q&A",
      description:
        "Ask verified local experts (immigration lawyers, tax advisors, landlords, doctors, career coaches) paid or free questions and get real answers.",
      userBenefit:
        "The hardest, most-Googled expat questions (residence permit, tax filing, healthcare) get a real human answer from someone qualified — in minutes, not weeks.",
      visualCues: [
        "Close-up of a phone showing a clear answer in a chat bubble labeled 'Verified lawyer — replied in 12 min'",
        "Hand holding a freshly-approved residence permit while a relieved smile widens",
        "Two screens side by side: a messy forum thread on one, Newbee's crisp answer on the other",
      ],
      sampleScene:
        "Late evening, cluttered desk. Our subject sighs at a government letter. Opens Newbee, types a question. Ten minutes later a verified lawyer's reply pings. She exhales; we see her shoulders drop.",
    },
    {
      name: "City guides & nearby discovery",
      description:
        "Curated nearby cities view, local tips, and neighborhood discovery powered by community knowledge.",
      userBenefit:
        "Moving to a city you've never been to isn't a black box — the app hands you a trusted, lived-in shortlist of what actually matters nearby.",
      visualCues: [
        "Phone map view dotted with honey-yellow pins, a thumb hovering over one",
        "Someone stepping out of a bakery holding a paper bag, glancing back at their phone to screenshot the address",
        "A window seat on a tram, phone showing a nearby-events panel",
      ],
      sampleScene:
        "A man steps off a train in a new city with one suitcase. He opens Newbee on the platform. The screen pulls him into a curated list: 'Your first week in Berlin — the five places Newbee members keep coming back to.'",
    },
    {
      name: "Multilingual by default (EN / DE / TR)",
      description:
        "The app speaks English, German, and Turkish — tailored for the largest expat corridors Newbee serves.",
      userBenefit:
        "Users can sign up and navigate fluently from day one, without fighting a translator while already fighting a new country.",
      visualCues: [
        "Three quick cuts of the same UI in EN, DE, TR",
        "A user toggling language with a grin — 'finally'",
      ],
      sampleScene:
        "Handheld POV: thumb taps settings, language toggles from English to Türkçe. The UI flips smoothly. A voiceover or caption: 'in the language you actually think in.'",
    },
    {
      name: "Become an organizer or expert",
      description:
        "Any user can host ticketed events or answer questions for a fee — with Shopier payouts and built-in tooling.",
      userBenefit:
        "An engaged member turns their hobby, profession, or just their weekly dinner ritual into a real side income — without building a website or payment stack.",
      visualCues: [
        "Split screen: a freelance immigration consultant replying to questions in a home office / her bank balance ticking up",
        "A hiking guide checking attendees in as they arrive — all from the app",
      ],
      sampleScene:
        "A woman in a sunlit home office finishes typing an answer. Her phone buzzes — 'Payment received, €25.' She leans back, already drafting the next reply.",
    },
    {
      name: "Push notifications that matter",
      description:
        "Smart, language-aware push (FCM) for event reminders, answered questions, message replies, daily task digests.",
      userBenefit:
        "The noise of the internet quiets down — only the moments that actually move their life forward surface on the lock screen.",
      visualCues: [
        "Lock screen: a single Newbee notification — 'Elif answered your question' — with the rest of the screen blurred",
        "Phone face-up on a nightstand, honey-yellow glow from an incoming digest",
      ],
      sampleScene:
        "Morning alarm. Before the user taps it off, a quiet Newbee digest slides in: today's three events, one unread answer, one new member in their neighborhood. She half-smiles and gets up.",
    },
  ],
};

// ─── Atelier Sayın ───────────────────────────────────────────────────
// Bespoke fine-jewelry atelier — Istanbul. Handcraft, heritage aesthetic.
// Highlights are product categories and services (not app features) but
// the structure is identical so Gemini treats them uniformly.

export const ATELIERSAYIN_PROFILE: BrandProfile = {
  slug: "ateliersayin",
  product: "Atelier Sayın — bespoke fine-jewelry atelier, Istanbul",
  audiences: [
    "Women aged 30–55 buying meaningful, lasting pieces for themselves.",
    "Partners and family shopping gifts for anniversaries, birthdays, Mother's Day, graduations.",
    "Brides and grooms commissioning wedding bands and heirloom pieces.",
    "Collectors who value provenance, craftsmanship and a story over branded luxury.",
  ],
  valueProp:
    "Quiet luxury jewelry — handmade in Istanbul, crafted to be worn every day for a lifetime, and designed to become an heirloom.",
  tone: "Elegant, intimate, timeless, understated. Reverent toward craft, never flashy.",
  palette:
    "Deep burgundy, champagne gold, velvet black, warm ivory. Rich textures — velvet, raw silk, aged wood, polished metal.",
  referenceLook:
    "Editorial fashion photography (Vogue Italia / Harper's Bazaar interiors pages), warm window light from the side, macro detail shots, natural skin tones, narrow depth of field, film grain. No sterile catalog lighting.",
  highlights: [
    {
      name: "Signature gold collection",
      description:
        "Core ready-to-wear collection of 18k and 22k gold necklaces, bracelets, and rings — the pieces the atelier is best known for.",
      userBenefit:
        "A single gold piece that becomes a daily second-skin — worn through weddings, airports, and Sunday mornings for the next forty years.",
      visualCues: [
        "Macro of a gold chain catching warm window light on bare collarbones",
        "A hand reaching for coffee, a single signet ring glinting",
        "Necklace lifted out of a velvet box, dust motes visible in the sunbeam",
      ],
      sampleScene:
        "Morning, bedroom. A woman in ivory linen lifts a gold pendant from her bedside dish and fastens it in the mirror. Camera pushes in on the clasp clicking home — she doesn't even look at it, she knows by feel.",
    },
    {
      name: "Bespoke commissions",
      description:
        "One-to-one commission service — clients sit with the atelier to design a piece from stone to setting, with sketches and a hand-engraved finish.",
      userBenefit:
        "Commissioning a piece becomes the memory, not just the object — clients remember the hours with the atelier as much as the ring on their finger.",
      visualCues: [
        "Pencil sketch on watercolor paper beside a loose gemstone and a thimble of coffee",
        "Jeweler's bench, loupe raised to the eye, blowtorch pilot light glowing",
        "Two hands — client's and maker's — exchanging a finished ring over a wooden counter",
      ],
      sampleScene:
        "Atelier interior, late afternoon. A couple leans over the bench. The master jeweler slides a sketch across and lifts an uncut emerald to the light. The couple exchange a look: 'This one.'",
    },
    {
      name: "Gemstone collection",
      description:
        "Ethically sourced colored gemstones — emeralds, rubies, sapphires, tourmalines — set in signature and bespoke pieces.",
      userBenefit:
        "A color on the hand that belongs to no one else — and a stone with a verifiable story behind it.",
      visualCues: [
        "Macro of a deep-green emerald in sunlight, inner fire visible",
        "A tray of loose sapphires in velvet trays, light flickering across facets",
        "Ring on a bride's hand held up to stained-glass light",
      ],
      sampleScene:
        "A gloved hand lifts a single emerald onto a velvet tray. A loupe moves in. The camera finds the warm green fire inside the stone, then pulls back to reveal the finished ring.",
    },
    {
      name: "Wedding and engagement",
      description:
        "Wedding bands, engagement rings, and heirloom-piece design for couples. Includes private consultation and re-sizing for life.",
      userBenefit:
        "The piece their grandchildren will one day inherit — made now, in a room where the atelier remembers their names.",
      visualCues: [
        "Two bands side by side in a leather box, one slightly worn, one fresh",
        "Hand over hand at an altar, bands catching flash",
        "A bride's hand on the groom's shoulder during first dance, rings in focus",
      ],
      sampleScene:
        "Golden-hour garden. A couple stands apart from their wedding crowd for a moment, looking at their new bands. Macro cut: the two rings touch, each reflecting the other.",
    },
    {
      name: "Heritage craftsmanship",
      description:
        "Traditional Anatolian and Ottoman-era techniques — filigree, granulation, hand engraving — practiced by master jewelers in the Istanbul atelier.",
      userBenefit:
        "A contemporary piece that carries a lineage — one that a factory couldn't reproduce no matter how hard it tried.",
      visualCues: [
        "Close-up of a filigree pattern being soldered, sparks pinprick-small",
        "A master jeweler's worn hands at the bench, tools of the trade arranged",
        "Raw gold wire being drawn through a draw-plate, patina on the tool handle",
      ],
      sampleScene:
        "Workshop interior, shaft of window light. A master jeweler bends close over a filigree piece. The camera dwells on his hands for a beat too long. A caption card: 'One piece. 42 hours. Four hundred years of technique.'",
    },
    {
      name: "Gifting & seasonal collections",
      description:
        "Curated capsule collections and gift boxes for Mother's Day, Valentine's Day, New Year, birthdays — including gift-wrap and a hand-written note from the atelier.",
      userBenefit:
        "The giver looks like they thought about it for weeks — because the atelier did the thinking for them, wrapped in a ribbon.",
      visualCues: [
        "A dark-burgundy box opened on a candle-lit table, ribbon loose",
        "A mother's hand on her daughter's wrist as a new bracelet clicks shut",
        "Handwritten card resting on velvet beside the gift",
      ],
      sampleScene:
        "Mother's Day morning. A daughter sets a velvet box on the breakfast table. Her mother opens it slowly — a gold pendant with her initials, catching the sun. Neither says anything for a moment.",
    },
  ],
};

// ─── Lookup ──────────────────────────────────────────────────────────

const PROFILES: Record<ProjectSlug, BrandProfile> = {
  newbee: NEWBEE_PROFILE,
  ateliersayin: ATELIERSAYIN_PROFILE,
};

export function getBrandProfile(slug: ProjectSlug): BrandProfile {
  return PROFILES[slug];
}

/**
 * Flatten a profile into a single dense paragraph Gemini reads. Kept outside
 * the route so both suggest-brief and the prompt blueprint endpoint can use
 * the same on-brand context.
 */
export function profileAsPromptContext(profile: BrandProfile): string {
  const highlights = profile.highlights
    .map(
      (h, i) =>
        `${i + 1}. ${h.name} — ${h.description} Why users love it: ${h.userBenefit} Visual cues: ${h.visualCues.join("; ")}. Seed scene: ${h.sampleScene}`
    )
    .join("\n");

  return `PRODUCT: ${profile.product}
VALUE PROPOSITION: ${profile.valueProp}
AUDIENCES:
${profile.audiences.map((a) => `- ${a}`).join("\n")}
TONE: ${profile.tone}
PALETTE: ${profile.palette}
REFERENCE LOOK: ${profile.referenceLook}
HIGHLIGHTS / FEATURES (pick ONE to build the ad around):
${highlights}`;
}
