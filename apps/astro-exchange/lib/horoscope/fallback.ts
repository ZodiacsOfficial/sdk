import { ZODIAC_SIGNS } from "@zodiacs/sdk/core";
import type { ZodiacSign } from "@zodiacs/sdk/core";
import { activeRetrogrades, nextMoonPhase } from "../astro/events";
import type { AstroEventsDigest, MoonPhaseName } from "../astro/events";
import type { DailySky } from "./schema";

const VIBES = [
  "Static in the signal",
  "Quiet orbit",
  "Charged skies",
  "Slow burn",
  "Open window",
  "Crossed wires",
  "High tide energy",
  "Soft landing"
] as const;

const NOTES = [
  "The sky is busy today; let your group chat catch up before you hit send.",
  "A good day to tidy loose ends and let the cosmos do the dramatic part.",
  "Energy moves sideways before it moves forward. Stretch first.",
  "Someone from your past reappears in the trollbox. Wave politely.",
  "Your patience gets tested and then rewarded with excellent memes.",
  "Double-check the details; the universe loves a typo today."
] as const;

const MOON_FLAVOR: Record<MoonPhaseName, string> = {
  new: "A new moon resets the board — fresh intentions all around.",
  "first-quarter": "The first-quarter moon asks for one decisive move.",
  full: "A full moon turns the volume up on everything. Hydrate.",
  "third-quarter": "The third-quarter moon clears clutter. Release something."
};

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pick<T>(items: readonly T[], seed: number): T {
  const item = items[seed % items.length];
  if (item === undefined) {
    throw new Error("pick requires a non-empty list");
  }
  return item;
}

/**
 * Deterministic template renderer used when Claude is unavailable. Seeded by date and sign so
 * the same day always renders the same copy.
 */
export function renderFallbackSky(date: string, events: AstroEventsDigest): DailySky {
  const at = new Date(`${date}T12:00:00.000Z`);
  const retro = activeRetrogrades(events, at);
  const moon = nextMoonPhase(events, at);

  const moodLabel = retro.length >= 2 ? "turbulent" : retro.length === 1 ? "balanced" : "radiant";
  const retroLine =
    retro.length > 0
      ? `${retro.map((planet) => planet[0]!.toUpperCase() + planet.slice(1)).join(" and ")} ` +
        `${retro.length === 1 ? "is" : "are"} retrograde — expect plot twists in your notifications.`
      : "No retrogrades in play — the cosmic comment section is unusually calm.";
  const moonLine = moon ? MOON_FLAVOR[moon.phase] : "The moon keeps its own schedule today.";

  const signs = {} as Record<ZodiacSign, { vibe: string; note: string; moodScore: number }>;
  for (const sign of ZODIAC_SIGNS) {
    const seed = hashSeed(`${date}:${sign}`);
    const retroPenalty = retro.length * 7;
    signs[sign] = {
      vibe: pick(VIBES, seed),
      note: `${pick(NOTES, seed >>> 3)} ${moonLine}`,
      moodScore: Math.max(15, Math.min(95, 40 + (seed % 48) - retroPenalty))
    };
  }

  return {
    global: {
      headline: `Today's sky, ${date}`,
      marketMood: moodLabel,
      blurb: `${retroLine} ${moonLine} Entertainment only — the stars do not give financial advice.`
    },
    signs
  };
}
