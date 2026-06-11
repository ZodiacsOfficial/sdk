import { z } from "zod";
import type { AstroEventsDigest } from "../astro/events";

const SignReadingSchema = z.object({
  vibe: z.string().describe("Two to four word cosmic vibe headline for the sign"),
  note: z
    .string()
    .describe(
      "One or two playful sentences grounded in the provided sky events. Entertainment only: " +
        "never financial advice, never a price prediction, never an instruction to acquire or " +
        "dispose of anything."
    ),
  moodScore: z
    .number()
    .describe("Cosmic mood from 0 to 100. A vibe meter, explicitly not a market forecast.")
});

export const DailySkySchema = z.object({
  global: z.object({
    headline: z.string().describe("Short, fun headline for today's sky"),
    marketMood: z
      .enum(["radiant", "balanced", "turbulent"])
      .describe("Overall cosmic weather label, framed as mood and not as a forecast"),
    blurb: z
      .string()
      .describe("Two sentences of cosmic market weather, entertainment only, no advice")
  }),
  signs: z.object({
    aries: SignReadingSchema,
    taurus: SignReadingSchema,
    gemini: SignReadingSchema,
    cancer: SignReadingSchema,
    leo: SignReadingSchema,
    virgo: SignReadingSchema,
    libra: SignReadingSchema,
    scorpio: SignReadingSchema,
    sagittarius: SignReadingSchema,
    capricorn: SignReadingSchema,
    aquarius: SignReadingSchema,
    pisces: SignReadingSchema
  })
});

export type DailySky = z.infer<typeof DailySkySchema>;

export interface DailySkyPayload {
  readonly date: string;
  readonly source: "claude" | "fallback";
  readonly events: AstroEventsDigest;
  readonly sky: DailySky;
}
