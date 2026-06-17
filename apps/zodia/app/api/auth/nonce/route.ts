import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getAddress } from "viem";
import { buildWalletSignInMessage } from "../../../../lib/auth";
import { hasRedis, keys, redis } from "../../../../lib/redis";

export async function GET(request: Request) {
  if (!hasRedis()) {
    return NextResponse.json({ error: "wallet auth unavailable" }, { status: 503 });
  }
  const url = new URL(request.url);
  const rawAddress = url.searchParams.get("address");
  if (!rawAddress) {
    return NextResponse.json({ error: "missing address" }, { status: 400 });
  }
  let address: string;
  try {
    address = getAddress(rawAddress).toLowerCase();
  } catch {
    return NextResponse.json({ error: "invalid address" }, { status: 400 });
  }
  const nonce = randomBytes(16).toString("hex");
  const domain = url.host;
  await redis().set(keys.authNonce(address), nonce, { ex: 10 * 60 });
  return NextResponse.json({
    address,
    nonce,
    message: buildWalletSignInMessage({ address, domain, nonce })
  });
}
