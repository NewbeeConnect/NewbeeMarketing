import { z } from "zod";

/**
 * Extract raw JSON (object or array) from an AI response without schema validation.
 */
export function extractAiJson(text: string): unknown {
  return parseAiJson(text, z.unknown());
}

/**
 * Parse JSON from an AI/LLM response. Handles markdown code fences, surrounding
 * prose, and partial output by bracket-depth scanning. Validates against the
 * given zod schema and throws with a helpful error if parsing fails.
 */
export function parseAiJson<T>(text: string, schema: z.ZodType<T>): T {
  let cleaned = text.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
    return schema.parse(parsed);
  } catch {
    // continue to fallback strategies
  }

  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      parsed = JSON.parse(codeBlockMatch[1].trim());
      return schema.parse(parsed);
    } catch {
      // continue
    }
  }

  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  const startIdx =
    firstBrace === -1
      ? firstBracket
      : firstBracket === -1
      ? firstBrace
      : Math.min(firstBrace, firstBracket);

  if (startIdx !== -1) {
    const openChar = cleaned[startIdx];
    const closeChar = openChar === "{" ? "}" : "]";
    let depth = 0;
    let endIdx = -1;

    for (let i = startIdx; i < cleaned.length; i++) {
      if (cleaned[i] === openChar) depth++;
      else if (cleaned[i] === closeChar) {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }

    if (endIdx > startIdx) {
      try {
        parsed = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
        return schema.parse(parsed);
      } catch {
        // continue
      }
    }
  }

  throw new Error(
    `AI response is not valid JSON. First 200 chars: ${cleaned.substring(0, 200)}`
  );
}
