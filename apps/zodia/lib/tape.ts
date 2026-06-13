import type { ZodiacSign } from "@zodiacs/sdk/core";
import { hasRedis, keys, redis } from "./redis";
import { microsToUsd } from "./trades/pnl";
import type { VerifiedTrade } from "./trades/verify";

export interface TradeTapeItem {
  readonly type: "trade";
  readonly id: string;
  readonly ts: number;
  readonly fid: number;
  readonly username: string | null;
  readonly pfpUrl: string | null;
  readonly txHash: string;
  readonly legs: readonly { sign: ZodiacSign; direction: "buy" | "sell"; usd: number }[];
  readonly volumeUsd: number;
}

export interface SkyTapeItem {
  readonly type: "sky";
  readonly id: string;
  readonly ts: number;
  readonly date: string;
  readonly headline: string;
  readonly marketMood: string;
}

export type TapeItem = TradeTapeItem | SkyTapeItem;

const TAPE_MAX_ITEMS = 300;

function tapeId(ts: number): string {
  return `${ts.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** The dominant leg of a trade — what the feed line leads with. */
export function primaryLeg(item: TradeTapeItem): TradeTapeItem["legs"][number] | null {
  let best: TradeTapeItem["legs"][number] | null = null;
  for (const leg of item.legs) {
    if (!best || leg.usd > best.usd) {
      best = leg;
    }
  }
  return best;
}

export function relativeTime(ts: number, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - ts) / 1000));
  if (seconds < 60) {
    return "now";
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h`;
  }
  return `${Math.floor(seconds / 86400)}d`;
}

async function push(item: TapeItem): Promise<void> {
  await redis().lpush(keys.tape(), item);
  await redis().ltrim(keys.tape(), 0, TAPE_MAX_ITEMS - 1);
}

export async function pushTradeTapeItem(fid: number, trade: VerifiedTrade): Promise<void> {
  const user = await redis().hgetall<Record<string, string>>(keys.user(fid));
  const ts = Date.now();
  await push({
    type: "trade",
    id: tapeId(ts),
    ts,
    fid,
    username: user?.["username"] ?? null,
    pfpUrl: user?.["pfpUrl"] ?? null,
    txHash: trade.txHash,
    legs: trade.legs.map((leg) => ({
      sign: leg.sign,
      direction: leg.direction,
      usd: Math.round(microsToUsd(BigInt(leg.usdMicros)) * 100) / 100
    })),
    volumeUsd: Math.round(microsToUsd(BigInt(trade.volumeUsdMicros)) * 100) / 100
  });
}

export async function pushSkyTapeItem(
  date: string,
  headline: string,
  marketMood: string
): Promise<void> {
  const ts = Date.now();
  await push({ type: "sky", id: tapeId(ts), ts, date, headline, marketMood });
}

/**
 * Local-preview fixtures, served only in development when no Redis is configured, so the feed
 * can be designed against. Production with missing Redis returns an empty tape.
 */
function devFixtures(now: number): TapeItem[] {
  const mk = (
    minutesAgo: number,
    fid: number,
    username: string,
    sign: ZodiacSign,
    direction: "buy" | "sell",
    usd: number
  ): TradeTapeItem => ({
    type: "trade",
    id: `dev-${fid}-${minutesAgo}`,
    ts: now - minutesAgo * 60000,
    fid,
    username,
    pfpUrl: null,
    txHash: `0x${"0".repeat(64)}`,
    legs: [{ sign, direction, usd }],
    volumeUsd: usd
  });
  return [
    mk(2, 101, "astra", "leo", "buy", 42),
    mk(9, 102, "moonunit", "scorpio", "sell", 18.5),
    {
      type: "sky",
      id: "dev-sky",
      ts: now - 26 * 60000,
      date: new Date(now).toISOString().slice(0, 10),
      headline: "Mercury steadies, moods lift",
      marketMood: "balanced"
    },
    mk(48, 103, "orbitmaxi", "gemini", "buy", 120),
    mk(95, 104, "nova.base", "pisces", "buy", 7),
    mk(180, 105, "saturnine", "capricorn", "sell", 64)
  ];
}

export async function readTape(limit: number): Promise<TapeItem[]> {
  if (!hasRedis()) {
    return process.env.NODE_ENV === "development" ? devFixtures(Date.now()).slice(0, limit) : [];
  }
  return redis().lrange<TapeItem>(keys.tape(), 0, limit - 1);
}
