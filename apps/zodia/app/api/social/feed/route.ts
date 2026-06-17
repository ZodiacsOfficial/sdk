import { NextResponse } from "next/server";
import { fetchSocialFeed } from "../../../../lib/social";
import { isZodiacSign } from "../../../../lib/zodiac";

function parseLimit(value: string | null): number {
  const limit = Number(value ?? 25);
  if (!Number.isFinite(limit)) {
    return 25;
  }
  return Math.min(50, Math.max(1, Math.floor(limit)));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sign = url.searchParams.get("sign");
  if (!sign || !isZodiacSign(sign)) {
    return NextResponse.json({ error: "invalid sign" }, { status: 400 });
  }

  try {
    const payload = await fetchSocialFeed({
      sign,
      cursor: url.searchParams.get("cursor"),
      limit: parseLimit(url.searchParams.get("limit"))
    });
    return NextResponse.json(payload, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "social feed unavailable" }, { status: 502 });
  }
}
