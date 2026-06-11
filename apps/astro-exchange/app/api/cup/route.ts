import { NextResponse } from "next/server";
import { getCup } from "../../../lib/cup";

export async function GET() {
  const cup = await getCup();
  return NextResponse.json(cup, {
    headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=60" }
  });
}
