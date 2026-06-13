import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { computeAstroEvents } from "../../../../lib/astro/events";
import { renderFallbackSky } from "../../../../lib/horoscope/fallback";
import type { DailySkyPayload } from "../../../../lib/horoscope/schema";
import { hasRedis, isoDate, keys, redis } from "../../../../lib/redis";
import { isZodiacSign } from "../../../../lib/zodiac";
import type { ZodiacSign } from "../../../../lib/zodiac";

export const size = { width: 1200, height: 800 };
export const contentType = "image/png";

async function officialIconDataUrl(sign: ZodiacSign): Promise<string | null> {
  try {
    const file = await readFile(
      join(process.cwd(), "node_modules/@zodiacs/sdk/assets/zodiac-icons/circle", `${sign}.png`)
    );
    return `data:image/png;base64,${file.toString("base64")}`;
  } catch {
    return null;
  }
}

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
  const icon = await officialIconDataUrl(valid);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "radial-gradient(45% 40% at 18% 10%, rgba(124,108,255,0.5), transparent 70%), " +
          "radial-gradient(40% 34% at 85% 24%, rgba(255,156,122,0.36), transparent 70%), " +
          "radial-gradient(48% 42% at 80% 88%, rgba(86,204,242,0.32), transparent 70%), " +
          "linear-gradient(180deg, #0a0c24 0%, #05060f 100%)"
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
          padding: "56px 88px",
          borderRadius: 48,
          background: "rgba(255,255,255,0.09)",
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow: "inset 0 2px 0 rgba(255,255,255,0.3)",
          color: "#f4f6ff"
        }}
      >
        {icon ? (
          <img src={icon} width={190} height={190} style={{ borderRadius: "50%" }} />
        ) : (
          <div style={{ display: "flex", fontSize: 140 }}>✶</div>
        )}
        <div
          style={{ display: "flex", fontSize: 62, textTransform: "capitalize", fontWeight: 700 }}
        >
          {valid}
        </div>
        <div style={{ display: "flex", fontSize: 42, color: "#ffd166" }}>{reading.vibe}</div>
        <div style={{ display: "flex", fontSize: 26, color: "rgba(226,232,255,0.66)" }}>
          {`${date} · Zodia · entertainment only`}
        </div>
      </div>
    </div>,
    size
  );
}
