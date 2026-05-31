import { getZodiacAsset } from "./official-registry.js";
import type { ZodiacSeason, ZodiacSeasonProgress, ZodiacSign } from "./types.js";

interface ZodiacSeasonDefinition {
  readonly sign: ZodiacSign;
  readonly startMonth: number;
  readonly startDay: number;
  readonly endMonth: number;
  readonly endDay: number;
}

const ZODIAC_SEASONS = [
  { sign: "capricorn", startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
  { sign: "aquarius", startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
  { sign: "pisces", startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
  { sign: "aries", startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
  { sign: "taurus", startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
  { sign: "gemini", startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
  { sign: "cancer", startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
  { sign: "leo", startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
  { sign: "virgo", startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
  { sign: "libra", startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
  { sign: "scorpio", startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
  { sign: "sagittarius", startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 }
] as const satisfies readonly ZodiacSeasonDefinition[];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getCurrentZodiacSeason(date: Date = new Date()): ZodiacSeason {
  return getZodiacSeasonForDate(date);
}

export function getZodiacSeasonForDate(date: Date): ZodiacSeason {
  const target = normalizeDate(date);
  const definition = getSeasonDefinitionForDate(target);

  return buildSeason(definition, target, true);
}

export function getNextZodiacSeason(date: Date = new Date()): ZodiacSeason {
  const target = normalizeDate(date);
  const currentDefinition = getSeasonDefinitionForDate(target);
  const currentSeason = buildSeason(currentDefinition, target, true);
  const currentIndex = ZODIAC_SEASONS.findIndex((season) => season.sign === currentDefinition.sign);
  const nextDefinition = ZODIAC_SEASONS[(currentIndex + 1) % ZODIAC_SEASONS.length]!;
  const nextStartDate = new Date(parseIsoDate(currentSeason.endDate).getTime() + MS_PER_DAY);

  return buildSeason(nextDefinition, nextStartDate, false);
}

export function getZodiacSeasonProgress(date: Date = new Date()): ZodiacSeasonProgress {
  const target = normalizeDate(date);
  const season = getZodiacSeasonForDate(target);
  const start = parseIsoDate(season.startDate);
  const endExclusive = new Date(parseIsoDate(season.endDate).getTime() + MS_PER_DAY);
  const elapsed = Math.max(0, target.getTime() - start.getTime());
  const total = Math.max(MS_PER_DAY, endExclusive.getTime() - start.getTime());
  const progress = roundPercentage(Math.min(100, Math.max(0, (elapsed / total) * 100)));

  return {
    ...season,
    progress
  };
}

function getSeasonDefinitionForDate(date: Date): ZodiacSeasonDefinition {
  return ZODIAC_SEASONS.find((definition) => {
    const startYear = getStartYearForSeason(definition, date);
    const start = utcDate(startYear, definition.startMonth, definition.startDay);
    const endYear = definition.endMonth < definition.startMonth ? startYear + 1 : startYear;
    const endExclusive = new Date(utcDate(endYear, definition.endMonth, definition.endDay).getTime() + MS_PER_DAY);

    return date.getTime() >= start.getTime() && date.getTime() < endExclusive.getTime();
  }) ?? ZODIAC_SEASONS[0]!;
}

function buildSeason(definition: ZodiacSeasonDefinition, dateInSeason: Date, isCurrent: boolean): ZodiacSeason {
  const startYear = getStartYearForSeason(definition, dateInSeason);
  const endYear = definition.endMonth < definition.startMonth ? startYear + 1 : startYear;
  const asset = getZodiacAsset(definition.sign);

  return {
    sign: definition.sign,
    displayName: asset.displayName,
    startDate: toIsoDate(utcDate(startYear, definition.startMonth, definition.startDay)),
    endDate: toIsoDate(utcDate(endYear, definition.endMonth, definition.endDay)),
    isCurrent
  };
}

function getStartYearForSeason(definition: ZodiacSeasonDefinition, date: Date): number {
  const year = date.getUTCFullYear();

  if (definition.endMonth < definition.startMonth && date.getUTCMonth() + 1 <= definition.endMonth) {
    return year - 1;
  }

  return year;
}

function normalizeDate(date: Date): Date {
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date.");
  }

  return new Date(date.getTime());
}

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function roundPercentage(value: number): number {
  return Math.round(value * 100) / 100;
}
