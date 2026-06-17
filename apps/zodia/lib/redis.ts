import { Redis } from "@upstash/redis";

let client: Redis | null = null;

export function redis(): Redis {
  if (!client) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set");
    }
    client = new Redis({ url, token });
  }
  return client;
}

export function hasRedis(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export const keys = {
  horoscope: (date: string) => `ax:horoscope:${date}`,
  marketSnapshots: () => "ax:market:base",
  marketLock: () => "ax:market:lock",
  user: (userId: string | number) => `ax:user:${userId}`,
  addr: (address: string) => `ax:addr:${address.toLowerCase()}`,
  trade: (txHash: string) => `ax:trade:${txHash.toLowerCase()}`,
  tradeFailures: () => "ax:trade:failures",
  tradesByUser: (userId: string | number) => `ax:trades:${userId}`,
  tradesByFid: (fid: number) => `ax:trades:${fid}`,
  positions: (userId: string | number) => `ax:pos:${userId}`,
  balanceCache: (address: string) => `ax:bal:${address.toLowerCase()}`,
  volumeBoard: (window: string) => `ax:lb:vol:${window}`,
  realizedBoard: (window: string) => `ax:lb:real:${window}`,
  pnlBoardCache: () => "ax:lb:pnl:cache",
  pnlBoardLock: () => "ax:lb:pnl:lock",
  rateLimit: (route: string, userId: string | number, bucket: number) =>
    `ax:rl:${route}:${userId}:${bucket}`,
  authNonce: (address: string) => `ax:auth:nonce:${address.toLowerCase()}`,
  notifFids: () => "ax:notif:fids",
  notifSent: (kind: string, date: string) => `ax:notif:sent:${kind}:${date}`,
  socialFeed: (sign: string, cursor: string, limit: number) => `ax:social:${sign}:${limit}:${cursor}`,
  astroTalkFeed: (cursor: string, limit: number) => `ax:social:astrotalk:${limit}:${cursor}`,
  cup: (seasonKey: string) => `ax:cup:${seasonKey}`,
  cupChampions: () => "ax:cup:champions"
};

export function isoDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function isoWeek(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-${String(week).padStart(2, "0")}`;
}
