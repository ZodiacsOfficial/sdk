import { getBaseZodiacsOwnership } from "@zodiacs/sdk/core";
import type { ZodiacSign } from "@zodiacs/sdk/core";
import { ZODIAC_SIGNS } from "@zodiacs/sdk/core";
import { creditCup } from "../cup";
import { getPriceMap } from "../market";
import { isoWeek, keys, redis } from "../redis";
import { serverPublicClient } from "../viem";
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
  readonly id: string;
  readonly fid: number | null;
  readonly walletAddress: string | null;
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
  readonly fid?: number | null;
  readonly walletAddress?: string | null;
}

function fidFromUserId(userId: string): number | null {
  return /^\d+$/u.test(userId) ? Number(userId) : null;
}

export function displayNameForEntry(entry: Pick<BoardEntry, "fid" | "username" | "walletAddress">) {
  if (entry.username) {
    return entry.username;
  }
  if (entry.walletAddress) {
    return `${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}`;
  }
  return entry.fid ? `fid ${entry.fid}` : "Wallet";
}

/**
 * Links the wallet to the authenticated account. First verified trade wins; a wallet cannot be
 * claimed by two accounts.
 */
export async function linkWallet(userId: string, wallet: string): Promise<boolean> {
  const address = wallet.toLowerCase();
  const existingOwner = await redis().get<string | number>(keys.addr(address));
  if (existingOwner !== null && String(existingOwner) !== userId) {
    return false;
  }
  const linkedAddress = await redis().hget<string>(keys.user(userId), "address");
  if (linkedAddress && linkedAddress.toLowerCase() !== address) {
    return false;
  }
  if (existingOwner === null) {
    await redis().set(keys.addr(address), userId);
  }
  if (!linkedAddress) {
    await redis().hset(keys.user(userId), { address, linkedAt: new Date().toISOString() });
  }
  return true;
}

export async function upsertProfileSnapshot(
  userId: string,
  profile: UserProfileSnapshot
): Promise<void> {
  const fields: Record<string, string> = {};
  if (profile.username) {
    fields["username"] = profile.username.slice(0, 64);
  }
  if (profile.pfpUrl && profile.pfpUrl.startsWith("https://")) {
    fields["pfpUrl"] = profile.pfpUrl.slice(0, 512);
  }
  if (profile.fid) {
    fields["fid"] = String(profile.fid);
  }
  if (profile.walletAddress) {
    fields["address"] = profile.walletAddress.toLowerCase();
  }
  if (Object.keys(fields).length > 0) {
    await redis().hset(keys.user(userId), fields);
  }
}

/** Applies a verified trade to positions and boards. Caller has already claimed txHash. */
export async function creditTrade(userId: string, trade: VerifiedTrade): Promise<void> {
  const client = redis();
  const tradeDate = new Date(trade.blockTimestamp * 1000);
  const week = isoWeek(tradeDate);

  await client.set(keys.trade(trade.txHash), { userId, ...trade });
  await client.zadd(keys.tradesByUser(userId), {
    score: trade.blockTimestamp,
    member: trade.txHash
  });

  let realizedDeltaMicros = 0n;
  for (const leg of trade.legs) {
    const stored = await client.hget<PositionJson>(keys.positions(userId), leg.sign);
    const position = positionFromJson(stored);
    if (leg.direction === "buy") {
      const next = applyBuy(position, BigInt(leg.amountRaw), BigInt(leg.usdMicros));
      await client.hset(keys.positions(userId), { [leg.sign]: positionToJson(next) });
    } else {
      const sale = applySell(position, BigInt(leg.amountRaw), BigInt(leg.usdMicros));
      realizedDeltaMicros += sale.realizedDeltaMicros;
      await client.hset(keys.positions(userId), { [leg.sign]: positionToJson(sale.position) });
    }
  }

  const volumeUsd = microsToUsd(BigInt(trade.volumeUsdMicros));
  await client.zincrby(keys.volumeBoard("alltime"), volumeUsd, userId);
  await client.zincrby(keys.volumeBoard(`w:${week}`), volumeUsd, userId);
  await client.expire(keys.volumeBoard(`w:${week}`), 21 * 86400);

  if (realizedDeltaMicros !== 0n) {
    const realizedUsd = microsToUsd(realizedDeltaMicros);
    await client.zincrby(keys.realizedBoard("alltime"), realizedUsd, userId);
    await client.zincrby(keys.realizedBoard(`w:${week}`), realizedUsd, userId);
    await client.expire(keys.realizedBoard(`w:${week}`), 21 * 86400);
  }

  await client.del(keys.pnlBoardCache());
  await creditCup(trade);
}

interface ZsetEntry {
  readonly id: string;
  readonly score: number;
}

async function readBoardZset(key: string, count: number): Promise<ZsetEntry[]> {
  const raw = await redis().zrange<(string | number)[]>(key, 0, count - 1, {
    rev: true,
    withScores: true
  });
  const entries: ZsetEntry[] = [];
  for (let i = 0; i + 1 < raw.length; i += 2) {
    entries.push({ id: String(raw[i]), score: Number(raw[i + 1]) });
  }
  return entries;
}

async function decorate(entries: readonly ZsetEntry[]): Promise<BoardEntry[]> {
  const decorated: BoardEntry[] = [];
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i]!;
    const user = await redis().hgetall<Record<string, string>>(keys.user(entry.id));
    decorated.push({
      rank: i + 1,
      id: entry.id,
      fid: user?.["fid"] ? Number(user["fid"]) : fidFromUserId(entry.id),
      walletAddress: user?.["address"] ?? null,
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

async function pnlScoreForUser(
  userId: string,
  prices: Record<ZodiacSign, number | null>
): Promise<number> {
  const stored = await redis().hgetall<Record<string, PositionJson>>(keys.positions(userId));
  if (!stored) {
    return 0;
  }
  const wallet = await redis().hget<string>(keys.user(userId), "address");
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

async function computePnlBoard(viewerId: string | null): Promise<BoardEntry[]> {
  const candidates = await readBoardZset(keys.realizedBoard("alltime"), PNL_CANDIDATES);
  const userIds = new Set(candidates.map((entry) => entry.id));
  if (viewerId !== null) {
    userIds.add(viewerId);
  }
  const prices = await getPriceMap();
  const scored: ZsetEntry[] = [];
  for (const userId of userIds) {
    scored.push({ id: userId, score: await pnlScoreForUser(userId, prices) });
  }
  scored.sort((a, b) => b.score - a.score);
  return decorate(scored);
}

export async function getBoard(
  board: "volume" | "pnl",
  window: "weekly" | "alltime",
  viewerId: string | null
): Promise<BoardResponse> {
  const computedAt = new Date().toISOString();

  if (board === "volume") {
    const key =
      window === "weekly" ? keys.volumeBoard(`w:${isoWeek()}`) : keys.volumeBoard("alltime");
    const entries = await decorate(await readBoardZset(key, 50));
    const me = viewerId !== null ? entries.find((entry) => entry.id === viewerId) : undefined;
    return { board, window, computedAt, entries, ...(me ? { me } : {}) };
  }

  if (window === "weekly") {
    const key = keys.realizedBoard(`w:${isoWeek()}`);
    const entries = await decorate(await readBoardZset(key, 50));
    const me = viewerId !== null ? entries.find((entry) => entry.id === viewerId) : undefined;
    return { board, window, computedAt, entries, ...(me ? { me } : {}) };
  }

  const cached = await redis().get<BoardResponse>(keys.pnlBoardCache());
  if (cached && viewerId === null) {
    return cached;
  }
  const lock = await redis().set(keys.pnlBoardLock(), "1", { nx: true, ex: 30 });
  if (!lock && cached) {
    return cached;
  }
  const entries = await computePnlBoard(viewerId);
  const me = viewerId !== null ? entries.find((entry) => entry.id === viewerId) : undefined;
  const response: BoardResponse = { board, window, computedAt, entries, ...(me ? { me } : {}) };
  await redis().set(keys.pnlBoardCache(), response, { ex: PNL_CACHE_TTL_SECONDS });
  return response;
}
