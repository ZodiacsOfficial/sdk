import { ZODIAC_SIGNS, getCurrentZodiacSeason } from "@zodiacs/sdk/core";
import type { ZodiacSeason, ZodiacSign } from "@zodiacs/sdk/core";
import { hasRedis, keys, redis } from "./redis";
import { microsToUsd } from "./trades/pnl";
import type { VerifiedTrade } from "./trades/verify";

export interface CupStanding {
  readonly sign: ZodiacSign;
  readonly volumeUsd: number;
}

export interface CupSeasonInfo {
  readonly key: string;
  readonly sign: ZodiacSign;
  readonly displayName: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly daysLeft: number;
}

export interface CupChampion {
  readonly seasonKey: string;
  readonly sign: ZodiacSign;
  readonly volumeUsd: number;
}

export interface CupResponse {
  readonly season: CupSeasonInfo;
  readonly standings: readonly CupStanding[];
  readonly reigning: CupChampion | null;
}

const DAY_MS = 86400000;

/** Stable id for a season: start year + sign (capricorn spans the new year). */
export function seasonKeyFor(season: ZodiacSeason): string {
  return `${season.startDate.slice(0, 4)}-${season.sign}`;
}

export function cupSeasonInfo(date: Date = new Date()): CupSeasonInfo {
  const season = getCurrentZodiacSeason(date);
  const endExclusive = Date.parse(`${season.endDate}T00:00:00.000Z`) + DAY_MS;
  return {
    key: seasonKeyFor(season),
    sign: season.sign,
    displayName: season.displayName,
    startDate: season.startDate,
    endDate: season.endDate,
    daysLeft: Math.max(0, Math.ceil((endExclusive - date.getTime()) / DAY_MS))
  };
}

export function previousSeason(date: Date = new Date()): ZodiacSeason {
  const current = getCurrentZodiacSeason(date);
  const dayBeforeStart = new Date(Date.parse(`${current.startDate}T00:00:00.000Z`) - DAY_MS);
  return getCurrentZodiacSeason(dayBeforeStart);
}

/** All twelve signs, highest volume first; missing signs padded with zero. */
export function sortAndPadStandings(raw: Partial<Record<ZodiacSign, number>>): CupStanding[] {
  return ZODIAC_SIGNS.map((sign) => ({
    sign,
    volumeUsd: Math.round((raw[sign] ?? 0) * 100) / 100
  })).sort((a, b) => b.volumeUsd - a.volumeUsd);
}

/** Credits every leg of a verified trade to its sign's tally for the trade-time season. */
export async function creditCup(trade: VerifiedTrade): Promise<void> {
  const season = getCurrentZodiacSeason(new Date(trade.blockTimestamp * 1000));
  const cupKey = keys.cup(seasonKeyFor(season));
  for (const leg of trade.legs) {
    const usd = microsToUsd(BigInt(leg.usdMicros));
    if (usd > 0) {
      await redis().zincrby(cupKey, usd, leg.sign);
    }
  }
}

/** Records the champion of the just-ended season once. Idempotent; safe to run daily. */
export async function finalizeEndedSeason(now: Date = new Date()): Promise<void> {
  const previous = previousSeason(now);
  const previousKey = seasonKeyFor(previous);
  const existing = await redis().hget(keys.cupChampions(), previousKey);
  if (existing) {
    return;
  }
  const top = await redis().zrange<(string | number)[]>(keys.cup(previousKey), 0, 0, {
    rev: true,
    withScores: true
  });
  const sign = top[0];
  const score = top[1];
  if (typeof sign !== "string" || score === undefined) {
    return;
  }
  const champion: CupChampion = {
    seasonKey: previousKey,
    sign: sign as ZodiacSign,
    volumeUsd: Math.round(Number(score) * 100) / 100
  };
  await redis().hset(keys.cupChampions(), { [previousKey]: champion });
}

function devFixtures(season: CupSeasonInfo): CupResponse {
  return {
    season,
    standings: sortAndPadStandings({
      gemini: 4210,
      leo: 2890,
      scorpio: 1750,
      aries: 980,
      pisces: 410,
      taurus: 320
    }),
    reigning: {
      seasonKey: seasonKeyFor(previousSeason()),
      sign: previousSeason().sign,
      volumeUsd: 9410
    }
  };
}

export async function getCup(now: Date = new Date()): Promise<CupResponse> {
  const season = cupSeasonInfo(now);

  if (!hasRedis()) {
    if (process.env.NODE_ENV === "development") {
      return devFixtures(season);
    }
    return { season, standings: sortAndPadStandings({}), reigning: null };
  }

  const raw = await redis().zrange<(string | number)[]>(keys.cup(season.key), 0, 11, {
    rev: true,
    withScores: true
  });
  const volumes: Partial<Record<ZodiacSign, number>> = {};
  for (let i = 0; i + 1 < raw.length; i += 2) {
    volumes[raw[i] as ZodiacSign] = Number(raw[i + 1]);
  }

  const previousKey = seasonKeyFor(previousSeason(now));
  const reigning = await redis().hget<CupChampion>(keys.cupChampions(), previousKey);

  return { season, standings: sortAndPadStandings(volumes), reigning: reigning ?? null };
}
