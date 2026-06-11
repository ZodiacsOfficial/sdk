import type { Metadata } from "next";
import Link from "next/link";
import { appConfig, appUrl } from "../../../../minikit.config";
import { hasRedis, keys, redis } from "../../../../lib/redis";
import type { VerifiedTrade } from "../../../../lib/trades/verify";
import { SIGN_GLYPHS } from "../../../../lib/zodiac";

interface Params {
  readonly txHash: string;
}

export async function generateMetadata(): Promise<Metadata> {
  const embed = {
    version: "1",
    imageUrl: appConfig.heroImageUrl,
    button: {
      title: "Trade the twelve",
      action: {
        type: "launch_miniapp",
        name: appConfig.name,
        url: `${appUrl}/exchange`,
        splashImageUrl: appConfig.splashImageUrl,
        splashBackgroundColor: appConfig.splashBackgroundColor
      }
    }
  };
  return {
    title: "A cosmic move",
    other: { "fc:miniapp": JSON.stringify(embed), "fc:frame": JSON.stringify(embed) }
  };
}

export default async function ShareTradePage({ params }: { params: Promise<Params> }) {
  const { txHash } = await params;
  let trade: (VerifiedTrade & { fid: number }) | null = null;
  if (hasRedis() && /^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    const stored = await redis().get<VerifiedTrade & { fid: number }>(keys.trade(txHash));
    if (stored && typeof stored === "object") {
      trade = stored;
    }
  }

  return (
    <main className="tab-content">
      <section className="card">
        <h2>A cosmic move</h2>
        {trade ? (
          <p>
            Someone made a move on{" "}
            {trade.legs
              .map((leg) => `${SIGN_GLYPHS[leg.sign]} ${leg.sign} (${leg.direction})`)
              .join(", ")}{" "}
            via Zodiacs Astro Exchange.
          </p>
        ) : (
          <p className="muted">The stars have no record of this one (yet).</p>
        )}
      </section>
      <Link href="/exchange">Open Zodiacs Astro Exchange →</Link>
      <p className="disclaimer">Entertainment only. Not investment advice.</p>
    </main>
  );
}
