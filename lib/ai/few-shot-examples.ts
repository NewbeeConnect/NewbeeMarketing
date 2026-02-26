/**
 * Few-shot examples for Veo 3.1 prompt optimization.
 * These examples demonstrate the 7-element framework, native audio integration,
 * colon-syntax dialogue, and noun-based negative prompts.
 */
export const VEO_PROMPT_EXAMPLES = [
  // 1. App Demo — UI showcase with subtle audio
  {
    scene_description:
      "Show the app's event discovery feature with people finding events near them",
    optimized_prompt:
      "Medium shot of a smartphone held in a woman's hand with natural light reflecting off the screen, displaying a vibrant event discovery interface with colorful event cards. Camera slowly dollies in as her finger scrolls through upcoming concerts and meetups. Setting: a sun-drenched European café with warm wooden tables and lush potted plants, afternoon golden hour light streaming through floor-to-ceiling windows creating soft lens flare. Shallow depth of field keeps the phone sharp while the café background melts into creamy bokeh with city life visible beyond. Contemporary commercial aesthetic, shot in cinematic quality with warm amber color grading. Audio: gentle café ambiance with distant chatter, subtle UI tap sounds as finger scrolls, soft lo-fi electronic music playing faintly in background.",
    negative_prompt:
      "distorted_fingers, blurry_text, unrealistic_hand_movements, low_resolution, flickering_screen, watermarks, text_overlays, compression_artifacts",
  },
  // 2. Community/Lifestyle — People connecting with dialogue
  {
    scene_description:
      "Expats connecting with each other in a new city, showing community feeling",
    optimized_prompt:
      "Wide establishing shot transitioning to medium close-up of a diverse group of young professionals sharing a warm moment in a modern co-working space with exposed brick walls and hanging Edison bulbs. A woman in her late twenties with wavy brown hair and a denim jacket laughs genuinely, her eyes crinkling with warmth. Camera arcs slowly around the group capturing candid expressions and natural gestures as they lean in to chat over coffee cups. Late afternoon sunlight creates rim lighting on their shoulders, volumetric light catching dust particles in the air. Documentary-style cinematography with natural color grading, slightly desaturated warm tones. The woman says: \"I finally found my people in this city.\" (no subtitles) Audio: lively co-working ambiance, keyboard clicks in distance, coffee cups clinking, warm indie-folk music undertone.",
    negative_prompt:
      "distorted_faces, unnatural_poses, inconsistent_lighting, stock_photo_aesthetic, watermarks, subtitles, frozen_expressions, mannequin_look",
  },
  // 3. CTA/Motion Graphics — Animated call-to-action with SFX
  {
    scene_description: "App download CTA with app store buttons",
    optimized_prompt:
      "Clean motion graphics animation with a sleek smartphone appearing center frame via a smooth 3D rotation reveal, the app icon materializes with a subtle particle burst. App store download buttons elegantly slide in from below with spring easing animation. Dynamic light streaks trace around the phone creating energy trails. Deep gradient background transitioning from midnight blue to brand purple with subtle geometric patterns floating in parallax. Modern sans-serif typography animates character by character spelling the tagline. Professional 60fps motion design, contemporary commercial quality with high contrast and crisp edges. Audio: cinematic whoosh as phone appears, digital shimmer on icon reveal, satisfying click when buttons land, upbeat electronic music building to a triumphant resolution.",
    negative_prompt:
      "pixelated_graphics, misaligned_text, choppy_animation, cluttered_composition, distorted_logo, low_resolution, flickering, banding_artifacts",
  },
  // 4. Lifestyle/Product — Physical product in real-world setting
  {
    scene_description:
      "A premium coffee brand being enjoyed in a morning routine setting",
    optimized_prompt:
      "Extreme close-up of rich dark coffee being poured in slow-motion into a handcrafted ceramic mug, steam curling upward in detailed wisps. Camera pulls back with a smooth dolly out to reveal a serene morning kitchen scene — marble countertop, fresh croissant on a linen napkin, soft morning light flooding through sheer curtains. A woman's hands wrap around the warm mug, her fingertips feeling the textured ceramic. Rack focus shifts from the coffee surface ripples to the peaceful garden view beyond the window. Warm golden-hour lighting with Rembrandt-style shadows, rich amber and cream color palette. Photorealistic cinematic style, anamorphic lens quality with natural film grain. Audio: satisfying liquid pour sound, ceramic mug placed on stone, birds chirping outside, gentle morning ambiance with soft piano melody.",
    negative_prompt:
      "distorted_hands, unnatural_liquid_physics, flickering_light, oversaturated_colors, watermarks, text_overlays, compression_artifacts, plastic_look",
  },
  // 5. Dialogue/Testimonial — Two people with colon-syntax dialogue
  {
    scene_description:
      "Two friends discussing how an app changed their social life in a new city",
    optimized_prompt:
      "Medium two-shot of two young professionals sitting on a park bench in a vibrant European city park with autumn leaves. The man with dark curly hair and round glasses leans forward with genuine enthusiasm, his eyes lighting up as he speaks. Over-the-shoulder shot favoring the woman with a red scarf who nods with a warm smile, slight eyebrow raise showing pleasant surprise. Camera gently shifts between subtle rack focus pulls between the speakers. Dappled sunlight filters through golden-leaved trees creating dancing light patterns on their faces, natural backlighting with warm color temperature. Documentary-style handheld with slight organic movement, natural color grading with boosted warm tones. The man says: \"I went from knowing nobody to having plans every weekend.\" The woman replies: \"Same here, it completely changed everything.\" (no subtitles) Audio: rustling autumn leaves, distant park ambiance with children playing, footsteps on gravel path, gentle acoustic guitar undertone.",
    negative_prompt:
      "distorted_faces, lip_sync_errors, unnatural_mouth_movements, frozen_expressions, subtitles, text_overlays, inconsistent_lighting, jump_cuts, robotic_speech",
  },
  // 6. Abstract/Mood — Atmospheric visual with slow-motion and layered audio
  {
    scene_description:
      "Brand intro with abstract visuals representing connection and discovery",
    optimized_prompt:
      "Aerial drone shot gliding over a misty cityscape at dawn, slow-motion capture of golden sunlight breaking through cloud layers and reflecting off glass skyscrapers. Camera tilts down gradually revealing interconnected bridges and flowing rivers of morning commuters from bird's-eye view. Transition to macro close-up of water droplets on a spider web glistening like jewels, each droplet reflecting miniature cityscapes. Volumetric fog creates depth layers with light beams cutting through in god-ray patterns. Cool blue-to-warm-gold color gradient matching the dawn transition, ethereal and aspirational aesthetic. Cinematic quality with anamorphic lens flare, time-lapse clouds in background while foreground plays in slow-motion contrast. Audio: deep ambient drone building slowly, crystalline chime accents on each light ray, distant city awakening sounds layered with ethereal pad synthesizers, crescendo building toward hope and possibility.",
    negative_prompt:
      "low_resolution, flickering, banding, noise_grain, watermarks, text_overlays, abrupt_transitions, inconsistent_color_grading, compression_artifacts, shaky_footage",
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
