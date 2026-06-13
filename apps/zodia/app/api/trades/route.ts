import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireFid } from "../../../lib/auth";
import { getPriceMap } from "../../../lib/market";
import { allowRequest } from "../../../lib/rateLimit";
import { keys, redis } from "../../../lib/redis";
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
  let fid: number;
  try {
    fid = await requireFid(request);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  if (!(await allowRequest("trades", fid, 10, 60))) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const { walletAddress, txHashes, username, pfpUrl } = parsed.data;

  if (!(await linkWallet(fid, walletAddress))) {
    return NextResponse.json({ error: "wallet is linked to a different account" }, { status: 409 });
  }
  await upsertProfileSnapshot(fid, {
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
      skipped.push({ txHash, reason: result.reason });
      continue;
    }

    await creditTrade(fid, result.trade);
    credited.push(result.trade);
  }

  return NextResponse.json({ credited, skipped });
}
