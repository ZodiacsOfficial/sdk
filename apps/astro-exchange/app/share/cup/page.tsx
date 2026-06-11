import type { Metadata } from "next";
import Link from "next/link";
import { appConfig, appUrl } from "../../../minikit.config";
import { getCup } from "../../../lib/cup";
import { SignIcon } from "../../../components/SignIcon";

export async function generateMetadata(): Promise<Metadata> {
  const embed = {
    version: "1",
    imageUrl: `${appUrl}/share/cup/opengraph-image`,
    button: {
      title: "Join your sign",
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
    title: "Season Cup",
    other: { "fc:miniapp": JSON.stringify(embed), "fc:frame": JSON.stringify(embed) }
  };
}

export default async function ShareCupPage() {
  const cup = await getCup();
  const top = cup.standings.slice(0, 3).filter((standing) => standing.volumeUsd > 0);

  return (
    <main className="tab-content">
      <section className="card">
        <div className="row" style={{ marginBottom: 8 }}>
          <SignIcon sign={cup.season.sign} size={46} />
          <h2 style={{ margin: 0 }}>{cup.season.displayName} Season Cup</h2>
        </div>
        <p className="muted">
          Sign vs sign on in-app swap volume until {cup.season.endDate}. No prizes — eternal glory.
        </p>
        {top.length > 0 ? (
          <div style={{ display: "grid", gap: 8 }}>
            {top.map((standing, index) => (
              <span key={standing.sign} className="row" style={{ gap: 8 }}>
                <span className="muted">{index + 1}</span>
                <SignIcon sign={standing.sign} size={22} />
                <span style={{ textTransform: "capitalize" }}>{standing.sign}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="muted">The cup is wide open.</p>
        )}
      </section>
      <Link href="/board">Open Zodiacs Astro Exchange →</Link>
      <p className="disclaimer">Entertainment only. Not investment advice.</p>
    </main>
  );
}
