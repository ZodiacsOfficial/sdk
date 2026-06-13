import { NextResponse } from "next/server";
import { optionalFid } from "../../../lib/auth";
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
  const viewerFid = await optionalFid(request);
  const response = await getBoard(board, window, viewerFid);
  return NextResponse.json(response);
}
