import { NextResponse } from "next/server";
import { computeAstroEvents } from "../../../../lib/astro/events";
import { renderFallbackSky } from "../../../../lib/horoscope/fallback";
import { generateDailySky } from "../../../../lib/horoscope/generate";
import type { DailySkyPayload } from "../../../../lib/horoscope/schema";
import { hasRedis, isoDate, keys, redis } from "../../../../lib/redis";
import { finalizeEndedSeason } from "../../../../lib/cup";

const HOROSCOPE_TTL_SECONDS = 48 * 3600;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV === "development";
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasRedis()) {
    return NextResponse.json({ error: "cron storage unavailable" }, { status: 503 });
  }

  const date = isoDate();
  const events = computeAstroEvents(new Date(`${date}T00:00:00.000Z`), 45);
  const generated = await generateDailySky(date, events);
  const payload: DailySkyPayload = generated
    ? { date, source: "claude", events, sky: generated }
    : { date, source: "fallback", events, sky: renderFallbackSky(date, events) };

  await redis().set(keys.horoscope(date), payload, { ex: HOROSCOPE_TTL_SECONDS });
  try {
    await finalizeEndedSeason();
  } catch {
    // Champion recording is best-effort; the next daily run retries.
  }
  return NextResponse.json({ date, source: payload.source });
}
