import { NextResponse } from "next/server";
import { computeAstroEvents } from "../../../lib/astro/events";
import { renderFallbackSky } from "../../../lib/horoscope/fallback";
import type { DailySkyPayload } from "../../../lib/horoscope/schema";
import { hasRedis, isoDate, keys, redis } from "../../../lib/redis";

const HOROSCOPE_TTL_SECONDS = 48 * 3600;

function buildFallbackPayload(date: string): DailySkyPayload {
  const events = computeAstroEvents(new Date(`${date}T00:00:00.000Z`), 45);
  return { date, source: "fallback", events, sky: renderFallbackSky(date, events) };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requested = url.searchParams.get("date");
  const date = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : isoDate();

  if (!hasRedis()) {
    return NextResponse.json(buildFallbackPayload(date));
  }

  const cached = await redis().get<DailySkyPayload>(keys.horoscope(date));
  if (cached) {
    return NextResponse.json(cached);
  }

  const payload = buildFallbackPayload(date);
  await redis().set(keys.horoscope(date), payload, { ex: HOROSCOPE_TTL_SECONDS });
  return NextResponse.json(payload);
}
