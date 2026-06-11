import { ImageResponse } from "next/og";
import { computeAstroEvents } from "../../../../lib/astro/events";
import { renderFallbackSky } from "../../../../lib/horoscope/fallback";
import type { DailySkyPayload } from "../../../../lib/horoscope/schema";
import { hasRedis, isoDate, keys, redis } from "../../../../lib/redis";
import { SIGN_GLYPHS, isZodiacSign } from "../../../../lib/zodiac";

export const size = { width: 1200, height: 800 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ sign: string }> }) {
  const { sign } = await params;
  const valid = isZodiacSign(sign) ? sign : "aries";
  const date = isoDate();

  let payload: DailySkyPayload | null = null;
  if (hasRedis()) {
    payload = await redis().get<DailySkyPayload>(keys.horoscope(date));
  }
  if (!payload) {
    const events = computeAstroEvents(new Date(`${date}T00:00:00.000Z`), 45);
    payload = { date, source: "fallback", events, sky: renderFallbackSky(date, events) };
  }
  const reading = payload.sky.signs[valid];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
        background: "linear-gradient(160deg, #0b0d1a 0%, #1d2440 100%)",
        color: "#e8eaf6",
        fontSize: 40
      }}
    >
      <div style={{ fontSize: 140 }}>{SIGN_GLYPHS[valid]}</div>
      <div style={{ fontSize: 64, textTransform: "capitalize", fontWeight: 700 }}>{valid}</div>
      <div style={{ fontSize: 44, color: "#ffd166" }}>{reading.vibe}</div>
      <div style={{ fontSize: 28, color: "#9aa3c7" }}>
        {date} · Zodiacs Astro Exchange · entertainment only
      </div>
    </div>,
    size
  );
}
