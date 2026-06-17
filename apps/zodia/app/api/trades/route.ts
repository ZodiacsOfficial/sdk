import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthConfigError, AuthError, requireUser } from "../../../lib/auth";
import { getPriceMap } from "../../../lib/market";
import { allowRequest } from "../../../lib/rateLimit";
import { hasRedis, keys, redis } from "../../../lib/redis";
import { creditTrade, linkWallet, upsertProfileSnapshot } from "../../../lib/trades/leaderboard";
import { verifyTradeTx } from "../../../lib/trades/verify";
import type { VerifiedTrade } from "../../../lib/trades/verify";
import { serverPublicClient } from "../../../lib/viem";

const BodySchema = z.object({
  walletAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  txHashes: z
    .array(z.string().regex(/^0x[0-9a-fA-F]{64}$/))
    .min(1)
    .max(5),
  username: z.string().max(64).optional(),
  pfpUrl: z.string().max(512).optional()
});

interface Skipped {
  readonly txHash: string;
  readonly reason: string;
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof AuthConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }

  if (!hasRedis()) {
    return NextResponse.json({ error: "trade storage unavailable" }, { status: 503 });
  }

  if (!(await allowRequest("trades", user.id, 10, 60))) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const { walletAddress, txHashes, username, pfpUrl } = parsed.data;

  if (user.walletAddress && user.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
    return NextResponse.json({ error: "wallet does not match session" }, { status: 403 });
  }

  if (!(await linkWallet(user.id, walletAddress))) {
    return NextResponse.json({ error: "wallet is linked to a different account" }, { status: 409 });
  }
  await upsertProfileSnapshot(user.id, {
    fid: user.fid,
    walletAddress,
    ...(username ? { username } : {}),
    ...(pfpUrl ? { pfpUrl } : {})
  });

  const prices = await getPriceMap();
  const credited: VerifiedTrade[] = [];
  const skipped: Skipped[] = [];

  for (const txHash of txHashes) {
    const tradeKey = keys.trade(txHash);
    const claimed = await redis().set(tradeKey, "pending", { nx: true, ex: 900 });
    if (!claimed) {
      const existing = await redis().get<unknown>(tradeKey);
      skipped.push({
        txHash,
        reason: existing === "pending" ? "in-progress" : "already-credited"
      });
      continue;
    }

    const result = await verifyTradeTx(serverPublicClient(), walletAddress, txHash, { prices });
    if (!result.ok) {
      await redis().del(tradeKey);
      await redis().lpush(keys.tradeFailures(), {
        userId: user.id,
        walletAddress,
        txHash,
        reason: result.reason,
        ts: Date.now()
      });
      await redis().ltrim(keys.tradeFailures(), 0, 99);
      skipped.push({ txHash, reason: result.reason });
      continue;
    }

    await creditTrade(user.id, result.trade);
    credited.push(result.trade);
  }

  return NextResponse.json({ credited, skipped });
}
