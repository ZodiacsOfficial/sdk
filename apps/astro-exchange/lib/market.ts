import { createDexScreenerMarketAdapter, getBaseZodiacMarket } from "@zodiacs/sdk/market";
import { ZODIAC_SIGNS } from "@zodiacs/sdk/core";
import type { ZodiacSign } from "@zodiacs/sdk/core";
import { hasRedis, keys, redis } from "./redis";

export interface MarketSnapshotLite {
  readonly sign: ZodiacSign;
  readonly priceUsd: number | null;
  readonly change24h: number | null;
  readonly volume24h: number | null;
  readonly liquidity: number | null;
  readonly status: "ok" | "unavailable";
}

export interface MarketPayload {
  readonly updatedAt: string;
  readonly snapshots: readonly MarketSnapshotLite[];
}

const CACHE_TTL_SECONDS = 60;

async function fetchSnapshots(): Promise<MarketPayload> {
  const adapter = createDexScreenerMarketAdapter();
  const snapshots = await Promise.all(
    ZODIAC_SIGNS.map(async (sign): Promise<MarketSnapshotLite> => {
      const data = await getBaseZodiacMarket(adapter, sign);
      return {
        sign,
        priceUsd: data.priceUsd,
        change24h: data.change24h,
        volume24h: data.volume24h,
        liquidity: data.liquidity,
        status: data.status === "ok" ? "ok" : "unavailable"
      };
    })
  );
  return { updatedAt: new Date().toISOString(), snapshots };
}

export async function getMarketPayload(): Promise<MarketPayload> {
  if (!hasRedis()) {
    return fetchSnapshots();
  }
  const cached = await redis().get<MarketPayload>(keys.marketSnapshots());
  if (cached) {
    return cached;
  }
  const lock = await redis().set(keys.marketLock(), "1", { nx: true, ex: 10 });
  const payload = await fetchSnapshots();
  if (lock) {
    await redis().set(keys.marketSnapshots(), payload, { ex: CACHE_TTL_SECONDS });
  }
  return payload;
}

export async function getPriceMap(): Promise<Record<ZodiacSign, number | null>> {
  const payload = await getMarketPayload();
  const prices = {} as Record<ZodiacSign, number | null>;
  for (const sign of ZODIAC_SIGNS) {
    const snapshot = payload.snapshots.find((entry) => entry.sign === sign);
    prices[sign] = snapshot ? snapshot.priceUsd : null;
  }
  return prices;
}
