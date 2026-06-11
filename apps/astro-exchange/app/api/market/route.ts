import { NextResponse } from "next/server";
import { getMarketPayload } from "../../../lib/market";

export async function GET() {
  try {
    const payload = await getMarketPayload();
    return NextResponse.json(payload, {
      headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=60" }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "market unavailable" },
      { status: 503 }
    );
  }
}
