import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { appConfig, appUrl } from "../../../../minikit.config";
import { computeAstroEvents } from "../../../../lib/astro/events";
import { renderFallbackSky } from "../../../../lib/horoscope/fallback";
import type { DailySkyPayload } from "../../../../lib/horoscope/schema";
import { hasRedis, isoDate, keys, redis } from "../../../../lib/redis";
import { isZodiacSign } from "../../../../lib/zodiac";
import { SignIcon } from "../../../../components/SignIcon";

interface Params {
  readonly sign: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { sign } = await params;
  const embed = {
    version: "1",
    imageUrl: `${appUrl}/share/horoscope/${sign}/opengraph-image`,
    button: {
      title: "Read today's sky",
      action: {
        type: "launch_miniapp",
        name: appConfig.name,
        url: `${appUrl}/sky`,
        splashImageUrl: appConfig.splashImageUrl,
        splashBackgroundColor: appConfig.splashBackgroundColor
      }
    }
  };
  return {
    title: `${sign} — today's sky`,
    other: { "fc:miniapp": JSON.stringify(embed), "fc:frame": JSON.stringify(embed) }
  };
}

async function loadSky(date: string): Promise<DailySkyPayload> {
  if (hasRedis()) {
    const cached = await redis().get<DailySkyPayload>(keys.horoscope(date));
    if (cached) {
      return cached;
    }
  }
  const events = computeAstroEvents(new Date(`${date}T00:00:00.000Z`), 45);
  return { date, source: "fallback", events, sky: renderFallbackSky(date, events) };
}

export default async function ShareHoroscopePage({ params }: { params: Promise<Params> }) {
  const { sign } = await params;
  if (!isZodiacSign(sign)) {
    notFound();
  }
  const payload = await loadSky(isoDate());
  const reading = payload.sky.signs[sign];

  return (
    <main className="tab-content">
      <section className="card">
        <div className="row" style={{ marginBottom: 8 }}>
          <SignIcon sign={sign} size={46} />
          <h2 style={{ margin: 0, textTransform: "capitalize" }}>
            {sign} — {payload.date}
          </h2>
        </div>
        <p style={{ fontWeight: 600 }}>{reading.vibe}</p>
        <p className="muted">{reading.note}</p>
      </section>
      <Link href="/sky">Open Zodiacs Astro Exchange →</Link>
      <p className="disclaimer">Entertainment only. Not investment advice.</p>
    </main>
  );
}
