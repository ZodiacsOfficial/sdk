import type { Metadata } from "next";
import Link from "next/link";
import { appConfig, appUrl } from "../../../../minikit.config";
import { getBoard } from "../../../../lib/trades/leaderboard";

interface Params {
  readonly fid: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { fid } = await params;
  const embed = {
    version: "1",
    imageUrl: appConfig.heroImageUrl,
    button: {
      title: "See the board",
      action: {
        type: "launch_miniapp",
        name: appConfig.name,
        url: `${appUrl}/board`,
        splashImageUrl: appConfig.splashImageUrl,
        splashBackgroundColor: appConfig.splashBackgroundColor
      }
    }
  };
  return {
    title: `Leaderboard rank — fid ${fid}`,
    other: { "fc:miniapp": JSON.stringify(embed), "fc:frame": JSON.stringify(embed) }
  };
}

export default async function ShareRankPage({ params }: { params: Promise<Params> }) {
  const { fid } = await params;
  const viewer = Number(fid);
  const board = Number.isInteger(viewer) ? await getBoard("volume", "alltime", viewer) : null;
  const me = board?.me ?? board?.entries.find((entry) => entry.fid === viewer);

  return (
    <main className="tab-content">
      <section className="card">
        <h2>Cosmic leaderboard</h2>
        {me ? (
          <p>
            {me.username ?? `fid ${me.fid}`} is #{me.rank} by zodiac swap volume.
          </p>
        ) : (
          <p className="muted">This stargazer has not hit the board yet.</p>
        )}
      </section>
      <Link href="/board">Open Zodiacs Astro Exchange →</Link>
      <p className="disclaimer">
        Boards rank only swaps started inside the app. Entertainment leaderboard — no prizes.
      </p>
    </main>
  );
}
