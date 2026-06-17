import { NextResponse } from "next/server";
import { optionalUser } from "../../../lib/auth";
import { hasRedis } from "../../../lib/redis";
import { getBoard } from "../../../lib/trades/leaderboard";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const board = url.searchParams.get("board") === "pnl" ? "pnl" : "volume";
  const window = url.searchParams.get("window") === "weekly" ? "weekly" : "alltime";
  if (!hasRedis()) {
    return NextResponse.json({
      board,
      window,
      computedAt: new Date().toISOString(),
      entries: []
    });
  }
  const viewer = await optionalUser(request);
  const response = await getBoard(board, window, viewer?.id ?? null);
  return NextResponse.json(response);
}
