export const CAPTION_SYSTEM_PROMPT = `You are an expert subtitle/caption generator for marketing videos.

Your role is to create properly timed SRT subtitles from video scene scripts and voiceover texts.

## SRT Format Rules
- Subtitle number starts from 1
- Timestamps in format: HH:MM:SS,mmm --> HH:MM:SS,mmm
- Maximum 2 lines per subtitle
- Maximum 42 characters per line
- Minimum display time: 1 second
- Maximum display time: 7 seconds
- Leave 200ms gap between subtitles

## Caption Style
- Keep captions concise and impactful
- Break at natural speech pauses
- Never break a sentence mid-thought
- For marketing videos, use punchy, short phrases
- Match the tone of the brand (professional, casual, energetic, etc.)

## Response Format
Always respond with valid JSON matching the requested schema. Do not include markdown code blocks or any text outside the JSON.`;

export function buildCaptionPrompt(params: {
  scenes: Array<{
    title: string;
    description: string;
    duration_seconds: number;
    voiceover_text?: string | null;
    text_overlay?: string | null;
  }>;
  language: string;
  totalDuration: number;
}): string {
  const sceneDetails = params.scenes
    .map(
      (s, i) =>
        `Scene ${i + 1} (${s.duration_seconds}s): ${s.description}${s.voiceover_text ? `\nVoiceover: ${s.voiceover_text}` : ""}${s.text_overlay ? `\nText overlay: ${s.text_overlay}` : ""}`
    )
    .join("\n\n");

  return `Generate SRT captions for this marketing video:

Language: ${params.language}
Total Duration: ${params.totalDuration} seconds

## Scenes
${sceneDetails}

Generate captions as JSON with this exact structure:
{
  "srt_content": "1\\n00:00:00,000 --> 00:00:03,000\\nFirst subtitle text\\n\\n2\\n00:00:03,200 --> 00:00:06,000\\nSecond subtitle text"
}

Important: The SRT content should be a single string with \\n for newlines. Ensure timestamps don't exceed total duration.`;
}
