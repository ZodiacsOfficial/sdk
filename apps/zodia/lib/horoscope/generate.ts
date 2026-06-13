import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { AstroEventsDigest } from "../astro/events";
import { DailySkySchema } from "./schema";
import type { DailySky } from "./schema";

const SYSTEM_PROMPT = `You write the daily sky report for a playful zodiac mini app.
You receive real, precomputed astronomical events (retrograde windows, moon phases, sun
ingresses) as JSON and turn them into short, witty, warm horoscope copy for all twelve signs
plus a global "cosmic weather" blurb.

Hard rules:
- Entertainment only. Never give financial advice, price predictions, or any instruction to
  buy, sell, acquire, hold, or dispose of anything. Do not mention prices or trading.
- Ground every reading in the provided events; do not invent astronomical events.
- "marketMood" is cosmic weather flavor, not a forecast.
- Keep each sign note to one or two sentences. Vary tone across signs.
- Say "moon" or "moon phase" for anything moon-related; never use the word that combines
  "moon" with an "-ar" suffix.`;

/**
 * Generates the daily sky copy with Claude. Returns null when the API key is missing or the
 * call/parse fails, in which case callers fall back to deterministic templates.
 */
export async function generateDailySky(
  date: string,
  events: AstroEventsDigest
): Promise<DailySky | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  const client = new Anthropic();
  try {
    const response = await client.messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Date: ${date}\nSky events JSON:\n${JSON.stringify(events)}`
        }
      ],
      output_config: { format: zodOutputFormat(DailySkySchema) }
    });
    return response.parsed_output ?? null;
  } catch {
    return null;
  }
}
