import {
  Body,
  Ecliptic,
  GeoVector,
  MakeTime,
  NextMoonQuarter,
  SearchMoonQuarter,
  SunPosition
} from "astronomy-engine";
import type { AstroTime } from "astronomy-engine";
import type { ZodiacSign } from "@zodiacs/sdk/core";

export type RetroPlanet = "mercury" | "venus" | "mars";

export interface RetrogradeWindow {
  readonly planet: RetroPlanet;
  readonly startsAt: string;
  readonly endsAt: string;
}

export type MoonPhaseName = "new" | "first-quarter" | "full" | "third-quarter";

export interface MoonPhaseEvent {
  readonly phase: MoonPhaseName;
  readonly at: string;
}

export interface IngressEvent {
  readonly sign: ZodiacSign;
  readonly at: string;
}

export interface AstroEventsDigest {
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly retrogrades: readonly RetrogradeWindow[];
  readonly moonPhases: readonly MoonPhaseEvent[];
  readonly ingresses: readonly IngressEvent[];
}

const RETRO_BODIES: Record<RetroPlanet, Body> = {
  mercury: Body.Mercury,
  venus: Body.Venus,
  mars: Body.Mars
};

const TROPICAL_ORDER: readonly ZodiacSign[] = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces"
];

const MOON_PHASE_BY_QUARTER: readonly MoonPhaseName[] = [
  "new",
  "first-quarter",
  "full",
  "third-quarter"
];

const DAY_MS = 86400000;

function geocentricLongitude(body: Body, time: AstroTime): number {
  return Ecliptic(GeoVector(body, time, true)).elon;
}

/** Normalizes an angle difference into the range [-180, 180). */
function normalizeDelta(delta: number): number {
  return ((delta + 540) % 360) - 180;
}

/** Apparent daily motion in ecliptic longitude, degrees per day. */
function longitudeVelocity(body: Body, time: AstroTime): number {
  const half = 0.5;
  const before = geocentricLongitude(body, time.AddDays(-half));
  const after = geocentricLongitude(body, time.AddDays(half));
  return normalizeDelta(after - before);
}

function bisectVelocityZero(body: Body, lower: AstroTime, upper: AstroTime): AstroTime {
  let lo = lower;
  let hi = upper;
  const loSign = Math.sign(longitudeVelocity(body, lo));
  for (let i = 0; i < 40; i += 1) {
    const mid = lo.AddDays((hi.ut - lo.ut) / 2);
    if (Math.sign(longitudeVelocity(body, mid)) === loSign) {
      lo = mid;
    } else {
      hi = mid;
    }
    if ((hi.ut - lo.ut) * DAY_MS < 60000) {
      break;
    }
  }
  return lo.AddDays((hi.ut - lo.ut) / 2);
}

/**
 * Finds retrograde windows that overlap [from, from + horizonDays]. Sampling extends
 * beyond the window on both sides so in-progress windows resolve to real station times.
 */
export function findRetrogradeWindows(
  planet: RetroPlanet,
  from: Date,
  horizonDays: number
): RetrogradeWindow[] {
  const body = RETRO_BODIES[planet];
  const pad = 120;
  const start = MakeTime(new Date(from.getTime() - pad * DAY_MS));
  const totalDays = horizonDays + pad * 2;

  const stations: { time: AstroTime; toRetrograde: boolean }[] = [];
  let previous = start;
  let previousVelocity = longitudeVelocity(body, previous);
  for (let day = 1; day <= totalDays; day += 1) {
    const current = start.AddDays(day);
    const velocity = longitudeVelocity(body, current);
    if (Math.sign(velocity) !== Math.sign(previousVelocity) && velocity !== 0) {
      stations.push({
        time: bisectVelocityZero(body, previous, current),
        toRetrograde: previousVelocity > 0
      });
    }
    previous = current;
    previousVelocity = velocity;
  }

  const windows: RetrogradeWindow[] = [];
  for (let i = 0; i < stations.length; i += 1) {
    const station = stations[i];
    if (!station || !station.toRetrograde) {
      continue;
    }
    const end = stations[i + 1];
    if (!end) {
      continue;
    }
    windows.push({
      planet,
      startsAt: station.time.date.toISOString(),
      endsAt: end.time.date.toISOString()
    });
  }

  const windowStart = from.getTime();
  const windowEnd = windowStart + horizonDays * DAY_MS;
  return windows.filter((window) => {
    const startsAt = Date.parse(window.startsAt);
    const endsAt = Date.parse(window.endsAt);
    return endsAt >= windowStart && startsAt <= windowEnd;
  });
}

export function findMoonPhases(from: Date, horizonDays: number): MoonPhaseEvent[] {
  const end = from.getTime() + horizonDays * DAY_MS;
  const events: MoonPhaseEvent[] = [];
  let quarter = SearchMoonQuarter(from);
  while (quarter.time.date.getTime() <= end) {
    const phase = MOON_PHASE_BY_QUARTER[quarter.quarter];
    if (phase) {
      events.push({ phase, at: quarter.time.date.toISOString() });
    }
    quarter = NextMoonQuarter(quarter);
  }
  return events;
}

function sectorOf(longitude: number): number {
  return Math.floor((((longitude % 360) + 360) % 360) / 30) % 12;
}

function bisectIngress(lower: AstroTime, upper: AstroTime, targetSector: number): AstroTime {
  let lo = lower;
  let hi = upper;
  for (let i = 0; i < 40; i += 1) {
    const mid = lo.AddDays((hi.ut - lo.ut) / 2);
    if (sectorOf(SunPosition(mid).elon) === targetSector) {
      hi = mid;
    } else {
      lo = mid;
    }
    if ((hi.ut - lo.ut) * DAY_MS < 60000) {
      break;
    }
  }
  return hi;
}

/** Sun ingresses into tropical zodiac signs (0 degrees ecliptic longitude = Aries). */
export function findSunIngresses(from: Date, horizonDays: number): IngressEvent[] {
  const start = MakeTime(from);
  const events: IngressEvent[] = [];
  let previous = start;
  let previousSector = sectorOf(SunPosition(previous).elon);
  for (let day = 1; day <= horizonDays; day += 1) {
    const current = start.AddDays(day);
    const sector = sectorOf(SunPosition(current).elon);
    if (sector !== previousSector) {
      const at = bisectIngress(previous, current, sector);
      const sign = TROPICAL_ORDER[sector];
      if (sign) {
        events.push({ sign, at: at.date.toISOString() });
      }
    }
    previous = current;
    previousSector = sector;
  }
  return events;
}

export function computeAstroEvents(from: Date, horizonDays: number): AstroEventsDigest {
  const retrogrades = (Object.keys(RETRO_BODIES) as RetroPlanet[]).flatMap((planet) =>
    findRetrogradeWindows(planet, from, horizonDays)
  );
  return {
    windowStart: from.toISOString(),
    windowEnd: new Date(from.getTime() + horizonDays * DAY_MS).toISOString(),
    retrogrades,
    moonPhases: findMoonPhases(from, horizonDays),
    ingresses: findSunIngresses(from, horizonDays)
  };
}

export function activeRetrogrades(digest: AstroEventsDigest, at: Date): RetroPlanet[] {
  const time = at.getTime();
  return digest.retrogrades
    .filter((window) => Date.parse(window.startsAt) <= time && Date.parse(window.endsAt) >= time)
    .map((window) => window.planet);
}

export function nextMoonPhase(digest: AstroEventsDigest, at: Date): MoonPhaseEvent | null {
  const time = at.getTime();
  return digest.moonPhases.find((event) => Date.parse(event.at) >= time) ?? null;
}
