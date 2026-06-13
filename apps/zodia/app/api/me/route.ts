import { NextResponse } from "next/server";
import { AuthError, requireFid } from "../../../lib/auth";
import { keys, redis } from "../../../lib/redis";

export async function GET(request: Request) {
  try {
    const fid = await requireFid(request);
    const user = await redis().hgetall<Record<string, string>>(keys.user(fid));
    return NextResponse.json({
      fid,
      address: user?.["address"] ?? null,
      username: user?.["username"] ?? null,
      pfpUrl: user?.["pfpUrl"] ?? null,
      notifEnabled: Boolean(user?.["notifToken"])
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }
}
