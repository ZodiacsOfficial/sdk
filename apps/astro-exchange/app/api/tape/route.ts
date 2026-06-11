import { NextResponse } from "next/server";
import { readTape } from "../../../lib/tape";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 30)));
  const items = await readTape(limit);
  return NextResponse.json({ items });
}
