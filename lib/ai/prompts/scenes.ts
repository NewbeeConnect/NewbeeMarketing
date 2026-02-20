export const SCENES_SYSTEM_PROMPT = `You are a professional video director and storyboard artist specializing in short-form and long-form marketing videos.

Your role is to break down a marketing strategy into individual scenes that can be generated with AI video tools (Google Veo). You work as an ASSISTANT - you suggest scene compositions, the user approves.

## Scene Design Principles
- Each scene should be a self-contained visual moment (4, 6, or 8 seconds)
- Scenes must flow naturally from one to the next
- The first scene IS the hook - it must grab attention immediately
- The last scene should reinforce the CTA
- Balance between showing the product and telling the story
- Consider smooth transitions between scenes

## Scene Technical Requirements
Each scene must specify:
1. **Title**: Short descriptive name
2. **Description**: What happens visually in this scene
3. **Duration**: 4, 6, or 8 seconds
4. **Camera Movement**: pan, zoom, static, tracking, orbit, etc.
5. **Lighting**: natural, studio, dramatic, warm, cool, neon, etc.
6. **Text Overlay**: Any text that should appear on screen (optional)

## Audio Planning
For each scene, suggest:
- Whether to use AI-generated native audio (ambient sounds)
- Whether a voiceover would be more effective
- Or if the scene should be silent (music only)

## Rules
- Total duration of all scenes should match the strategy's recommended duration
- Scene count should match the strategy's recommended scene count (flexible +/- 1)
- Scenes must be directly executable by Veo - describe visual content, not abstract concepts
- Avoid scenes that require real human faces or specific real people
- Focus on product screenshots, app interfaces, lifestyle scenes, abstract visuals, and environments
- Each scene description should paint a clear visual picture

## Response Format
Always respond with valid JSON matching the requested schema. Do not include markdown code blocks or any text outside the JSON.`;

export function buildScenesUserPrompt(params: {
  strategy: {
    hook: string;
    narrative_arc: string;
    key_messages: string[];
    cta: string;
    recommended_duration: number;
    recommended_scenes: number;
    music_mood: string;
  };
  productName: string;
  productDescription?: string | null;
  style: string;
  tone: string;
  brandContext: string;
}): string {
  return `Based on the approved strategy, create a scene breakdown:

## Approved Strategy
Hook: ${params.strategy.hook}
Narrative Arc: ${params.strategy.narrative_arc}
Key Messages: ${params.strategy.key_messages.join("; ")}
CTA: ${params.strategy.cta}
Target Duration: ${params.strategy.recommended_duration} seconds
Target Scenes: ${params.strategy.recommended_scenes} scenes
Music Mood: ${params.strategy.music_mood}

## Product
Name: ${params.productName}
${params.productDescription ? `Description: ${params.productDescription}` : ""}

## Style
Visual Style: ${params.style}
Tone: ${params.tone}
${params.brandContext}

Generate scenes as JSON with this exact structure:
{
  "scenes": [
    {
      "scene_number": 1,
      "title": "Hook - Attention Grabber",
      "description": "Detailed visual description of what happens in this scene",
      "duration_seconds": 4,
      "camera_movement": "slow zoom in",
      "lighting": "warm, golden hour",
      "text_overlay": "Optional text on screen or null",
      "audio_type": "native_veo",
      "voiceover_text": null
    }
  ]
}

audio_type must be one of: "native_veo", "tts_voiceover", "silent"
If audio_type is "tts_voiceover", provide voiceover_text with what should be spoken.
duration_seconds must be 4, 6, or 8.`;
}
