import { getBaseZodiacsOwnership } from "@zodiacs/sdk/core";
import type { ZodiacSign } from "@zodiacs/sdk/core";
import { ZODIAC_SIGNS } from "@zodiacs/sdk/core";
import { isoWeek, keys, redis } from "../redis";
import { serverPublicClient } from "../viem";
import { getPriceMap } from "../market";
import { baseDecimalsForSign } from "../zodiac";
import {
  applyBuy,
  applySell,
  microsToUsd,
  positionFromJson,
  positionToJson,
  unrealizedMicros
} from "./pnl";
import type { PositionJson } from "./pnl";
import type { VerifiedTrade } from "./verify";

export interface BoardEntry {
  readonly rank: number;
  readonly fid: number;
  readonly username: string | null;
  readonly pfpUrl: string | null;
  readonly score: number;
}

export interface BoardResponse {
  readonly board: "volume" | "pnl";
  readonly window: "weekly" | "alltime";
  readonly computedAt: string;
  readonly entries: readonly BoardEntry[];
  readonly me?: BoardEntry;
}

const PNL_CANDIDATES = 50;
const PNL_CACHE_TTL_SECONDS = 120;
const BALANCE_CACHE_TTL_SECONDS = 600;

export interface UserProfileSnapshot {
  readonly username?: string;
  readonly pfpUrl?: string;
}

/**
 * Links the wallet to the fid (first verified trade wins) and rejects wallets already claimed
 * by another fid. Returns false when the link is not allowed.
 */
export async function linkWallet(fid: number, wallet: string): Promise<boolean> {
  const address = wallet.toLowerCase();
  const existingOwner = await redis().get<number>(keys.addr(address));
  if (existingOwner !== null && Number(existingOwner) !== fid) {
    return false;
  }
  const linkedAddress = await redis().hget<string>(keys.user(fid), "address");
  if (linkedAddress && linkedAddress.toLowerCase() !== address) {
    return false;
  }
  if (existingOwner === null) {
    await redis().set(keys.addr(address), fid);
  }
  if (!linkedAddress) {
    await redis().hset(keys.user(fid), { address, linkedAt: new Date().toISOString() });
  }
  return true;
}

export async function upsertProfileSnapshot(
  fid: number,
  profile: UserProfileSnapshot
): Promise<void> {
  const fields: Record<string, string> = {};
  if (profile.username) {
    fields["username"] = profile.username.slice(0, 64);
  }
  if (profile.pfpUrl && profile.pfpUrl.startsWith("https://")) {
    fields["pfpUrl"] = profile.pfpUrl.slice(0, 512);
  }
  if (Object.keys(fields).length > 0) {
    await redis().hset(keys.user(fid), fields);
  }
}

/** Applies a verified trade to positions and boards. Caller has already claimed txHash. */
export async function creditTrade(fid: number, trade: VerifiedTrade): Promise<void> {
  const client = redis();
  const tradeDate = new Date(trade.blockTimestamp * 1000);
  const week = isoWeek(tradeDate);

  await client.set(keys.trade(trade.txHash), { fid, ...trade });
  await client.zadd(keys.tradesByFid(fid), {
    score: trade.blockTimestamp,
    member: trade.txHash
  });

  let realizedDeltaMicros = 0n;
  for (const leg of trade.legs) {
    const stored = await client.hget<PositionJson>(keys.positions(fid), leg.sign);
    const position = positionFromJson(stored);
    if (leg.direction === "buy") {
      const next = applyBuy(position, BigInt(leg.amountRaw), BigInt(leg.usdMicros));
      await client.hset(keys.positions(fid), { [leg.sign]: positionToJson(next) });
    } else {
      const sale = applySell(position, BigInt(leg.amountRaw), BigInt(leg.usdMicros));
      realizedDeltaMicros += sale.realizedDeltaMicros;
      await client.hset(keys.positions(fid), { [leg.sign]: positionToJson(sale.position) });
    }
  }

  const volumeUsd = microsToUsd(BigInt(trade.volumeUsdMicros));
  await client.zincrby(keys.volumeBoard("alltime"), volumeUsd, fid);
  await client.zincrby(keys.volumeBoard(`w:${week}`), volumeUsd, fid);
  await client.expire(keys.volumeBoard(`w:${week}`), 21 * 86400);

  if (realizedDeltaMicros !== 0n) {
    const realizedUsd = microsToUsd(realizedDeltaMicros);
    await client.zincrby(keys.realizedBoard("alltime"), realizedUsd, fid);
    await client.zincrby(keys.realizedBoard(`w:${week}`), realizedUsd, fid);
    await client.expire(keys.realizedBoard(`w:${week}`), 21 * 86400);
  }

  await client.del(keys.pnlBoardCache());
}

interface ZsetEntry {
  readonly fid: number;
  readonly score: number;
}

async function readBoardZset(key: string, count: number): Promise<ZsetEntry[]> {
  const raw = await redis().zrange<(string | number)[]>(key, 0, count - 1, {
    rev: true,
    withScores: true
  });
  const entries: ZsetEntry[] = [];
  for (let i = 0; i + 1 < raw.length; i += 2) {
    entries.push({ fid: Number(raw[i]), score: Number(raw[i + 1]) });
  }
  return entries;
}

async function decorate(entries: readonly ZsetEntry[]): Promise<BoardEntry[]> {
  const decorated: BoardEntry[] = [];
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i]!;
    const user = await redis().hgetall<Record<string, string>>(keys.user(entry.fid));
    decorated.push({
      rank: i + 1,
      fid: entry.fid,
      username: user?.["username"] ?? null,
      pfpUrl: user?.["pfpUrl"] ?? null,
      score: Math.round(entry.score * 100) / 100
    });
  }
  return decorated;
}

async function onChainBalances(
  wallet: string
): Promise<Partial<Record<ZodiacSign, bigint>> | null> {
  const cacheKey = keys.balanceCache(wallet);
  const cached = await redis().get<Record<string, string>>(cacheKey);
  if (cached) {
    const parsed: Partial<Record<ZodiacSign, bigint>> = {};
    for (const sign of ZODIAC_SIGNS) {
      const value = cached[sign];
      if (value !== undefined) {
        parsed[sign] = BigInt(value);
      }
    }
    return parsed;
  }
  try {
    const ownership = await getBaseZodiacsOwnership(serverPublicClient(), wallet, {
      onPartialFailure: "warn"
    });
    const balances: Partial<Record<ZodiacSign, bigint>> = {};
    const serialized: Record<string, string> = {};
    for (const holding of ownership.holdings) {
      const raw = BigInt(holding.balance.rawAmount);
      balances[holding.sign] = raw;
      serialized[holding.sign] = raw.toString();
    }
    await redis().set(cacheKey, serialized, { ex: BALANCE_CACHE_TTL_SECONDS });
    return balances;
  } catch {
    return null;
  }
}

async function pnlScoreForFid(
  fid: number,
  prices: Record<ZodiacSign, number | null>
): Promise<number> {
  const stored = await redis().hgetall<Record<string, PositionJson>>(keys.positions(fid));
  if (!stored) {
    return 0;
  }
  const wallet = await redis().hget<string>(keys.user(fid), "address");
  const balances = wallet ? await onChainBalances(wallet) : null;
  let totalMicros = 0n;
  for (const sign of ZODIAC_SIGNS) {
    const json = stored[sign];
    if (!json) {
      continue;
    }
    const position = positionFromJson(json);
    totalMicros += position.realizedUsdMicros;
    totalMicros += unrealizedMicros(
      position,
      balances ? (balances[sign] ?? 0n) : null,
      baseDecimalsForSign(sign),
      prices[sign]
    );
  }
  return microsToUsd(totalMicros);
}

async function computePnlBoard(viewerFid: number | null): Promise<BoardEntry[]> {
  const candidates = await readBoardZset(keys.realizedBoard("alltime"), PNL_CANDIDATES);
  const fids = new Set(candidates.map((entry) => entry.fid));
  if (viewerFid !== null) {
    fids.add(viewerFid);
  }
  const prices = await getPriceMap();
  const scored: ZsetEntry[] = [];
  for (const fid of fids) {
    scored.push({ fid, score: await pnlScoreForFid(fid, prices) });
  }
  scored.sort((a, b) => b.score - a.score);
  return decorate(scored);
}

export async function getBoard(
  board: "volume" | "pnl",
  window: "weekly" | "alltime",
  viewerFid: number | null
): Promise<BoardResponse> {
  const computedAt = new Date().toISOString();

  if (board === "volume") {
    const key =
      window === "weekly" ? keys.volumeBoard(`w:${isoWeek()}`) : keys.volumeBoard("alltime");
    const entries = await decorate(await readBoardZset(key, 50));
    const me = viewerFid !== null ? entries.find((entry) => entry.fid === viewerFid) : undefined;
    return { board, window, computedAt, entries, ...(me ? { me } : {}) };
  }

  if (window === "weekly") {
    const key = keys.realizedBoard(`w:${isoWeek()}`);
    const entries = await decorate(await readBoardZset(key, 50));
    const me = viewerFid !== null ? entries.find((entry) => entry.fid === viewerFid) : undefined;
    return { board, window, computedAt, entries, ...(me ? { me } : {}) };
  }

  const cached = await redis().get<BoardResponse>(keys.pnlBoardCache());
  if (cached && viewerFid === null) {
    return cached;
  }
  const lock = await redis().set(keys.pnlBoardLock(), "1", { nx: true, ex: 30 });
  if (!lock && cached) {
    return cached;
  }
  const entries = await computePnlBoard(viewerFid);
  const me = viewerFid !== null ? entries.find((entry) => entry.fid === viewerFid) : undefined;
  const response: BoardResponse = { board, window, computedAt, entries, ...(me ? { me } : {}) };
  await redis().set(keys.pnlBoardCache(), response, { ex: PNL_CACHE_TTL_SECONDS });
  return response;
}
