import { NextResponse } from "next/server";
import { AuthConfigError, AuthError, requireUser } from "../../../lib/auth";
import { hasRedis, keys, redis } from "../../../lib/redis";

export async function GET(request: Request) {
  try {
    const identity = await requireUser(request);
    if (!hasRedis()) {
      return NextResponse.json({
        id: identity.id,
        fid: identity.fid,
        walletAddress: identity.walletAddress,
        address: identity.walletAddress,
        username: null,
        pfpUrl: null,
        notifEnabled: false
      });
    }

    const user = await redis().hgetall<Record<string, string>>(keys.user(identity.id));
    return NextResponse.json({
      id: identity.id,
      fid: identity.fid,
      walletAddress: identity.walletAddress ?? user?.["address"] ?? null,
      address: user?.["address"] ?? null,
      username: user?.["username"] ?? null,
      pfpUrl: user?.["pfpUrl"] ?? null,
      notifEnabled: Boolean(user?.["notifToken"])
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof AuthConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
