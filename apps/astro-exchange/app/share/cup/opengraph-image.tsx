import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getCup } from "../../../lib/cup";
import type { ZodiacSign } from "../../../lib/zodiac";

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

export default async function Image() {
  const cup = await getCup();
  const icon = await officialIconDataUrl(cup.season.sign);
  const leaders = cup.standings.slice(0, 3).filter((standing) => standing.volumeUsd > 0);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "radial-gradient(50% 44% at 80% 6%, rgba(255,209,102,0.34), transparent 70%), " +
          "radial-gradient(45% 40% at 14% 16%, rgba(124,108,255,0.46), transparent 70%), " +
          "linear-gradient(180deg, #0a0c24 0%, #05060f 100%)"
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          padding: "52px 96px",
          borderRadius: 48,
          background: "rgba(255,255,255,0.09)",
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow: "inset 0 2px 0 rgba(255,255,255,0.3)",
          color: "#f4f6ff"
        }}
      >
        {icon ? (
          <img src={icon} width={170} height={170} style={{ borderRadius: "50%" }} />
        ) : (
          <div style={{ display: "flex", fontSize: 130 }}>✶</div>
        )}
        <div style={{ display: "flex", fontSize: 58, fontWeight: 700 }}>
          {`${cup.season.displayName} Season Cup`}
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#ffd166" }}>
          {leaders.length > 0
            ? leaders
                .map(
                  (standing, index) =>
                    `${index + 1}. ${standing.sign[0]!.toUpperCase()}${standing.sign.slice(1)}`
                )
                .join("   ")
            : "The cup is wide open"}
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "rgba(226,232,255,0.66)" }}>
          {`Sign vs sign · ends ${cup.season.endDate} · no prizes, eternal glory`}
        </div>
      </div>
    </div>,
    size
  );
}
