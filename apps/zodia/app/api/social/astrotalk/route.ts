import { NextResponse } from "next/server";
import { fetchAstroTalkFeed } from "../../../../lib/social";

function parseLimit(value: string | null): number {
  const limit = Number(value ?? 25);
  if (!Number.isFinite(limit)) {
    return 25;
  }
  return Math.min(50, Math.max(1, Math.floor(limit)));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const payload = await fetchAstroTalkFeed({
      cursor: url.searchParams.get("cursor"),
      limit: parseLimit(url.searchParams.get("limit"))
    });
    return NextResponse.json(payload, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "astrotalk unavailable" }, { status: 502 });
  }
}
