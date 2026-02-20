/**
 * Few-shot examples for Veo prompt optimization.
 * These examples help the AI understand the level of detail
 * and style expected in optimized prompts.
 */
export const VEO_PROMPT_EXAMPLES = [
  {
    scene_description:
      "Show the app's event discovery feature with people finding events near them",
    optimized_prompt:
      "A smartphone screen displaying a vibrant event discovery interface with colorful event cards, the camera slowly zooms in as a finger scrolls through upcoming events in a cozy urban cafe setting, warm natural light streaming through floor-to-ceiling windows, soft bokeh city lights in background, modern UI design with smooth animations, shot in cinematic 4K quality with shallow depth of field, contemporary commercial aesthetic",
    negative_prompt:
      "blurry text, distorted UI elements, unrealistic hand movements, low resolution, flickering screen, watermarks",
  },
  {
    scene_description:
      "Expats connecting with each other in a new city, showing community feeling",
    optimized_prompt:
      "A diverse group of young professionals sharing a warm moment in a modern European co-working space, animated conversation and genuine laughter, afternoon sunlight creating a welcoming atmosphere, contemporary minimalist interior with exposed brick and plants, camera slowly pans across the group capturing candid expressions, documentary-style cinematography with natural color grading, 9:16 vertical composition optimized for mobile viewing",
    negative_prompt:
      "distorted faces, unnatural poses, inconsistent lighting, artificial look, stock photo aesthetic, watermarks",
  },
  {
    scene_description: "App download CTA with app store buttons",
    optimized_prompt:
      "Clean motion graphics animation of a smartphone with the app icon appearing center frame, app store download buttons elegantly slide in from below, a subtle particle effect sparkles around the phone, deep gradient background transitioning from midnight blue to brand purple, modern sans-serif typography animates the tagline, smooth 60fps motion design, professional commercial quality",
    negative_prompt:
      "pixelated graphics, misaligned text, choppy animation, cluttered composition, distorted logo, low resolution",
  },
] as const;

/**
 * Strategy examples for the Gemini strategy generator
 */
export const STRATEGY_EXAMPLES = [
  {
    brief: "Promote event discovery feature for expats in Berlin",
    strategy: {
      hook: "A split screen: empty weekend calendar on the left transforms into a packed social calendar on the right with exciting events appearing one by one",
      narrative_arc:
        "Problem (lonely weekends in a new city) → Discovery (finding the app's event feature) → Transformation (calendar fills with concerts, meetups, food festivals) → Social proof (community stats) → CTA (download and never miss out)",
      key_messages: [
        "Never have a boring weekend in your new city",
        "Discover curated events matching your interests",
        "Join a community of 10,000+ expats",
      ],
      cta: "Download Newbee and discover events happening this weekend",
      recommended_duration: 30,
      recommended_scenes: 5,
      music_mood:
        "Upbeat, indie-electronic with building energy, transitions from mellow to vibrant",
    },
  },
] as const;
